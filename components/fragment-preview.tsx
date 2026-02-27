'use client'

import { FragmentInterpreter } from './fragment-interpreter'
import { FragmentWeb } from './fragment-web'
import { getTemplateId } from '@/lib/templates'
import {
  ExecutionResult,
  ExecutionResultInterpreter,
  ExecutionResultWeb,
} from '@/lib/types'
import { DeepPartial } from 'ai'
import { FragmentSchema } from '@/lib/schema'
import { 
  SandpackProvider, 
  SandpackPreview,
  SandpackLayout,
} from '@codesandbox/sandpack-react'

export function FragmentPreview({ 
  result,
  fragment,
}: { 
  result?: ExecutionResult
  fragment?: DeepPartial<FragmentSchema>
}) {
  if (!result) return null

  if (getTemplateId(result.template) === 'code-interpreter-v1') {
    return <FragmentInterpreter result={result as ExecutionResultInterpreter} />
  }

  if (getTemplateId(result.template) === 'svg') {
    const svgCode = typeof fragment?.code === 'string' 
      ? fragment.code 
      : Array.isArray(fragment?.code) && fragment.code.length > 0
        ? fragment.code[0].code
        : ''
    
    return (
      <div className="w-full h-full bg-white dark:bg-[#1a1a1a]">
        {svgCode ? (
          <svg
            dangerouslySetInnerHTML={{ __html: svgCode }}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>SVG Preview</p>
              <p className="text-xs mt-2">Waiting for SVG code...</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (getTemplateId(result.template) === 'react-e2b-developer') {
    return <FragmentWeb result={result as ExecutionResultWeb} />
  }

  if (getTemplateId(result.template) === 'react-developer') {
    // Handle both single string and array of files
    const code = typeof fragment?.code === 'string' 
      ? fragment.code 
      : Array.isArray(fragment?.code) && fragment.code.length > 0
        ? fragment.code[0].code
        : ''
    
    if (!code) {
      return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-white dark:bg-[#1a1a1a]">
          <div className="text-center">
            <p>React Preview</p>
            <p className="text-xs mt-2">Waiting for React code...</p>
          </div>
        </div>
      )
    }

    return (
      <div 
        className="w-full h-full"
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#1a1a1a'
        }}
      >
        <SandpackProvider
          template="react-ts"
          theme="dark"
          files={{
            '/App.tsx': code,
          }}
          options={{
            autorun: true,
            autoReload: true,
            recompileDelay: 0,
            initMode: 'immediate',
            showLineNumbers: false,
          }}
          customSetup={{
            dependencies: {
              'react': 'latest',
              'react-dom': 'latest',
              'typescript': 'latest',
            },
          }}
        >
          <SandpackLayout style={{ height: '100%', width: '100%' }}>
            <SandpackPreview 
              style={{ 
                height: '100%', 
                width: '100%',
                border: 'none',
              }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    )
  }

  return <FragmentWeb result={result as ExecutionResultWeb} />
}
