"use client";

/**
 * useDebounce: retrasa la actualización de un valor hasta que el usuario
 * deja de escribir por `delay` ms. Evita renders/queries excesivos en
 * inputs de búsqueda y filtros de texto.
 */
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
