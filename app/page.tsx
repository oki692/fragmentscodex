'use client'

import { ViewType } from '@/components/auth'
import { AuthDialog } from '@/components/auth-dialog'
import { Chat } from '@/components/chat'
import { PromptInputWithActions } from '@/components/prompt-input'
import { ModelPicker, TemplatePicker } from '@/components/chat-picker'
import { NavBar } from '@/components/navbar'
import { Preview } from '@/components/preview'
import Sidebar from '@/components/sidebar'
import SettingsDialog from '@/components/settings-dialog/SettingsDialog'
import { useAuth } from '@/lib/auth'
import { generateChatTitle } from '@/app/actions/generate-title'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema as schema } from '@/lib/schema'
import { supabase } from '@/lib/supabase'
import templates from '@/lib/templates'
import { ExecutionResult, ChatSession } from '@/lib/types'
import { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from 'ai/react'
import { usePostHog } from 'posthog-js/react'
import { SetStateAction, useEffect, useState, useCallback } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { nanoid } from 'nanoid'

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    'languageModel',
    { model: 'moonshotai/kimi-k2-instruct-0905' },
  )

  const posthog = usePostHog()

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { session, userTeam } = useAuth(setAuthDialog, setAuthView)
  const [useMorphApply, setUseMorphApply] = useLocalStorage(
    'useMorphApply',
    false,
  )

  // Sidebar & History state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('sidebarCollapsed', true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [titleGenerated, setTitleGenerated] = useState(false)
  const [enabledTemplates, setEnabledTemplates] = useState<Record<string, boolean>>({})
  const [enabledModels, setEnabledModels] = useState<Record<string, boolean>>({})

  // Mobile preview drawer state
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false)

  // Load user settings from Supabase
  useEffect(() => {
    if (!session?.user?.id) return
    const loadSettings = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('enabled_templates, enabled_models')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setEnabledTemplates(data.enabled_templates || {})
        setEnabledModels(data.enabled_models || {})
      } else {
        const defaults: Record<string, boolean> = {}
        Object.keys(templates).forEach(key => {
          defaults[key] = !['streamlit-developer', 'gradio-developer', 'code-interpreter-v1'].includes(key)
        })
        setEnabledTemplates(defaults)

        const modelDefaults: Record<string, boolean> = {}
        modelsList.models.forEach(model => {
          modelDefaults[model.id] = true
        })
        setEnabledModels(modelDefaults)
      }
    }
    loadSettings()
  }, [session?.user?.id])

  // Fetch sessions from Supabase
  const fetchSessions = useCallback(async () => {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })

    if (data) {
      setSessions(data.map(s => ({
        id: s.id,
        title: s.title,
        messages: s.messages as Message[],
        updatedAt: new Date(s.updated_at).getTime()
      })))
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const filteredModels = modelsList.models.filter((model) => {
    if (true) {
      return model.providerId !== 'ollama' && (enabledModels[model.id] ?? true)
    }
    return true
  })

  const filteredTemplates = Object.fromEntries(
    Object.entries(templates).filter(([key, t]) => {
      // Always respect the hard-coded enabled flag in templates.ts
      if (!t.enabled) return false
      // Then apply user-level overrides from Supabase (only if settings loaded)
      if (Object.keys(enabledTemplates).length > 0) {
        return enabledTemplates[key] ?? true
      }
      return true
    })
  )

  const defaultModel = filteredModels.find(
    (model) => model.id === 'qwen/qwen3-next-80b-a3b-instruct',
  ) || filteredModels[0]

  const currentModel = filteredModels.find(
    (model) => model.id === languageModel.model,
  ) || defaultModel

  useEffect(() => {
    if (languageModel.model && !filteredModels.find((m) => m.id === languageModel.model)) {
      setLanguageModel({ ...languageModel, model: defaultModel.id })
    }
  }, [languageModel.model])

  const currentTemplate =
    selectedTemplate === 'auto'
      ? templates
      : { [selectedTemplate]: templates[selectedTemplate] }
  const lastMessage = messages[messages.length - 1]

  // Determine which API to use
  const shouldUseMorph =
    useMorphApply && fragment && fragment.code && fragment.file_path
  const apiEndpoint = shouldUseMorph ? '/api/morph-chat' : '/api/chat'

  // ─── Original AI SDK useObject ─────────────────────────────────────────────
  const { object, submit, isLoading, stop, error } = useObject({
    api: apiEndpoint,
    schema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      if (error.message.includes('limit')) {
        setIsRateLimited(true)
      }
      setErrorMessage(error.message)
      setFragment(undefined)
      setResult(undefined)
      setIsPreviewLoading(false)
    },
    onFinish: async ({ object: fragment, error }) => {
      if (!error) {
        setIsPreviewLoading(true)
        posthog.capture('fragment_generated', {
          template: fragment?.template,
        })

        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            fragment,
            userID: session?.user?.id,
            teamID: userTeam?.id,
            accessToken: session?.access_token,
          }),
        })

        const result = await response.json()
        posthog.capture('sandbox_created', { url: result.url })

        setResult(result)
        setCurrentPreview({ fragment, result })
        setMessage({ result })
        setCurrentTab('fragment')
        setIsPreviewLoading(false)
        // Auto-open preview drawer on mobile when fragment is ready
        setIsMobilePreviewOpen(true)
      }
    },
  })

  // Sync messages to Supabase
  useEffect(() => {
    const syncSession = async () => {
      if (activeSessionId && messages.length > 0 && session?.user?.id) {
        const currentSession = sessions.find(s => s.id === activeSessionId)
        let title = currentSession?.title || 'Nowa rozmowa'

        if (title === 'Nowa rozmowa' && messages[0]?.role === 'user' && !titleGenerated) {
          const firstText = messages[0].content.find(c => c.type === 'text')
          if (firstText && 'text' in firstText) {
            try {
              title = await generateChatTitle(firstText.text as string, currentModel, languageModel)
              setTitleGenerated(true)
            } catch (error) {
              console.error('Error generating title:', error)
              title = (firstText.text as string).slice(0, 40) + ((firstText.text as string).length > 40 ? '...' : '')
            }
          }
        }

        const { error } = await supabase
          .from('chat_sessions')
          .upsert({
            id: activeSessionId,
            user_id: session.user.id,
            title,
            messages,
            updated_at: new Date().toISOString()
          })

        if (!error) {
          fetchSessions()
        }
      }
    }

    const timeoutId = setTimeout(syncSession, 1000)
    return () => clearTimeout(timeoutId)
  }, [messages, activeSessionId, session?.user?.id, titleGenerated, sessions, currentModel, languageModel])

  useEffect(() => {
    if (object) {
      setFragment(object)
      // Serialize code: array of files → joined string for display, string → as-is
      const codeText = Array.isArray(object.code)
        ? object.code.map((f: any) => `// ${f?.file_path || ''}
${f?.code || ''}`).join('\n\n')
        : (typeof object.code === 'string' ? object.code : '')
      const content: Message['content'] = [
        { type: 'text', text: object.commentary || '' },
        { type: 'code', text: codeText },
      ]

      const reasoning = (object as any).reasoning

      if (!lastMessage || lastMessage.role !== 'assistant') {
        addMessage({
          role: 'assistant',
          content,
          reasoning,
          object,
        })
      }

      if (lastMessage && lastMessage.role === 'assistant') {
        setMessage({
          content,
          reasoning,
          object,
        })
      }
    }
  }, [object])

  useEffect(() => {
    if (error) stop()
  }, [error])

  function setMessage(message: Partial<Message>, index?: number) {
    setMessages((previousMessages) => {
      const updatedMessages = [...previousMessages]
      updatedMessages[index ?? previousMessages.length - 1] = {
        ...previousMessages[index ?? previousMessages.length - 1],
        ...message,
      }
      return updatedMessages
    })
  }

  function addMessage(message: Message) {
    let updatedMessages: Message[] = []
    setMessages((previousMessages) => {
      updatedMessages = [...previousMessages, message]
      return updatedMessages
    })
    return updatedMessages
  }

  async function handlePromptSubmit(messageText: string, imageBase64?: string) {
    if (!session) {
      return setAuthDialog(true)
    }
    if (isLoading) {
      stop()
    }

    let currentId = activeSessionId
    if (!currentId) {
      currentId = nanoid()
      setActiveSessionId(currentId)
      setTitleGenerated(false)
    }

    const content: Message['content'] = [{ type: 'text', text: messageText }]
    if (imageBase64) {
      content.push({ type: 'image', image: imageBase64 })
    }

    const updatedMessages = [...messages, { role: 'user', content } as Message]
    setMessages(updatedMessages)

    submit({
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
      ...(shouldUseMorph && fragment ? { currentFragment: fragment } : {}),
    })

    setChatInput('')
    setFiles([])
    setCurrentTab('code')
    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  function handleNewChat() {
    stop()
    setActiveSessionId(null)
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setChatInput('')
    setFiles([])
    setCurrentTab('code')
    setIsPreviewLoading(false)
    setTitleGenerated(false)
    setIsMobilePreviewOpen(false)
  }

  function handleSelectChat(id: string) {
    stop()
    const s = sessions.find(sess => sess.id === id)
    if (s) {
      setActiveSessionId(id)
      setMessages(s.messages)
      setFragment(undefined)
      setResult(undefined)
      setCurrentTab('code')
      setTitleGenerated(true)
      setIsMobilePreviewOpen(false)
    }
  }

  function logout() {
    supabase.auth.signOut()
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleClearChat() {
    handleNewChat()
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setFragment(preview.fragment)
    setResult(preview.result)
  }

  function handleUndo() {
    setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
    setCurrentPreview({ fragment: undefined, result: undefined })
  }

  function handleFragmentClick(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setCurrentPreview(preview)
    setIsMobilePreviewOpen(true)
  }

  return (
    <main className="flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-[#141414]">
      <AuthDialog
        open={isAuthDialogOpen}
        setOpen={setAuthDialog}
        view={authView}
        supabase={supabase}
      />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userEmail={session?.user?.email}
        userName={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0]}
        onSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userId={session?.user?.id}
      />

      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Desktop: side-by-side grid */}
        <div className="hidden md:grid md:grid-cols-2 w-full h-full">
          <div
            className={`flex flex-col h-[100dvh] max-h-[100dvh] w-full max-w-[800px] mx-auto px-4 ${fragment ? 'col-span-1' : 'col-span-2'}`}
          >
            <NavBar
              session={session}
              showLogin={() => setAuthDialog(true)}
              signOut={logout}
            >
              <ModelPicker
                models={filteredModels}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
              />
              <TemplatePicker
                templates={filteredTemplates}
                selectedTemplate={selectedTemplate}
                onSelectedTemplateChange={setSelectedTemplate}
              />
            </NavBar>
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full -translate-y-12">
                  <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-light text-black dark:text-white mb-8">What can I do for you?</h1>
                    <div className="w-[600px]">
                      <PromptInputWithActions
                        onSubmit={handlePromptSubmit}
                        isLoading={isLoading}
                        onStop={stop}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Chat
                  messages={messages}
                  isLoading={isLoading}
                  setCurrentPreview={setCurrentPreview}
                />
              )}
            </div>
            <div className={`flex-shrink-0 flex flex-col gap-2 pb-4 pt-1 ${messages.length > 0 ? '' : 'hidden'}`}>
              {messages.length > 0 && (
                <PromptInputWithActions
                  onSubmit={handlePromptSubmit}
                  isLoading={isLoading}
                  onStop={stop}
                />
              )}
            </div>
          </div>
          <Preview
            teamID={userTeam?.id}
            accessToken={session?.access_token}
            selectedTab={currentTab}
            onSelectedTabChange={setCurrentTab}
            isChatLoading={isLoading}
            isPreviewLoading={isPreviewLoading}
            fragment={fragment}
            result={result as ExecutionResult}
            onClose={() => setFragment(undefined)}
          />
        </div>

        {/* Mobile: single column full-height layout */}
        <div className="flex md:hidden flex-col h-[100dvh] w-full">
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <ModelPicker
              models={filteredModels}
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
            />
            <TemplatePicker
              templates={filteredTemplates}
              selectedTemplate={selectedTemplate}
              onSelectedTemplateChange={setSelectedTemplate}
            />
          </NavBar>

          <div className="flex-1 overflow-y-auto min-h-0 px-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pb-4">
                <h1 className="text-2xl font-light text-black dark:text-white mb-6 text-center">
                  What can I do for you?
                </h1>
              </div>
            ) : (
              <Chat
                messages={messages}
                isLoading={isLoading}
                setCurrentPreview={handleFragmentClick}
              />
            )}
          </div>

          <div className="flex-shrink-0 px-3 pb-4 pt-1">
            <PromptInputWithActions
              onSubmit={handlePromptSubmit}
              isLoading={isLoading}
              onStop={stop}
            />
          </div>
        </div>

        {/* Mobile Preview Drawer (slide up from bottom) */}
        {isMobilePreviewOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            style={{ touchAction: 'none' }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobilePreviewOpen(false)}
            />
            {/* Drawer panel */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-popover rounded-t-[2rem] shadow-2xl flex flex-col"
              style={{ height: '92dvh' }}
            >
              <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex-1 overflow-hidden">
                <Preview
                  teamID={userTeam?.id}
                  accessToken={session?.access_token}
                  selectedTab={currentTab}
                  onSelectedTabChange={setCurrentTab}
                  isChatLoading={isLoading}
                  isPreviewLoading={isPreviewLoading}
                  fragment={fragment}
                  result={result as ExecutionResult}
                  onClose={() => setIsMobilePreviewOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
