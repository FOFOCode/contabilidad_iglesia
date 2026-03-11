export default function TablePageLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-7 w-28 bg-gray-200 rounded" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-3">
        <div className="h-9 w-48 bg-gray-100 rounded-lg" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-50"
          >
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
