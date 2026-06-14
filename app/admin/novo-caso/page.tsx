'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SISTEMAS = ['Motor', 'Transmissão', 'Airbag', 'ABS', 'Elétrica', 'Arrefecimento', 'Direção', 'Outro']
const MARCAS = ['VW', 'GM', 'Fiat', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Renault', 'Jeep', 'Outra']

export default function NovoCasoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dtcInput, setDtcInput] = useState('')
  const [dtcList, setDtcList] = useState<string[]>([])

  const [form, setForm] = useState({
    titulo: '',
    veiculo_marca: '',
    veiculo_modelo: '',
    veiculo_ano: '',
    veiculo_versao: '',
    sistema: '',
    sintoma: '',
    solucao: '',
    pecas_trocadas: '',
    observacoes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addDtc() {
    const code = dtcInput.trim().toUpperCase()
    if (code && !dtcList.includes(code)) {
      setDtcList(prev => [...prev, code])
    }
    setDtcInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.from('casos').insert({
      ...form,
      dtc_codes: dtcList,
    })

    if (err) {
      setError('Erro ao salvar: ' + err.message)
      setLoading(false)
      return
    }

    router.push('/casos')
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-200 text-sm hover:text-white">← Voltar</button>
        <span className="text-white font-medium">Novo caso</span>
      </header>

      <div className="max-w-2xl mx-auto px-3 py-5 w-full">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-5">

          <Field label="Título do caso" required>
            <input className={input} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Motor apagando em marcha lenta" required />
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <Field label="Marca" required>
              <select className={input} value={form.veiculo_marca} onChange={e => set('veiculo_marca', e.target.value)} required>
                <option value="">Selecionar</option>
                {MARCAS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Modelo" required>
              <input className={input} value={form.veiculo_modelo} onChange={e => set('veiculo_modelo', e.target.value)} placeholder="Ex: Gol" required />
            </Field>
            <Field label="Ano">
              <input className={input} value={form.veiculo_ano} onChange={e => set('veiculo_ano', e.target.value)} placeholder="Ex: 2018" />
            </Field>
            <Field label="Versão">
              <input className={input} value={form.veiculo_versao} onChange={e => set('veiculo_versao', e.target.value)} placeholder="Ex: 1.6 Flex G5" />
            </Field>
          </div>

          <Field label="Sistema" required>
            <select className={input} value={form.sistema} onChange={e => set('sistema', e.target.value)} required>
              <option value="">Selecionar</option>
              {SISTEMAS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Códigos DTC">
            <div className="flex gap-2">
              <input
                className={input}
                value={dtcInput}
                onChange={e => setDtcInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDtc())}
                placeholder="Ex: P0300"
              />
              <button type="button" onClick={addDtc} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Adicionar
              </button>
            </div>
            {dtcList.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {dtcList.map(dtc => (
                  <span key={dtc} className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                    {dtc}
                    <button type="button" onClick={() => setDtcList(p => p.filter(d => d !== dtc))} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Sintoma principal" required>
            <input className={input} value={form.sintoma} onChange={e => set('sintoma', e.target.value)} placeholder="Ex: Motor tropeçando em idle" required />
          </Field>

          <Field label="Solução aplicada" required>
            <textarea className={`${input} min-h-28 resize-y`} value={form.solucao} onChange={e => set('solucao', e.target.value)} placeholder="Descreva o passo a passo da solução..." required />
          </Field>

          <Field label="Peças substituídas">
            <input className={input} value={form.pecas_trocadas} onChange={e => set('pecas_trocadas', e.target.value)} placeholder="Ex: Regulador de pressão de combustível" />
          </Field>

          <Field label="Observações">
            <textarea className={`${input} min-h-20 resize-y`} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Dicas extras, cuidados, referências..." />
          </Field>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar caso'}
          </button>
        </form>
      </div>
    </main>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
