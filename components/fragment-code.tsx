import { CodeView } from './code-view'
import { FileTree } from './file-tree'
import { Button } from './ui/button'
import { CopyButton } from './ui/copy-button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Download } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export function FragmentCode({
  files,
  isStreaming = false,
  isSingleFile = false,
}: {
  files: { name: string; content: string }[]
  isStreaming?: boolean
  isSingleFile?: boolean
}) {
  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <p>No files to display</p>
      </div>
    )
  }

  const [currentFile, setCurrentFile] = useState(files[0]?.name || '')
  const fileNamesRef = useRef<string[]>([])

  // Auto-focus the newest file as it arrives during streaming
  useEffect(() => {
    const currentFileNames = files.map(f => f.name)
    const newFile = currentFileNames.find(
      name => !fileNamesRef.current.includes(name)
    )
    if (newFile) {
      setCurrentFile(newFile)
    }
    fileNamesRef.current = currentFileNames
  }, [files])

  // Content is taken directly from the stream — no artificial delay
  const currentFileContent = files.find(f => f.name === currentFile)?.content || ''

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-row h-full">
      {!isSingleFile && files.length > 1 && (
        <FileTree
          files={files}
          currentFile={currentFile}
          onFileSelect={setCurrentFile}
        />
      )}
      <div className="flex flex-col h-full flex-1">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-mono text-muted-foreground truncate">
            {currentFile}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <CopyButton
                    content={currentFileContent}
                    className="text-muted-foreground"
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">Copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => download(currentFile, currentFileContent)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Download</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden w-full">
          <CodeView
            code={currentFileContent}
            lang={currentFile.split('.').pop() || ''}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  )
}
