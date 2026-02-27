import { handleAPIError, createRateLimitResponse } from '@/lib/api-errors'
import { Duration } from '@/lib/duration'
import { getModelClient, LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 300

const rateLimitMaxRequests = 1000; // Hardcoded
const ratelimitWindow = '1d' as Duration; // Hardcoded

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

  console.log('userID', userID)
  console.log('teamID', teamID)
  console.log('model', model)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  try {
    console.log('Starting streamObject with model:', modelNameString)
    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      mode: 'json',
      system: toPrompt(template),
      messages,
      maxRetries: 3, // retry on transient network errors
      ...modelParams,
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    console.error('Detailed streamObject error:', error)
    return handleAPIError(error, { hasOwnApiKey: !!config.apiKey })
  }
}
