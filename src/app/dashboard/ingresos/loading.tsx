export default function TablePageLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header + button row */}
      <div className="flex justify-between items-center">
        <div className="h-7 w-32 bg-gray-200 rounded" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-3">
        <div className="h-9 w-48 bg-gray-100 rounded-lg" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-50"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-gray-100 rounded"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
