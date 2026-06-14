import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/check-access'
import Link from 'next/link'
import NotificarLoteButton from '@/app/components/NotificarLoteButton'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email ?? '')) redirect('/casos')

  const [
    { count: totalCasos },
    { count: totalComentarios },
    { data: casos },
    { data: comentariosRecentes },
    { data: naoNotificados },
  ] = await Promise.all([
    supabase.from('casos').select('*', { count: 'exact', head: true }),
    supabase.from('comentarios').select('*', { count: 'exact', head: true }),
    supabase.from('casos').select('sistema, veiculo_marca, created_at').order('created_at', { ascending: false }),
    supabase
      .from('comentarios')
      .select('id, conteudo, created_at, user_email, user_name, caso_id, casos(titulo)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('casos')
      .select('id, titulo, veiculo_marca, veiculo_modelo, veiculo_ano, sistema')
      .is('notificado_em', null)
      .order('created_at', { ascending: false }),
  ])

  // Agrupa por sistema
  const porSistema: Record<string, number> = {}
  for (const c of casos ?? []) {
    if (c.sistema) porSistema[c.sistema] = (porSistema[c.sistema] ?? 0) + 1
  }
  const sistemasOrdenados = Object.entries(porSistema).sort((a, b) => b[1] - a[1])
  const maxSistema = sistemasOrdenados[0]?.[1] ?? 1

  // Agrupa por marca
  const porMarca: Record<string, number> = {}
  for (const c of casos ?? []) {
    if (c.veiculo_marca) porMarca[c.veiculo_marca] = (porMarca[c.veiculo_marca] ?? 0) + 1
  }
  const marcasOrdenadas = Object.entries(porMarca).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxMarca = marcasOrdenadas[0]?.[1] ?? 1

  // Casos por mês (últimos 6 meses)
  const hoje = new Date()
  const meses: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const count = (casos ?? []).filter(c => {
      const cd = new Date(c.created_at)
      return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth()
    }).length
    meses.push({ label, count })
  }
  const maxMes = Math.max(...meses.map(m => m.count), 1)

  function exibirNome(nome: string | null, email: string) {
    if (nome && nome.trim()) return nome.trim().split(' ')[0]
    return email.split('@')[0].split(/[._-]/)[0]
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Admin — Magayver Injecar</span>
        <div className="flex items-center gap-2">
          <Link href="/admin/colaboradores" className="text-xs text-blue-200 hover:text-white px-2 py-1.5">Colaboradores</Link>
          <Link href="/admin/novo-caso" className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-semibold">
            + Novo caso
          </Link>
          <Link href="/casos" className="text-xs text-blue-200 hover:text-white">
            Ver site →
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 py-5 flex flex-col gap-4">

        {/* Totais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total de casos</p>
            <p className="text-3xl font-bold text-gray-900">{totalCasos ?? 0}</p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total de comentários</p>
            <p className="text-3xl font-bold text-gray-900">{totalComentarios ?? 0}</p>
          </div>
        </div>

        {/* Casos não notificados */}
        {(naoNotificados ?? []).length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-amber-900">
                  {naoNotificados!.length} caso{naoNotificados!.length > 1 ? 's' : ''} sem notificação
                </h2>
                <p className="text-xs text-amber-700 mt-0.5">Assinantes ainda não foram avisados sobre estes casos</p>
              </div>
              <NotificarLoteButton casos={(naoNotificados ?? []).map(c => ({
                id: c.id,
                titulo: c.titulo,
                marca: c.veiculo_marca,
                modelo: c.veiculo_modelo,
                ano: c.veiculo_ano ?? '',
                sistema: c.sistema,
              }))} />
            </div>
            <div className="flex flex-col divide-y divide-amber-200">
              {(naoNotificados ?? []).slice(0, 5).map(c => (
                <div key={c.id} className="py-2 first:pt-0 last:pb-0">
                  <Link href={`/casos/${c.id}`} className="text-xs font-medium text-amber-900 hover:underline">{c.titulo}</Link>
                  <p className="text-xs text-amber-700">{c.veiculo_marca} {c.veiculo_modelo} · {c.sistema}</p>
                </div>
              ))}
              {(naoNotificados ?? []).length > 5 && (
                <p className="text-xs text-amber-600 pt-2">+ {naoNotificados!.length - 5} outros casos</p>
              )}
            </div>
          </div>
        )}

        {/* Casos por mês */}
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Casos por mês</h2>
          <div className="flex items-end gap-2 h-24">
            {meses.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-700 font-medium">{m.count > 0 ? m.count : ''}</span>
                <div
                  className="w-full bg-blue-500 rounded-sm"
                  style={{ height: `${Math.max((m.count / maxMes) * 72, m.count > 0 ? 6 : 2)}px` }}
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por sistema */}
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Casos por sistema</h2>
          <div className="flex flex-col gap-2.5">
            {sistemasOrdenados.map(([sistema, count]) => (
              <div key={sistema} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-24 shrink-0">{sistema}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(count / maxSistema) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right shrink-0">{count}</span>
              </div>
            ))}
            {sistemasOrdenados.length === 0 && (
              <p className="text-xs text-gray-400">Nenhum caso cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* Por marca */}
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Top marcas</h2>
          <div className="flex flex-col gap-2.5">
            {marcasOrdenadas.map(([marca, count]) => (
              <div key={marca} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-24 shrink-0">{marca}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(count / maxMarca) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right shrink-0">{count}</span>
              </div>
            ))}
            {marcasOrdenadas.length === 0 && (
              <p className="text-xs text-gray-400">Nenhum caso cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* Comentários recentes */}
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Comentários recentes</h2>
          {(comentariosRecentes ?? []).length === 0 ? (
            <p className="text-xs text-gray-400">Nenhum comentário ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {(comentariosRecentes ?? []).map((c: any) => (
                <Link
                  key={c.id}
                  href={`/casos/${c.caso_id}`}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col gap-0.5 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">
                      {exibirNome(c.user_name, c.user_email)}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.casos?.titulo}</p>
                  <p className="text-xs text-gray-700 line-clamp-2 mt-0.5">{c.conteudo}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
