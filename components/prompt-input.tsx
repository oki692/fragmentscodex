"use client"

import type React from "react"
import { ArrowUp, Plus, X, ImageIcon, Square } from "lucide-react"
import { useRef, useState } from "react"

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}

interface ChatInputProps {
  onSubmit?: (message: string, imageBase64?: string) => void
  isLoading?: boolean
  onStop?: () => void
}

export function PromptInputWithActions({ onSubmit, isLoading = false, onStop }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading && onStop) {
      onStop()
      return
    }

    if (message.trim() || imageBase64) {
      onSubmit?.(message, imageBase64 || undefined)
      setMessage("")
      setImagePreview(null)
      setImageBase64(null)
      setIsExpanded(false)

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }

    setIsExpanded(e.target.value.length > 100 || e.target.value.includes("\n") || !!imagePreview)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
      setImageBase64(base64)
      setIsExpanded(true)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageBase64(null)
    if (!message.trim()) {
      setIsExpanded(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="group/composer w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={cn(
          "w-full max-w-2xl mx-auto bg-transparent dark:bg-muted/50 cursor-text overflow-clip bg-clip-padding p-2 sm:p-2.5 shadow-lg border border-border transition-all duration-200",
          isExpanded
            ? "rounded-3xl grid grid-cols-1 grid-rows-[auto_1fr_auto]"
            : "rounded-[28px] grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto]",
        )}
        style={{
          gridTemplateAreas: isExpanded
            ? "'header' 'primary' 'footer'"
            : "'leading header header' 'leading primary trailing' '. . footer'",
        }}
      >
        {imagePreview && (
          <div className="px-2 py-2" style={{ gridArea: "header" }}>
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        {!isExpanded && (
          <div
            className="flex items-center justify-center pl-1"
            style={{ gridArea: "leading" }}
          >
            <button
              type="button"
              onClick={handleImageClick}
              className="inline-flex items-center justify-center size-9 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
              title="Add image"
            >
              <Plus className="size-5" />
            </button>
          </div>
        )}

        <div
          className={cn(
            "flex min-h-14 items-center overflow-x-hidden px-1.5",
            isExpanded ? "px-2 py-1 mb-0" : "-my-2.5",
          )}
          style={{ gridArea: "primary" }}
        >
          <div className="flex-1 overflow-auto max-h-52 pb-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={imagePreview ? "Add a message..." : "Ask anything"}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full bg-transparent font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-0 resize-none rounded-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin dark:bg-transparent"
              style={{ fontSize: 16 }}
              rows={1}
            />
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ gridArea: isExpanded ? "footer" : "trailing" }}>
          <div className="ms-auto flex items-center gap-1.5">
            {isExpanded && (
              <button
                type="button"
                onClick={handleImageClick}
                className="inline-flex items-center justify-center size-9 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                title="Add image"
              >
                <ImageIcon className="size-5" />
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 size-10 rounded-full"
              disabled={!isLoading && !message.trim() && !imageBase64}
            >
              {isLoading ? (
                <Square className="size-5 fill-current" />
              ) : (
                <ArrowUp className="size-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
