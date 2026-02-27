import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 600

const rateLimitMaxRequests = 1000
const ratelimitWindow = '1d' as Duration

// SSE event types:
//   meta       — fragment metadata (title, template, description, etc.)
//   file_start — new file starting (file_path)
//   file_chunk — code chunk for current file (delta text)
//   file_done  — current file complete (full code)
//   step_done  — one agent loop step complete
//   loop_done  — all files generated
//   error      — error occurred

function sseEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return createRateLimitResponse(limit)
  }

  const { model: _modelName, apiKey: _apiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  // Create SSE stream
  const encoder = new TextEncoder()
  let controllerRef: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
    },
    cancel() {
      controllerRef = null
    },
  })

  // Run agent loop in background
  ;(async () => {
    const send = (type: string, data: unknown) => {
      if (!controllerRef) return
      try {
        controllerRef.enqueue(encoder.encode(sseEvent(type, data)))
      } catch {}
    }

    const accumulatedFiles: Array<{ file_path: string; code: string }> = []
    let baseMeta: Record<string, unknown> = {}
    let stepNumber = 0
    const MAX_STEPS = 30

    try {
      while (stepNumber < MAX_STEPS) {
        if (!controllerRef) break
        stepNumber++

        const currentFiles = accumulatedFiles.map(f => ({
          path: f.file_path,
          content: f.code,
        }))

        const systemPrompt = toPrompt(template)

        let stepResult: Record<string, unknown> = {}
        let currentFilePath = ''
        let currentFileCode = ''
        let lastEmittedCode = ''

        try {
          const objectStream = await streamObject({
            model: modelClient as LanguageModel,
            schema,
            mode: 'json',
            system: systemPrompt,
            messages,
            maxRetries: 3,
            ...modelParams,
          })

          // Stream partial objects from AI SDK
          for await (const partial of objectStream.partialObjectStream) {
            if (!controllerRef) break

            // Send metadata once when first available
            if (!baseMeta.template && partial.template) {
              baseMeta = {
                template: partial.template,
                title: partial.title,
                description: partial.description,
                port: partial.port,
                additional_dependencies: partial.additional_dependencies,
                has_additional_dependencies: partial.has_additional_dependencies,
                install_dependencies_command: partial.install_dependencies_command,
              }
              send('meta', baseMeta)
            }

            // Update metadata fields as they stream in
            if (partial.title && partial.title !== baseMeta.title) {
              baseMeta.title = partial.title
              send('meta', baseMeta)
            }

            // Handle code array — exactly 1 file per step
            const codeArr = partial.code as Array<{ file_path?: string; code?: string }> | undefined
            if (Array.isArray(codeArr) && codeArr.length > 0) {
              const fileObj = codeArr[0]
              const newPath = fileObj?.file_path || ''
              const newCode = fileObj?.code || ''

              // Announce new file when path first appears
              if (newPath && newPath !== currentFilePath) {
                if (currentFilePath) {
                  // Close previous file
                  send('file_done', { file_path: currentFilePath, code: currentFileCode })
                }
                currentFilePath = newPath
                currentFileCode = ''
                lastEmittedCode = ''
                send('file_start', { file_path: currentFilePath })
              }

              // Stream code delta — only send new characters
              if (newCode && newCode.length > lastEmittedCode.length) {
                const delta = newCode.slice(lastEmittedCode.length)
                send('file_chunk', { file_path: currentFilePath, delta })
                lastEmittedCode = newCode
                currentFileCode = newCode
              }
            }

            stepResult = partial as Record<string, unknown>
          }

          // Close last file of this step
          if (currentFilePath) {
            send('file_done', { file_path: currentFilePath, code: currentFileCode })
          }

        } catch (err: any) {
          send('error', { message: err?.message || 'Stream error', step: stepNumber })
          break
        }

        // Accumulate file from this step
        if (currentFilePath) {
          const existing = accumulatedFiles.findIndex(f => f.file_path === currentFilePath)
          if (existing >= 0) {
            accumulatedFiles[existing].code = currentFileCode
          } else {
            accumulatedFiles.push({ file_path: currentFilePath, code: currentFileCode })
          }
        }

        // Signal step complete
        send('step_done', {
          step: stepNumber,
          file_path: currentFilePath,
          is_complete: (stepResult as any).is_complete === true,
          next_file_hint: (stepResult as any).next_file_hint || null,
          files_so_far: accumulatedFiles.length,
        })

        // Check if agent loop is done
        if ((stepResult as any).is_complete === true) break
      }

      // All done — send final summary
      send('loop_done', {
        files: accumulatedFiles,
        meta: baseMeta,
        total_steps: stepNumber,
      })

    } catch (err: any) {
      send('error', { message: err?.message || 'Agent loop error' })
    } finally {
      if (controllerRef) {
        try { (controllerRef as any).close() } catch {}
        controllerRef = null
      }
    }
  })()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
