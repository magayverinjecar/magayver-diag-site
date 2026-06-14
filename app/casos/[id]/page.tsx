import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasActiveAccess, isAdmin } from '@/lib/check-access'
import Link from 'next/link'
import ComentariosSection from '@/app/components/ComentariosSection'
import DeletarCasoButton from '@/app/components/DeletarCasoButton'

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
        <div className="bg-white border border-gray-300 rounded-lg p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-snug">{caso.titulo}</h1>
              <p className="text-xs text-gray-500 mt-1">
                {caso.veiculo_marca} {caso.veiculo_modelo} {caso.veiculo_ano} · {caso.veiculo_versao}
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded font-medium shrink-0">
              Resolvido
            </span>
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

        <ComentariosSection
          casoId={id}
          comentariosIniciais={comentarios ?? []}
          userId={user.id}
          userEmail={user.email ?? ''}
          userName={userName}
          isAdmin={admin}
        />
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
