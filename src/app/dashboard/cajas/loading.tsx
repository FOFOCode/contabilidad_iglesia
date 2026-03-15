export default function CajasLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-20 bg-gray-200 rounded" />
      {/* Summary card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-48">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-7 w-12 bg-gray-200 rounded" />
      </div>
      {/* Caja cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3"
          >
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <div className="h-5 w-12 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
