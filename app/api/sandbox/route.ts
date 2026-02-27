import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'

// Hardcoded E2B API key
process.env.E2B_API_KEY = 'e2b_2f7410db44ba5351154505dde9c71ddd449e3748'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    teamID,
    accessToken,
  }: {
    fragment: FragmentSchema
    userID: string | undefined
    teamID: string | undefined
    accessToken: string | undefined
  } = await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)

  // Handle SVG static template - no E2B sandbox needed, local preview only
  if (fragment.template === 'svg') {
    return new Response(
      JSON.stringify({
        sbxId: 'local-svg-' + Math.random().toString(36).substr(2, 9),
        template: fragment.template,
        url: 'about:blank',
      } as ExecutionResultWeb),
    )
  }

  // Handle React template - no E2B sandbox needed, Sandpack preview only
  if (fragment.template === 'react-developer') {
    return new Response(
      JSON.stringify({
        sbxId: 'local-react-' + Math.random().toString(36).substr(2, 9),
        template: fragment.template,
        url: 'about:blank',
      } as ExecutionResultWeb),
    )
  }

  // Create an interpreter or a sandbox
  const sbx = await Sandbox.create(fragment.template, {
    metadata: {
      template: fragment.template,
      userID: userID ?? '',
      teamID: teamID ?? '',
    },
    timeoutMs: sandboxTimeout,
    ...(teamID && accessToken
      ? {
          headers: {
            'X-Supabase-Team': teamID,
            'X-Supabase-Token': accessToken,
          },
        }
      : {}),
  })

  // Install packages
  if (fragment.has_additional_dependencies) {
    await sbx.commands.run(fragment.install_dependencies_command)
    console.log(
      `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}`,
    )
  }

  // Copy code to fs - handle both single file and multiple files
  if (Array.isArray(fragment.code)) {
    // Multi-file template (Next.js, Vue, etc.)
    for (const file of fragment.code) {
      await sbx.files.write(file.file_path, file.code)
      console.log(`Copied file to ${file.file_path} in ${sbx.sandboxId}`)
    }
  } else if (typeof fragment.code === 'string') {
    // Single-file template (SVG, Streamlit, Gradio, Code Interpreter)
    await sbx.files.write(fragment.file_path || 'file.txt', fragment.code)
    console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxId}`)
  }

  // Execute code or return a URL to the running sandbox
  if (fragment.template === 'code-interpreter-v1') {
    const codeToRun = typeof fragment.code === 'string' ? fragment.code : ''
    const { logs, error, results } = await sbx.runCode(codeToRun)

    return new Response(
      JSON.stringify({
        sbxId: sbx?.sandboxId,
        template: fragment.template,
        stdout: logs.stdout,
        stderr: logs.stderr,
        runtimeError: error,
        cellResults: results,
      } as ExecutionResultInterpreter),
    )
  }

  return new Response(
    JSON.stringify({
      sbxId: sbx?.sandboxId,
      template: fragment.template,
      url: `https://${sbx?.getHost(fragment.port || 80)}`,
    } as ExecutionResultWeb),
  )
}
