import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasActiveAccess } from '@/lib/check-access'
import Link from 'next/link'

export default async function CasoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const access = await hasActiveAccess(supabase, user.id)
  if (!access) redirect('/login')

  const { id } = await params
  const { data: caso } = await supabase.from('casos').select('*').eq('id', id).single()
  if (!caso) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 px-6 py-3 flex items-center gap-4">
        <Link href="/casos" className="text-blue-200 text-sm hover:text-white">← Voltar</Link>
        <span className="text-white font-medium">Magayver Diag</span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-lg font-medium text-gray-900">{caso.titulo}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {caso.veiculo_marca} {caso.veiculo_modelo} {caso.veiculo_ano} · {caso.veiculo_versao}
              </p>
            </div>
            <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium shrink-0">
              Resolvido
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Field label="Sistema" value={caso.sistema} />
            <Field label="Sintoma principal" value={caso.sintoma} />
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2">Códigos DTC encontrados</p>
            <div className="flex gap-2 flex-wrap">
              {(caso.dtc_codes as string[])?.map(dtc => (
                <span key={dtc} className="font-mono text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-lg">
                  {dtc}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mb-6">
            <p className="text-xs text-gray-400 mb-2">Solução aplicada</p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{caso.solucao}</p>
          </div>

          {caso.pecas_trocadas && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">Peças substituídas</p>
              <p className="text-sm text-gray-800">{caso.pecas_trocadas}</p>
            </div>
          )}

          {caso.observacoes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-medium mb-1">Observações</p>
              <p className="text-sm text-amber-800 leading-relaxed">{caso.observacoes}</p>
            </div>
          )}

          <p className="text-xs text-gray-300 mt-6">
            Cadastrado em {new Date(caso.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </main>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  )
}
