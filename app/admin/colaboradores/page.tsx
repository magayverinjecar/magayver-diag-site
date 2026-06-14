import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/check-access'
import Link from 'next/link'
import GerenciarColaboradores from './GerenciarColaboradores'

export default async function ColaboradoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email ?? '')) redirect('/casos')

  const { data: colaboradores } = await supabase
    .from('colaboradores')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-blue-200 text-sm hover:text-white">← Dashboard</Link>
          <span className="text-white font-semibold text-sm">Colaboradores</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 py-5">
        <GerenciarColaboradores colaboradoresIniciais={colaboradores ?? []} />
      </div>
    </main>
  )
}
