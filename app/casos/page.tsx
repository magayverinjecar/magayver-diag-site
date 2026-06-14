import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasActiveAccess, isAdmin } from '@/lib/check-access'
import Link from 'next/link'
import LogoutButton from '@/app/components/LogoutButton'

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sistema?: string; marca?: string }>
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

  let query = supabase
    .from('casos')
    .select('id, titulo, veiculo_marca, veiculo_modelo, veiculo_ano, sistema, sintoma, dtc_codes, created_at')
    .order('created_at', { ascending: false })

  if (q) {
    const dtc = q.toUpperCase().trim()
    query = query.or(
      `titulo.ilike.%${q}%,sintoma.ilike.%${q}%,solucao.ilike.%${q}%,pecas_trocadas.ilike.%${q}%,veiculo_modelo.ilike.%${q}%,dtc_codes.cs.{${dtc}}`
    )
  }
  if (sistema) query = query.eq('sistema', sistema)
  if (marca) query = query.eq('veiculo_marca', marca)

  const { data: casos } = await query

  const admin = isAdmin(user.email ?? '')

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
        <div className="flex items-center gap-3">
          {admin && (
            <Link href="/admin/novo-caso" className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-semibold">
              + Novo caso
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 py-5">
        <form method="GET" className="flex flex-col gap-2 mb-5">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por sintoma, DTC, veículo..."
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select name="marca" defaultValue={marca} className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm bg-white outline-none">
              <option value="">Todas as marcas</option>
              {['VW','GM','Fiat','Ford','Toyota','Honda','Hyundai','Renault','Jeep'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select name="sistema" defaultValue={sistema} className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm bg-white outline-none">
              <option value="">Todos os sistemas</option>
              {['Motor','Transmissão','Airbag','ABS','Elétrica'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700">
              Buscar
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mb-3">{casos?.length ?? 0} casos encontrados</p>

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
      </div>
    </main>
  )
}
