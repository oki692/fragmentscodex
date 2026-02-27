'use server'

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { LLMModel, LLMModelConfig } from '@/lib/models'

// Hardcoded API keys for NVIDIA provider
const API_KEYS = {
  nvidia: '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',
}

const BASE_URLS = {
  nvidia: 'https://integrate.api.nvidia.com/v1',
}

export async function generateChatTitle(
  userMessage: string,
  model: LLMModel,
  config: LLMModelConfig
): Promise<string> {
  try {
    const { providerId } = model
    const modelNameString = model.id.includes('::') ? model.id.split('::')[0] : model.id
    
    const apiKey = config.apiKey || API_KEYS[providerId as keyof typeof API_KEYS]
    const baseURL = config.baseURL || BASE_URLS[providerId as keyof typeof BASE_URLS]

    if (!apiKey || !baseURL) {
      throw new Error(`Unsupported provider: ${providerId}`)
    }

    const client = createOpenAI({
      apiKey,
      baseURL,
    })(modelNameString)

    const { text } = await generateText({
      model: client,
      prompt: `Generate a short, concise title (max 5 words) for a chat based on this user message. Return ONLY the title, nothing else.\n\nUser message: "${userMessage}"`,
      maxTokens: 20,
    })
    
    return text.trim().slice(0, 50) || 'Chat'
  } catch (error) {
    console.error('Error generating title:', error)
    return userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
  }
}
