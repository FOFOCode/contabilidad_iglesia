export default function ReportesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-28 bg-gray-200 rounded" />
      {/* Filter panel */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="h-9 w-40 bg-gray-100 rounded-lg" />
        <div className="h-9 w-40 bg-gray-100 rounded-lg" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
      </div>
      {/* Chart placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="h-5 w-48 bg-gray-200 rounded mb-6" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
      {/* Table placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 flex-1 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
