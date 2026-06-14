import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/check-access'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Só admin pode disparar
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { titulo, marca, modelo, ano, sistema, id } = await req.json()

  const resendKey = process.env.RESEND_API_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!resendKey || !serviceKey) {
    return NextResponse.json({ error: 'Variáveis de ambiente não configuradas' }, { status: 500 })
  }

  // Busca assinantes ativos usando service role
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  const now = new Date().toISOString()
  const [{ data: assinaturas }, { data: trials }] = await Promise.all([
    admin.from('subscriptions').select('user_id').eq('status', 'active').gte('expires_at', now),
    admin.from('trial_access').select('user_id').gte('expires_at', now),
  ])

  const userIds = new Set<string>()
  for (const s of assinaturas ?? []) userIds.add(s.user_id)
  for (const t of trials ?? []) userIds.add(t.user_id)

  if (userIds.size === 0) return NextResponse.json({ sent: 0 })

  // Busca e-mails dos assinantes
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emails = allUsers
    .filter(u => u.email && userIds.has(u.id))
    .map(u => u.email!)

  if (emails.length === 0) return NextResponse.json({ sent: 0 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magayver-diag-site.vercel.app'
  const casoUrl = `${siteUrl}/casos/${id}`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
      <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
        <p style="color:#fff;font-weight:bold;font-size:16px;margin:0">Magayver Injecar</p>
        <p style="color:#93c5fd;font-size:12px;margin:4px 0 0">Base de Dados de Defeitos Automotivos</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="font-size:13px;color:#6b7280;margin:0 0 16px">Novo caso adicionado ao banco de dados:</p>
        <h2 style="font-size:17px;font-weight:700;margin:0 0 8px;color:#111">${titulo}</h2>
        <p style="font-size:13px;color:#374151;margin:0 0 4px">
          <strong>Veículo:</strong> ${marca} ${modelo} ${ano ?? ''}
        </p>
        <p style="font-size:13px;color:#374151;margin:0 0 20px">
          <strong>Sistema:</strong> ${sistema}
        </p>
        <a href="${casoUrl}"
           style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:13px;font-weight:600">
          Ver caso completo →
        </a>
        <p style="font-size:11px;color:#9ca3af;margin:24px 0 0">
          Você recebe este e-mail por ser assinante do app Magayver Diag.
        </p>
      </div>
    </div>
  `

  // Envia em lote pela API do Resend
  const batch = emails.map(to => ({
    from: process.env.RESEND_FROM ?? 'Magayver Injecar <onboarding@resend.dev>',
    to,
    subject: `Novo caso: ${titulo} — ${marca} ${modelo}`,
    html,
  }))

  // Resend aceita até 100 por vez; divide se necessário
  const chunks: typeof batch[] = []
  for (let i = 0; i < batch.length; i += 100) chunks.push(batch.slice(i, i + 100))

  let sent = 0
  for (const chunk of chunks) {
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    })
    if (res.ok) sent += chunk.length
  }

  return NextResponse.json({ sent })
}
