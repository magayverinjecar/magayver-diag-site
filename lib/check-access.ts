import { SupabaseClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'magayvertorres@gmail.com'

export async function hasActiveAccess(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (sub?.status === 'active') {
    const exp = sub.expires_at
    if (!exp || new Date(exp) > new Date()) return true
  }

  const { data: trial } = await supabase
    .from('trial_access')
    .select('expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (trial && new Date(trial.expires_at) > new Date()) return true

  return false
}

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL
}
