import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasActiveAccess, isAdmin } from '@/lib/check-access'
import Link from 'next/link'
import ComentariosSection from '@/app/components/ComentariosSection'
import DeletarCasoButton from '@/app/components/DeletarCasoButton'
import ExportarPdfButton from '@/app/components/ExportarPdfButton'

export default async function CasoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const access = await hasActiveAccess(supabase, user.id)
  if (!access) redirect('/login')

  const { id } = await params

  const [{ data: caso }, { data: comentarios }] = await Promise.all([
    supabase.from('casos').select('*').eq('id', id).single(),
    supabase.from('comentarios').select('*').eq('caso_id', id).order('created_at', { ascending: true }),
  ])

  if (!caso) notFound()

  // Busca casos relacionados: mesmo DTC ou mesmo veículo (excluindo o atual)
  const dtcs: string[] = caso.dtc_codes ?? []
  const [{ data: porDtc }, { data: porVeiculo }] = await Promise.all([
    dtcs.length > 0
      ? supabase
          .from('casos')
          .select('id, titulo, veiculo_marca, veiculo_modelo, veiculo_ano, sistema, dtc_codes')
          .filter('dtc_codes', 'ov', `{${dtcs.join(',')}}`)
          .neq('id', id)
          .limit(4)
      : Promise.resolve({ data: [] }),
    supabase
      .from('casos')
      .select('id, titulo, veiculo_marca, veiculo_modelo, veiculo_ano, sistema, dtc_codes')
      .eq('veiculo_marca', caso.veiculo_marca)
      .eq('veiculo_modelo', caso.veiculo_modelo)
      .neq('id', id)
      .limit(4),
  ])

  // Mescla e deduplica, priorizando os de DTC
  const seenIds = new Set<string>()
  const relacionados: typeof porDtc = []
  for (const c of [...(porDtc ?? []), ...(porVeiculo ?? [])]) {
    if (!seenIds.has(c.id) && relacionados.length < 4) {
      seenIds.add(c.id)
      relacionados.push(c)
    }
  }

  const admin = isAdmin(user.email ?? '')
  const userName = (user.user_metadata?.full_name as string | undefined) ?? ''

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/casos" className="text-blue-200 text-sm hover:text-white shrink-0">← Voltar</Link>
          <span className="text-white font-semibold text-sm truncate">Magayver Injecar</span>
        </div>
        {admin && (
          <div className="flex items-center gap-2">
            <Link href={`/admin/editar/${id}`} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-semibold">
              Editar
            </Link>
            <DeletarCasoButton casoId={id} />
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-3 py-5 flex flex-col gap-3">
        {/* Cabeçalho visível apenas no PDF */}
        <div data-print="header" className="hidden">
          <p className="text-lg font-bold text-blue-700">Magayver Injecar</p>
          <p className="text-xs text-gray-500">Base de Dados de Defeitos Automotivos Resolvidos</p>
        </div>

        <div data-print="caso" className="bg-white border border-gray-300 rounded-lg p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-snug">{caso.titulo}</h1>
              <p className="text-xs text-gray-500 mt-1">
                {caso.veiculo_marca} {caso.veiculo_modelo} {caso.veiculo_ano} · {caso.veiculo_versao}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ExportarPdfButton />
              <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded font-medium">
                Resolvido
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Field label="Sistema" value={caso.sistema} />
            <Field label="Sintoma" value={caso.sintoma} />
          </div>

          {(caso.dtc_codes as string[])?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1.5">Códigos DTC</p>
              <div className="flex gap-2 flex-wrap">
                {(caso.dtc_codes as string[]).map(dtc => (
                  <span key={dtc} className="font-mono text-sm bg-gray-100 border border-gray-300 text-gray-800 px-3 py-1 rounded">
                    {dtc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Solução aplicada</p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{caso.solucao}</p>
          </div>

          {caso.pecas_trocadas && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1.5">Peças substituídas</p>
              <p className="text-sm text-gray-800">{caso.pecas_trocadas}</p>
            </div>
          )}

          {caso.observacoes && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-xs text-amber-700 font-semibold mb-1">Observações</p>
              <p className="text-sm text-amber-900 leading-relaxed">{caso.observacoes}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Cadastrado em {new Date(caso.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div data-print="hide">
        <ComentariosSection
          casoId={id}
          comentariosIniciais={comentarios ?? []}
          userId={user.id}
          userEmail={user.email ?? ''}
          userName={userName}
          isAdmin={admin}
        />
        </div>

        {relacionados.length > 0 && (
          <div data-print="hide" className="bg-white border border-gray-300 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Casos relacionados</h2>
            <div className="flex flex-col divide-y divide-gray-100">
              {relacionados.map(r => {
                const dtcsComuns = (r.dtc_codes as string[] ?? []).filter((d: string) => dtcs.includes(d))
                return (
                  <Link
                    key={r.id}
                    href={`/casos/${r.id}`}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 leading-snug">{r.titulo}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">{r.veiculo_marca} {r.veiculo_modelo} {r.veiculo_ano}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{r.sistema}</span>
                      {dtcsComuns.length > 0 && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          {dtcsComuns.map((d: string) => (
                            <span key={d} className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">{d}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value}</p>
    </div>
  )
}
