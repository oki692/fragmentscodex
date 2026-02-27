import { supabase } from './supabase'
import { ViewType } from '@/components/auth'
import { Session } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect } from 'react'

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

export async function getUserTeam(
  session: Session,
): Promise<UserTeam | undefined> {
  const { data: defaultTeam } = await supabase!
    .from('users_teams')
    .select('teams (id, name, tier, email)')
    .eq('user_id', session?.user.id)
    .eq('is_default', true)
    .single()

  return defaultTeam?.teams as unknown as UserTeam
}

const HARDCODED_ACCESS_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjQwMjU0ODNkLTM3MmQtNGVhOS04MDFiLWE2NmU5YTMzNjQ3NSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3J3eXhpdXRqcWlyZXVoeWJuemx2LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3M2IzMTllZC1hODA2LTRkYTItODFmZC00MTBmZjI0ZjM1NGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxOTA5NTc5LCJpYXQiOjE3NzE5MDU5NzksImVtYWlsIjoiZGVtb0BkZXZlbG9wZXIubmV0IiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzE5MDU4MzJ9XSwic2Vzc2lvbl9pZCI6IjU3MGUzYmU3LTIyOGYtNDYxMC1iZTY4LTY1NTM1ZjE5YmNlOSIsImlzX2Fub255bW91cyI6ZmFsc2V9.2HV3Q8rAkEVcfNay2j4sA9MbtZJvX06kdbTI93g-_Nw74-zzKzUArBN1drgUI5HGxnNPvzMvKgAdZShHFzd3Ng'
const HARDCODED_REFRESH_TOKEN = '6d2clhwqfkro'

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: ViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    // Set hardcoded session directly — no signIn/signUp call
    supabase.auth.setSession({
      access_token: HARDCODED_ACCESS_TOKEN,
      refresh_token: HARDCODED_REFRESH_TOKEN,
    }).then(({ data, error }) => {
      if (data?.session) {
        setSession(data.session)
        getUserTeam(data.session).then(setUserTeam)
        posthog.identify(data.session.user.id, {
          email: data.session.user.email,
          supabase_id: data.session.user.id,
        })
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        getUserTeam(session).then(setUserTeam)
        posthog.identify(session.user.id, {
          email: session.user.email,
          supabase_id: session.user.id,
        })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (_event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        setAuthView('update_password')
        setAuthDialog(true)
      }

      if (_event === 'USER_UPDATED' && recovery) {
        setRecovery(false)
      }

      if (_event === 'SIGNED_IN' && !recovery) {
        getUserTeam(session as Session).then(setUserTeam)
        setAuthDialog(false)
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }

      if (_event === 'SIGNED_OUT') {
        // Re-apply hardcoded session on sign out
        supabase.auth.setSession({
          access_token: HARDCODED_ACCESS_TOKEN,
          refresh_token: HARDCODED_REFRESH_TOKEN,
        })
        setAuthView('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
        setRecovery(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [recovery, setAuthDialog, setAuthView, posthog])

  return {
    session,
    userTeam,
  }
}
