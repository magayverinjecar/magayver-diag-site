import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/check-access'
import { createClient as createServiceClient } from '@supabase/supabase-js'

type CasoItem = {
  id: string
  titulo: string
  marca: string
  modelo: string
  ano?: string
  sistema: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  // Aceita caso único { id, titulo, ... } ou lote { casos: [...] }
  const casos: CasoItem[] = body.casos ?? [body]

  const resendKey = process.env.RESEND_API_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!resendKey || !serviceKey) {
    return NextResponse.json({ error: 'Variáveis de ambiente não configuradas' }, { status: 500 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  )

  // Busca assinantes ativos
  const now = new Date().toISOString()
  const [{ data: assinaturas }, { data: trials }] = await Promise.all([
    admin.from('subscriptions').select('user_id').eq('status', 'active').gte('expires_at', now),
    admin.from('trial_access').select('user_id').gte('expires_at', now),
  ])

  const userIds = new Set<string>()
  for (const s of assinaturas ?? []) userIds.add(s.user_id)
  for (const t of trials ?? []) userIds.add(t.user_id)

  if (userIds.size === 0) {
    await marcarNotificados(admin, casos.map(c => c.id))
    return NextResponse.json({ sent: 0 })
  }

  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emails = allUsers.filter(u => u.email && userIds.has(u.id)).map(u => u.email!)

  if (emails.length === 0) {
    await marcarNotificados(admin, casos.map(c => c.id))
    return NextResponse.json({ sent: 0 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://magayver-diag-site.vercel.app'
  const isLote = casos.length > 1

  const subject = isLote
    ? `${casos.length} novos casos adicionados — Magayver Injecar`
    : `Novo caso: ${casos[0].titulo} — ${casos[0].marca} ${casos[0].modelo}`

  const casosHtml = casos.map(c => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
        <a href="${siteUrl}/casos/${c.id}" style="color:#1d4ed8;font-weight:600;font-size:13px;text-decoration:none">${c.titulo}</a>
        <p style="margin:3px 0 0;font-size:12px;color:#6b7280">${c.marca} ${c.modelo} ${c.ano ?? ''} · ${c.sistema}</p>
      </td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111">
      <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
        <p style="color:#fff;font-weight:bold;font-size:16px;margin:0">Magayver Injecar</p>
        <p style="color:#93c5fd;font-size:12px;margin:4px 0 0">Base de Dados de Defeitos Automotivos</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="font-size:13px;color:#374151;margin:0 0 16px">
          ${isLote ? `<strong>${casos.length} novos casos</strong> foram adicionados ao banco de dados:` : 'Novo caso adicionado ao banco de dados:'}
        </p>
        <table style="width:100%;border-collapse:collapse">${casosHtml}</table>
        <div style="margin-top:20px">
          <a href="${siteUrl}/casos" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 22px;border-radius:6px;font-size:13px;font-weight:600">
            Ver banco de dados →
          </a>
        </div>
        <p style="font-size:11px;color:#9ca3af;margin:24px 0 0">
          Você recebe este e-mail por ser assinante do app Magayver Diag.
        </p>
      </div>
    </div>
  `

  const batch = emails.map(to => ({
    from: process.env.RESEND_FROM ?? 'Magayver Injecar <onboarding@resend.dev>',
    to,
    subject,
    html,
  }))

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

  if (sent > 0) await marcarNotificados(admin, casos.map(c => c.id))

  return NextResponse.json({ sent })
}

async function marcarNotificados(admin: ReturnType<typeof createServiceClient>, ids: string[]) {
  await admin.from('casos').update({ notificado_em: new Date().toISOString() }).in('id', ids)
}
