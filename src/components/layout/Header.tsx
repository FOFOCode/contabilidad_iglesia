"use client";

import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
}

export default function Header({ title, subtitle, backUrl }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          {backUrl && (
            <Link
              href={backUrl}
              className="p-2 -ml-2 text-[#73a9bf] hover:text-[#40768c] hover:bg-[#eef4f7] rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          {/* Fecha actual */}
          <div className="text-xs md:text-sm text-gray-500">
            {new Date().toLocaleDateString("es-GT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
