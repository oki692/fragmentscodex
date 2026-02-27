import './code-theme.css'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-bash'
import { useEffect, useRef } from 'react'

export function CodeView({
  code,
  lang,
  isStreaming = false,
}: {
  code: string
  lang: string
  isStreaming?: boolean
}) {
  const preRef = useRef<HTMLPreElement>(null)
  const isUserScrollingRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  // Re-highlight syntax on every code update (live during streaming)
  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  // Auto-scroll to bottom during streaming — follows the output live
  useEffect(() => {
    if (!isStreaming || !preRef.current) return
    const el = preRef.current
    if (!isUserScrollingRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [code, isStreaming])

  // Detect manual scroll up to pause auto-scroll
  useEffect(() => {
    const el = preRef.current
    if (!el) return
    const handleScroll = () => {
      const scrolledUp = el.scrollTop < lastScrollTopRef.current - 5
      if (scrolledUp) isUserScrollingRef.current = true
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
        isUserScrollingRef.current = false
      }
      lastScrollTopRef.current = el.scrollTop
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Reset scroll lock when a new stream begins
  useEffect(() => {
    if (isStreaming) isUserScrollingRef.current = false
  }, [isStreaming])

  return (
    <pre
      ref={preRef}
      className="p-4 pt-2 overflow-y-auto w-full h-full"
      style={{
        fontSize: 12,
        backgroundColor: 'transparent',
        borderRadius: 0,
        margin: 0,
        maxHeight: '100%',
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
      }}
    >
      <code
        className={`language-${lang}`}
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', wordBreak: 'break-word' }}
      >
        {code}
      </code>
    </pre>
  )
}
