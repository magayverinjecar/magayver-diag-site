'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  q: string
  marca: string
  sistema: string
}

export default function FiltrosBusca({ q, marca, sistema }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [texto, setTexto] = useState(q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(novoQ: string, novaMarca: string, novoSistema: string) {
    const ps = new URLSearchParams()
    if (novoQ) ps.set('q', novoQ)
    if (novaMarca) ps.set('marca', novaMarca)
    if (novoSistema) ps.set('sistema', novoSistema)
    const str = ps.toString()
    return `${pathname}${str ? `?${str}` : ''}`
  }

  const buscar = useCallback((novoQ: string) => {
    router.push(buildUrl(novoQ, marca, sistema))
  }, [marca, sistema, pathname])

  useEffect(() => {
    if (texto === q) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(texto), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [texto])

  function onMarcaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildUrl(texto, e.target.value, sistema))
  }

  function onSistemaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildUrl(texto, marca, e.target.value))
  }

  return (
    <div className="flex flex-col gap-2 mb-5">
      <input
        value={texto}
        onChange={e => setTexto(e.target.value)}
        placeholder="Buscar por sintoma, DTC, veículo..."
        className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
      />
      <div className="flex gap-2">
        <select value={marca} onChange={onMarcaChange} className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">Todas as marcas</option>
          {['VW','GM','Fiat','Ford','Toyota','Honda','Hyundai','Renault','Jeep'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={sistema} onChange={onSistemaChange} className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">Todos os sistemas</option>
          {['Motor','Transmissão','Airbag','ABS','Elétrica'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
