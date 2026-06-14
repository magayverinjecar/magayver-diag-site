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

  if (q) query = query.or(`titulo.ilike.%${q}%,sintoma.ilike.%${q}%,solucao.ilike.%${q}%`)
  if (sistema) query = query.eq('sistema', sistema)
  if (marca) query = query.ilike('veiculo_marca', marca)

  const { data: casos } = await query

  const admin = isAdmin(user.email ?? '')

  const sistemaCores: Record<string, string> = {
    Motor:        'bg-blue-50 text-blue-700',
    Transmissão:  'bg-amber-50 text-amber-700',
    Airbag:       'bg-red-50 text-red-700',
    ABS:          'bg-purple-50 text-purple-700',
    Elétrica:     'bg-green-50 text-green-700',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 px-6 py-3 flex items-center justify-between">
        <span className="text-white font-medium">Magayver Diag <span className="text-blue-200 text-sm font-normal">/ Base de Casos</span></span>
        <div className="flex items-center gap-4">
          {admin && (
            <Link href="/admin/novo-caso" className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-lg font-medium">
              + Novo caso
            </Link>
          )}
          <span className="text-blue-200 text-xs">{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form method="GET" className="flex gap-2 mb-8 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por sintoma, DTC, veículo..."
            className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
          />
          <select name="marca" defaultValue={marca} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
            <option value="">Todas as marcas</option>
            {['VW','GM','Fiat','Ford','Toyota','Honda','Hyundai','Renault','Jeep'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select name="sistema" defaultValue={sistema} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
            <option value="">Todos os sistemas</option>
            {['Motor','Transmissão','Airbag','ABS','Elétrica'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Buscar
          </button>
        </form>

        <p className="text-sm text-gray-400 mb-4">{casos?.length ?? 0} casos encontrados</p>

        <div className="flex flex-col gap-3">
          {casos?.map(caso => (
            <Link href={`/casos/${caso.id}`} key={caso.id}>
              <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{caso.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {caso.veiculo_marca} {caso.veiculo_modelo} {caso.veiculo_ano}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${sistemaCores[caso.sistema] ?? 'bg-gray-100 text-gray-600'}`}>
                    {caso.sistema}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{caso.sintoma}</p>
                <div className="flex gap-1 flex-wrap">
                  {(caso.dtc_codes as string[])?.map(dtc => (
                    <span key={dtc} className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
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
