'use client'

export default function ExportarPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors print:hidden"
    >
      Exportar PDF
    </button>
  )
}
