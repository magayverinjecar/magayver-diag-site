'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comentario {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  conteudo: string
  created_at: string
}

interface Props {
  casoId: string
  comentariosIniciais: Comentario[]
  userId: string
  userEmail: string
  userName: string
  isAdmin: boolean
}

function exibirNome(nome: string | null, email: string): string {
  if (nome && nome.trim().length > 0) return nome.trim().split(' ')[0]
  const parte = email.split('@')[0]
  const slug = parte.split(/[._-]/)[0]
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export default function ComentariosSection({ casoId, comentariosIniciais, userId, userEmail, userName, isAdmin }: Props) {
  const [comentarios, setComentarios] = useState<Comentario[]>(comentariosIniciais)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviar() {
    if (!texto.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('comentarios')
      .insert({ caso_id: casoId, user_id: userId, user_email: userEmail, user_name: userName || null, conteudo: texto.trim() })
      .select()
      .single()

    if (!error && data) {
      setComentarios(prev => [...prev, data])
      setTexto('')
    }
    setLoading(false)
  }

  async function deletar(id: string) {
    const supabase = createClient()
    await supabase.from('comentarios').delete().eq('id', id)
    setComentarios(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">
        Comentários <span className="text-gray-400 font-normal">({comentarios.length})</span>
      </h2>

      <div className="flex flex-col gap-3 mb-4">
        {comentarios.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">Nenhum comentário ainda. Seja o primeiro!</p>
        )}
        {comentarios.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
              {exibirNome(c.user_name, c.user_email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2.5">
              <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-gray-800">{exibirNome(c.user_name, c.user_email)}</span>
                  <span className="text-xs text-gray-400 truncate">{c.user_email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                  {(c.user_id === userId || isAdmin) && (
                    <button onClick={() => deletar(c.id)} className="text-gray-400 hover:text-red-500 text-sm leading-none">×</button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.conteudo}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Adicione um comentário, dúvida ou observação..."
          className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none min-h-20 bg-white"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={enviar}
            disabled={loading || !texto.trim()}
            className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Enviando...' : 'Comentar'}
          </button>
        </div>
      </div>
    </div>
  )
}
