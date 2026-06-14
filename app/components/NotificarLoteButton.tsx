'use client'

import { useState } from 'react'

interface Props {
  casos: { id: string; titulo: string; marca: string; modelo: string; ano: string; sistema: string }[]
}

export default function NotificarLoteButton({ casos }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')
  const [enviados, setEnviados] = useState(0)

  async function notificar() {
    if (!confirm(`Enviar 1 e-mail com ${casos.length} caso${casos.length > 1 ? 's' : ''} para todos os assinantes?`)) return
    setStatus('loading')
    try {
      const res = await fetch('/api/notificar-novo-caso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casos }),
      })
      const data = await res.json()
      setEnviados(data.sent ?? 0)
      setStatus('ok')
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      setStatus('erro')
    }
  }

  if (status === 'ok') {
    return <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded font-medium">E-mail enviado para {enviados} assinante{enviados !== 1 ? 's' : ''} ✓</span>
  }
  if (status === 'erro') {
    return <span className="text-xs text-red-600">Erro ao enviar. Tente novamente.</span>
  }

  return (
    <button
      onClick={notificar}
      disabled={status === 'loading'}
      className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {status === 'loading' ? 'Enviando...' : `Notificar assinantes (${casos.length} caso${casos.length > 1 ? 's' : ''})`}
    </button>
  )
}
