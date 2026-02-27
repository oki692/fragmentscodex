import { createOpenAI } from '@ai-sdk/openai'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  // Strip optional ::provider suffix used to make duplicate model IDs unique in the UI
  const { id: rawId, providerId } = model
  const modelNameString = rawId.includes('::') ? rawId.split('::')[0] : rawId
  const { apiKey, baseURL } = config

  const providerConfigs = {
    nvidia: () =>
      createOpenAI({
        apiKey: apiKey || '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',
        baseURL: baseURL || 'https://integrate.api.nvidia.com/v1',
      })(modelNameString),
  }

  const createClient =
    providerConfigs[providerId as keyof typeof providerConfigs]

  if (!createClient) {
    throw new Error(`Unsupported provider: ${providerId}`)
  }

  return createClient()
}
