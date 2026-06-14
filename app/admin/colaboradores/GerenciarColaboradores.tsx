'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Colaborador {
  id: string
  user_email: string
  nome: string | null
  ativo: boolean
  created_at: string
}

export default function GerenciarColaboradores({ colaboradoresIniciais }: { colaboradoresIniciais: Colaborador[] }) {
  const [lista, setLista] = useState<Colaborador[]>(colaboradoresIniciais)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function adicionar() {
    if (!email.trim()) return
    setErro('')
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('colaboradores')
      .insert({ user_email: email.trim().toLowerCase(), nome: nome.trim() || null })
      .select().single()
    if (error) {
      setErro(error.message.includes('unique') ? 'Este e-mail já está cadastrado.' : 'Erro: ' + error.message)
    } else {
      setLista(prev => [data, ...prev])
      setEmail('')
      setNome('')
    }
    setLoading(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const supabase = createClient()
    await supabase.from('colaboradores').update({ ativo: !ativo }).eq('id', id)
    setLista(prev => prev.map(c => c.id === id ? { ...c, ativo: !ativo } : c))
  }

  async function remover(id: string) {
    if (!confirm('Remover este colaborador?')) return
    const supabase = createClient()
    await supabase.from('colaboradores').delete().eq('id', id)
    setLista(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Adicionar colaborador</h2>
        <p className="text-xs text-gray-500 mb-3">
          O colaborador deve se cadastrar no site primeiro com o e-mail abaixo. Após cadastrado aqui, ele terá acesso para adicionar casos.
        </p>
        <div className="flex flex-col gap-2">
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome (opcional)"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-mail"
            type="email"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button
            onClick={adicionar}
            disabled={loading || !email.trim()}
            className="bg-blue-600 text-white rounded px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            {loading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Colaboradores cadastrados <span className="text-gray-400 font-normal">({lista.length})</span>
        </h2>

        {lista.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Nenhum colaborador ainda.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {lista.map(c => (
              <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {c.nome && <p className="text-sm font-medium text-gray-900">{c.nome}</p>}
                  <p className="text-xs text-gray-500 truncate">{c.user_email}</p>
                  <p className="text-xs mt-0.5">
                    <span className={`font-medium ${c.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-gray-400"> · desde {new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAtivo(c.id, c.ativo)}
                    className="text-xs border border-gray-300 px-2.5 py-1 rounded hover:bg-gray-50"
                  >
                    {c.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => remover(c.id)}
                    className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
