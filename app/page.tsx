import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
          </svg>
        </div>

        <h1 className="text-3xl font-medium text-gray-900 mb-3">
          Magayver Diag
        </h1>
        <p className="text-gray-500 mb-2 text-lg">Base de Casos Resolvidos</p>
        <p className="text-gray-400 text-sm mb-8">
          Acesso exclusivo para assinantes do app Magayver Diag.
          Consulte defeitos já solucionados por marca, modelo e código DTC.
        </p>

        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Entrar com minha conta
        </Link>

        <p className="text-xs text-gray-400 mt-6">
          Ainda não assina o app? Baixe o Magayver Diag na Play Store.
        </p>
      </div>
    </main>
  )
}
