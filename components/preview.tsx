import { DeployDialog } from './deploy-dialog'
import { FragmentCode } from './fragment-code'
import { FragmentPreview } from './fragment-preview'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FragmentSchema } from '@/lib/schema'
import { getTemplateId } from '@/lib/templates'
import { ExecutionResult, ExecutionResultWeb } from '@/lib/types'
import { DeepPartial } from 'ai'
import { ChevronsRight, LoaderCircle, X } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

export function Preview({
  teamID,
  accessToken,
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
}: {
  teamID: string | undefined
  accessToken: string | undefined
  selectedTab: 'code' | 'fragment'
  onSelectedTabChange: Dispatch<SetStateAction<'code' | 'fragment'>>
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
  onClose: () => void
}) {
  if (!fragment) {
    return null
  }

  const isSvgStatic = result?.template && getTemplateId(result?.template!) === 'svg'
  const isReactDeveloper = result?.template && getTemplateId(result?.template!) === 'react-developer'
  const isLocalPreview = isSvgStatic || isReactDeveloper
  const isLinkAvailable =
    result?.template &&
    getTemplateId(result?.template!) !== 'code-interpreter-v1' &&
    !isLocalPreview
  const showPreviewTab = !isLocalPreview || (isLocalPreview && fragment?.code)

  return (
    <div className="relative z-10 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-hidden flex flex-col">
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'fragment')
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 grid grid-cols-3 items-center border-b flex-shrink-0">
          {/* Desktop: chevron close; Mobile: X close */}
          <div>
            {/* Desktop close */}
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex text-muted-foreground"
                    onClick={onClose}
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Mobile close */}
            <Button
              variant="ghost"
              size="icon"
              className="flex md:hidden text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex justify-center">
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="code"
              >
                {isChatLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
                Code
              </TabsTrigger>
              {showPreviewTab && (
                <TabsTrigger
                  disabled={!result && !isSvgStatic}
                  className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                  value="fragment"
                >
                  Preview
                  {isPreviewLoading && (
                    <LoaderCircle
                      strokeWidth={3}
                      className="h-3 w-3 animate-spin"
                    />
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {result && (
            <div className="hidden md:flex items-center justify-end gap-2">
              {isLinkAvailable && (
                <DeployDialog
                  url={(result as ExecutionResultWeb).url!}
                  sbxId={result.sbxId!}
                  teamID={teamID}
                  accessToken={accessToken}
                />
              )}
            </div>
          )}
        </div>

        {fragment && (
          <div className="overflow-y-auto w-full flex-1 min-h-0">
            <TabsContent value="code" className="h-full m-0">
              {fragment.code && (
                <FragmentCode
                  files={getFilesFromFragment(fragment)}
                  isStreaming={isChatLoading}
                  isSingleFile={isSvgStatic || typeof fragment.code === 'string'}
                />
              )}
            </TabsContent>
            <TabsContent value="fragment" className="h-full m-0">
              {isLocalPreview ? (
                <FragmentPreview result={result as ExecutionResult} fragment={fragment} />
              ) : (
                result && <FragmentPreview result={result as ExecutionResult} />
              )}
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}


/**
 * Helper function to extract files from fragment
 * Handles both single file and multiple files
 */
function getFilesFromFragment(
  fragment: DeepPartial<FragmentSchema>
): { name: string; content: string }[] {
  if (!fragment.code) {
    return []
  }

  // If code is an array, it's a multi-file template
  if (Array.isArray(fragment.code)) {
    return fragment.code.map((file) => ({
      name: file.file_path || 'unknown',
      content: file.code || '',
    }))
  }

  // If code is a string, it's a single-file template
  if (typeof fragment.code === 'string') {
    const fileName = fragment.file_path || 'file.txt'
    return [
      {
        name: fileName,
        content: fragment.code,
      },
    ]
  }

  return []
}
