import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { Terminal } from 'lucide-react'
import { useEffect } from 'react'
import { UserMessageBubble, AssistantMessageBubble, LoadingDot } from '@/components/messages'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
}: {
  messages: Message[]
  isLoading: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
}) {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  return (
    <div
      id="chat-container"
      className="flex flex-col pb-4 gap-6 overflow-y-auto max-h-full"
    >
      {messages.map((message: Message, index: number) => {
        const textContent = message.content
          .filter((c) => c.type === 'text')
          .map((c) => (c as { type: string; text: string }).text)
          .join('\n')

        const imageContent = message.content.find((c) => c.type === 'image') as
          | { type: 'image'; image: string }
          | undefined

        return (
          <div key={index} className="flex flex-col gap-2">
            {message.role === 'user' ? (
              <UserMessageBubble
                content={textContent}
                imageUrl={imageContent?.image}
                index={index}
              />
            ) : (
              <AssistantMessageBubble
                content={textContent}
                reasoning={message.reasoning}
                isStreaming={isLoading && index === messages.length - 1}
              />
            )}
            {message.object && (
              <div
                onClick={() =>
                  setCurrentPreview({
                    fragment: message.object,
                    result: message.result,
                  })
                }
                className="py-2 pl-2 w-full flex items-center border rounded-xl select-none hover:bg-white dark:hover:bg-white/5 active:bg-white/80 dark:active:bg-white/10 hover:cursor-pointer transition-colors"
              >
                <div className="rounded-[0.5rem] w-10 h-10 bg-black/5 dark:bg-white/5 self-stretch flex items-center justify-center flex-shrink-0">
                  <Terminal strokeWidth={2} className="text-[#FF8800]" />
                </div>
                <div className="pl-2 pr-4 flex flex-col min-w-0">
                  <span className="font-bold font-sans text-sm text-primary truncate">
                    {message.object.title}
                  </span>
                  <span className="font-sans text-sm text-muted-foreground">
                    Tap to see fragment
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant') && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <LoadingDot />
        </div>
      )}
    </div>
  )
}
