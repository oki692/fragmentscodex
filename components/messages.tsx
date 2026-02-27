"use client"

import { useRef, useEffect, useState } from "react"
import { Streamdown } from "streamdown"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "./reasoning"

export interface Message {
  role: "user" | "assistant"
  content: string
  reasoning?: string
  isStreaming?: boolean
  imageUrl?: string
}

export interface UserBubbleProps {
  content: string
  imageUrl?: string
  index: number
}

export interface AssistantBubbleProps {
  content: string
  reasoning?: string
  isStreaming?: boolean
  onOpenArtifact?: () => void
}

export const USER_BUBBLE_CONFIG = {
  width: {
    min: 64,
    maxPercent: 0.85,
    charWidth: 9,
    paddingTotal: 34,
  },
  height: {
    min: 36,
    lineHeight: 22,
    paddingTotal: 18,
    imageMaxHeight: 210,
    imageMarginBottom: 9,
  },
  padding: {
    horizontal: 17,
    vertical: 9,
  },
  borderRadius: {
    bubble: 22,
    image: 9,
  },
  colors: {
    backgroundLight: "#f4f4f4",
    backgroundDark: "#2a2a2a",
    textLight: "#1c1917",
    textDark: "#f5f5f4",
  },
  typography: {
    fontSize: 16,
    fontWeight: 500,
  },
  widthThresholds: [
    { maxChars: 10, widthPercent: 0.15 },
    { maxChars: 30, widthPercent: 0.4 },
    { maxChars: 60, widthPercent: 0.6 },
    { maxChars: 120, widthPercent: 0.8 },
    { maxChars: Infinity, widthPercent: 0.85 },
  ],
}

function estimateTextWidth(text: string): number {
  const { charWidth } = USER_BUBBLE_CONFIG.width
  let width = 0
  for (const char of text) {
    if (char === " ") width += charWidth * 0.4
    else if (char === "\n") continue
    else if (/[A-Z]/.test(char)) width += charWidth * 1.2
    else if (/[a-z]/.test(char)) width += charWidth * 0.9
    else if (/[0-9]/.test(char)) width += charWidth
    else if (/[!.,;:]/.test(char)) width += charWidth * 0.5
    else width += charWidth
  }
  return width
}

function calculateLineCount(text: string, maxWidth: number): number {
  const lines = text.split("\n")
  let totalLines = 0
  for (const line of lines) {
    if (line.length === 0) {
      totalLines += 1
      continue
    }
    const lineWidth = estimateTextWidth(line)
    totalLines += Math.max(1, Math.ceil(lineWidth / maxWidth))
  }
  return totalLines
}

function calculateBubbleWidth(textLength: number, containerWidth: number, hasImage: boolean): number {
  const { width, widthThresholds } = USER_BUBBLE_CONFIG
  const maxAllowed = containerWidth * width.maxPercent
  if (hasImage) {
    return Math.min(maxAllowed, Math.max(250, textLength * width.charWidth + width.paddingTotal))
  }
  const threshold = widthThresholds.find(t => textLength <= t.maxChars)
  const targetPercent = threshold?.widthPercent ?? 0.85
  const estimated = textLength * width.charWidth + width.paddingTotal
  return Math.max(width.min, Math.min(estimated, containerWidth * targetPercent, maxAllowed))
}

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

export function LoadingDot() {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span 
        style={{
          height: 8,
          width: 8,
          borderRadius: "50%",
          backgroundColor: "currentColor",
          animation: "scaleUpDown 1s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes scaleUpDown {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.8); }
        }
      `}</style>
    </div>
  )
}

export function UserMessageBubble({ content, imageUrl, index }: UserBubbleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current?.parentElement) {
        setContainerWidth(containerRef.current.parentElement.offsetWidth)
      } else {
        setContainerWidth(window.innerWidth - 64)
      }
    }
    const updateTheme = () => setDark(isDarkMode())
    
    updateWidth()
    updateTheme()
    
    window.addEventListener("resize", updateWidth)
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    
    const resizeObserver = new ResizeObserver(updateWidth)
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement)
    }
    
    return () => {
      window.removeEventListener("resize", updateWidth)
      observer.disconnect()
      resizeObserver.disconnect()
    }
  }, [])

  const hasImage = !!imageUrl
  const bubbleWidth = calculateBubbleWidth(content.length, containerWidth, hasImage)
  const maxWidth = Math.floor(containerWidth * USER_BUBBLE_CONFIG.width.maxPercent)
  const { colors, padding, borderRadius, typography, height } = USER_BUBBLE_CONFIG

  const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  }

  const bubbleStyle: React.CSSProperties = {
    backgroundColor: dark ? colors.backgroundDark : colors.backgroundLight,
    color: dark ? colors.textDark : colors.textLight,
    width: "auto",
    minWidth: USER_BUBBLE_CONFIG.width.min,
    maxWidth: maxWidth,
    minHeight: height.min,
    paddingLeft: padding.horizontal,
    paddingRight: padding.horizontal,
    paddingTop: padding.vertical,
    paddingBottom: padding.vertical,
    borderRadius: borderRadius.bubble,
    wordBreak: "break-word",
    overflowWrap: "break-word",
  }

  const imageStyle: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: height.imageMaxHeight,
    marginBottom: height.imageMarginBottom,
    borderRadius: borderRadius.image,
    objectFit: "contain",
  }

  const textStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    fontSize: typography.fontSize,
    lineHeight: `${height.lineHeight}px`,
    fontWeight: typography.fontWeight,
    margin: 0,
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={bubbleStyle}>
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Attached"
            style={imageStyle}
            loading="lazy"
          />
        )}
        <p style={textStyle}>
          {content}
        </p>
      </div>
    </div>
  )
}

export function AssistantMessageBubble({ content, reasoning, isStreaming }: AssistantBubbleProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {reasoning && (
        <Reasoning isStreaming={isStreaming} className="mb-2">
          <ReasoningTrigger className="text-sm font-medium opacity-50 hover:opacity-100 transition-opacity">
            Reasoning
          </ReasoningTrigger>
          <ReasoningContent markdown className="mt-2 pl-4 border-l-2 border-muted">
            {reasoning}
          </ReasoningContent>
        </Reasoning>
      )}
      {content ? (
        <Streamdown className="max-w-none text-base text-foreground font-medium">
          {content}
        </Streamdown>
      ) : isStreaming && !reasoning ? (
        <LoadingDot />
      ) : null}
    </div>
  )
}

export function MessageBasic() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <UserMessageBubble content="Hello! How can I help you today?" index={0} />
      <AssistantMessageBubble 
        content="I can help with a variety of tasks: answering questions, providing information, assisting with coding, generating creative content. What would you like help with today?"
      />
    </div>
  )
}

export function MessageWithMarkdown() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <UserMessageBubble content="Can you show me some markdown?" index={0} />
      <AssistantMessageBubble 
        content={`## Hello World!
          
This message supports **bold text**, *italics*, and other Markdown features:

- Bullet points
- Code blocks
- [Links](https://example.com)

\`\`\`js
// Even code with syntax highlighting
function hello() {
  return "world";
}
\`\`\``}
      />
    </div>
  )
}

export function MessageWithActions() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <UserMessageBubble content="Hello! How can I help you today?" index={0} />
      <AssistantMessageBubble 
        content="I can help with a variety of tasks:

- Answering questions
- Providing information
- Assisting with coding
- Generating creative content

What would you like help with today?"
      />
    </div>
  )
}
