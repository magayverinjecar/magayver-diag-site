import { SupabaseClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'magayvertorres@gmail.com'

export async function hasActiveAccess(supabase: SupabaseClient, userId: string, email?: string): Promise<boolean> {
  // Admin sempre tem acesso
  if (email && isAdmin(email)) return true

  const [{ data: sub }, { data: trial }, { data: colab }] = await Promise.all([
    supabase.from('subscriptions').select('status, expires_at').eq('user_id', userId).maybeSingle(),
    supabase.from('trial_access').select('expires_at').eq('user_id', userId).maybeSingle(),
    email
      ? supabase.from('colaboradores').select('id').eq('user_email', email).eq('ativo', true).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (sub?.status === 'active') {
    const exp = sub.expires_at
    if (!exp || new Date(exp) > new Date()) return true
  }

  if (trial && new Date(trial.expires_at) > new Date()) return true

  if (colab) return true

  return false
}

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL
}

export async function isColaborador(supabase: SupabaseClient, email: string): Promise<boolean> {
  if (isAdmin(email)) return false
  const { data } = await supabase
    .from('colaboradores')
    .select('id')
    .eq('user_email', email)
    .eq('ativo', true)
    .maybeSingle()
  return !!data
}
