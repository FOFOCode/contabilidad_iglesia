export default function FormLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <div className="h-10 w-24 bg-gray-100 rounded-lg" />
          <div className="h-10 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
