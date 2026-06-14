export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 px-4 py-3 h-11" />
      <div className="max-w-2xl mx-auto px-3 py-5">
        <div className="h-10 bg-gray-200 rounded mb-3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex justify-between mb-2 gap-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded shrink-0" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
