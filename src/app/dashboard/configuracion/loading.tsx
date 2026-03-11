export default function ConfiguracionLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Título */}
      <div className="h-7 w-40 bg-gray-200 rounded" />

      {/* Tabs de secciones */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg" />
        ))}
      </div>

      {/* Panel de contenido */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        {/* Botón añadir */}
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>

        {/* Filas de tabla */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-3 border-b border-gray-50"
          >
            <div className="flex gap-3 items-center">
              <div className="h-4 w-4 bg-gray-100 rounded" />
              <div className="h-4 w-36 bg-gray-100 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-gray-100 rounded-lg" />
              <div className="h-8 w-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
