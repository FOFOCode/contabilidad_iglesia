"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  /** Clase para ocultar en ciertos breakpoints, ej: "hidden md:table-cell" */
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function Table<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = "No hay datos disponibles",
}: TableProps<T>) {
  // Generar clase de visibilidad basada en props
  const getVisibilityClass = (column: Column<T>) => {
    if (column.hideOnMobile && column.hideOnTablet) {
      return "hidden lg:table-cell";
    }
    if (column.hideOnMobile) {
      return "hidden md:table-cell";
    }
    if (column.hideOnTablet) {
      return "hidden lg:table-cell";
    }
    return "";
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                  column.className || ""
                } ${getVisibilityClass(column)}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-gray-500"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-12 h-12 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-3 py-2.5 text-sm text-gray-700 ${
                      column.className || ""
                    } ${getVisibilityClass(column)}`}
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
