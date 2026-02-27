import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { toAgentLoopPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = 1000
const ratelimitWindow = '1d' as Duration

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
    currentFiles,
    stage,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
    currentFiles?: Array<{ path: string; content: string }>
    stage?: 'analysis' | 'design' | 'generation' | 'validation'
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

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  try {
    const systemPrompt = toAgentLoopPrompt(template, {
      currentFiles,
      stage: stage || 'analysis',
    })

    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      mode: 'json',
      system: systemPrompt,
      messages,
      maxRetries: 3,
      ...modelParams,
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    console.error('Detailed agent loop error:', error)
    return handleAPIError(error, { hasOwnApiKey: !!config.apiKey })
  }
}
