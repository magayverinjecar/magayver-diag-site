export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 px-4 py-3 h-11" />
      <div className="max-w-2xl mx-auto px-3 py-5 flex flex-col gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
          <div className="flex justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
          <div className="border-t border-gray-100 pt-4 mb-4">
            <div className="h-3 bg-gray-100 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-full mb-1" />
            <div className="h-3 bg-gray-100 rounded w-5/6 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    </main>
  )
}
