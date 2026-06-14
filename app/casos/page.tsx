import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasActiveAccess, isAdmin } from '@/lib/check-access'
import Link from 'next/link'
import LogoutButton from '@/app/components/LogoutButton'
import FiltrosBusca from '@/app/components/FiltrosBusca'

const POR_PAGINA = 20

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sistema?: string; marca?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const access = await hasActiveAccess(supabase, user.id)
  if (!access) redirect('/login')

  const params = await searchParams
  const q = params.q ?? ''
  const sistema = params.sistema ?? ''
  const marca = params.marca ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const from = (page - 1) * POR_PAGINA
  const to = from + POR_PAGINA - 1

  let query = supabase
    .from('casos')
    .select('id, titulo, veiculo_marca, veiculo_modelo, veiculo_ano, sistema, sintoma, dtc_codes, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    const dtc = q.toUpperCase().trim()
    query = query.or(
      `titulo.ilike.%${q}%,sintoma.ilike.%${q}%,solucao.ilike.%${q}%,pecas_trocadas.ilike.%${q}%,veiculo_modelo.ilike.%${q}%,dtc_codes.cs.{${dtc}}`
    )
  }
  if (sistema) query = query.eq('sistema', sistema)
  if (marca) query = query.eq('veiculo_marca', marca)

  const { data: casos, count } = await query

  const total = count ?? 0
  const totalPaginas = Math.ceil(total / POR_PAGINA)
  const admin = isAdmin(user.email ?? '')

  function pageUrl(p: number) {
    const ps = new URLSearchParams()
    if (q) ps.set('q', q)
    if (sistema) ps.set('sistema', sistema)
    if (marca) ps.set('marca', marca)
    if (p > 1) ps.set('page', String(p))
    const str = ps.toString()
    return `/casos${str ? `?${str}` : ''}`
  }

  const sistemaCores: Record<string, string> = {
    Motor:        'bg-blue-100 text-blue-800',
    Transmissão:  'bg-amber-100 text-amber-800',
    Airbag:       'bg-red-100 text-red-800',
    ABS:          'bg-purple-100 text-purple-800',
    Elétrica:     'bg-green-100 text-green-800',
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Magayver Injecar <span className="text-blue-200 font-normal">/ Casos</span></span>
        <div className="flex items-center gap-2">
          {admin && (
            <>
              <Link href="/admin" className="text-xs text-blue-200 hover:text-white px-2 py-1.5">Dashboard</Link>
              <Link href="/admin/novo-caso" className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-semibold">
                + Novo caso
              </Link>
            </>
          )}
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 py-5">
        <FiltrosBusca q={q} marca={marca} sistema={sistema} />

        <p className="text-xs text-gray-500 mb-3">
          {total} caso{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          {totalPaginas > 1 && ` · página ${page} de ${totalPaginas}`}
        </p>

        <div className="flex flex-col gap-2">
          {casos?.map(caso => (
            <Link href={`/casos/${caso.id}`} key={caso.id}>
              <div className="bg-white border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{caso.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {caso.veiculo_marca} {caso.veiculo_modelo} {caso.veiculo_ano}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${sistemaCores[caso.sistema] ?? 'bg-gray-100 text-gray-700'}`}>
                    {caso.sistema}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">{caso.sintoma}</p>
                <div className="flex gap-1 flex-wrap">
                  {(caso.dtc_codes as string[])?.map(dtc => (
                    <span key={dtc} className="text-xs font-mono bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded">
                      {dtc}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}

          {(!casos || casos.length === 0) && (
            <div className="text-center py-16 text-gray-400 text-sm">
              Nenhum caso encontrado.
            </div>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 && (
              <Link href={pageUrl(page - 1)}
                className="border border-gray-300 bg-white text-gray-700 text-sm px-4 py-2 rounded hover:border-blue-400 transition-colors">
                ← Anterior
              </Link>
            )}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginas || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="text-gray-400 text-sm px-1">...</span>
                ) : (
                  <Link key={p} href={pageUrl(p as number)}
                    className={`border text-sm w-9 h-9 flex items-center justify-center rounded transition-colors
                      ${p === page
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                      }`}>
                    {p}
                  </Link>
                )
              )}
            {page < totalPaginas && (
              <Link href={pageUrl(page + 1)}
                className="border border-gray-300 bg-white text-gray-700 text-sm px-4 py-2 rounded hover:border-blue-400 transition-colors">
                Próxima →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
