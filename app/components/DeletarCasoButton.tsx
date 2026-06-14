'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeletarCasoButton({ casoId }: { casoId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  async function deletar() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('casos').delete().eq('id', casoId)
    router.push('/casos')
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-white opacity-80">Confirmar exclusão?</span>
        <button
          onClick={deletar}
          disabled={loading}
          className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-semibold hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Excluindo...' : 'Sim, excluir'}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-semibold"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-semibold hover:bg-red-600"
    >
      Excluir
    </button>
  )
}
