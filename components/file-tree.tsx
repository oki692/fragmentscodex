'use client'

import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

interface FileTreeProps {
  files: { name: string; content: string }[]
  currentFile: string
  onFileSelect: (fileName: string) => void
}

export function FileTree({ files, currentFile, onFileSelect }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Build tree structure from flat file list
  const tree = useMemo(() => {
    const root: Record<string, FileNode> = {}
    const rootNodes: FileNode[] = []

    files.forEach((file) => {
      const parts = file.name.split('/')
      let parentPath = ''

      parts.forEach((part, index) => {
        const currentPath = parentPath ? `${parentPath}/${part}` : part
        const isFile = index === parts.length - 1

        if (!root[currentPath]) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: [],
          }
          root[currentPath] = node

          // Add to parent or root
          if (parentPath && root[parentPath]) {
            root[parentPath].children?.push(node)
          } else if (!parentPath) {
            rootNodes.push(node)
          }
        }

        parentPath = currentPath
      })
    })

    return rootNodes
  }, [files])

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderNode = (node: FileNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = currentFile === node.path

    if (node.type === 'file') {
      return (
        <div
          key={node.path}
          onClick={() => onFileSelect(node.path)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors',
            isSelected
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <File className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
      )
    }

    return (
      <div key={node.path}>
        <div
          onClick={() => toggleFolder(node.path)}
          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-muted/50 transition-colors text-muted-foreground font-medium"
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        {isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r w-[120px] md:w-[160px] flex-shrink-0">
      <div className="px-3 py-2 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Files
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            No files
          </div>
        ) : (
          <div className="py-2">
            {tree.map((node) => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  )
}
