"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Button, Combobox, Input, Badge, Table } from "@/components/ui";
import { eliminarDonacion } from "@/app/actions/donaciones";
import { useRouter } from "next/navigation";

interface Moneda {
  id: string;
  codigo: string;
  simbolo: string;
}

interface TipoOfrenda {
  id: string;
  nombre: string;
}

interface DonacionData {
  id: string;
  nombre: string;
  telefono: string | null;
  fecha: Date;
  monto: number;
  comentario: string | null;
  tipoOfrenda: TipoOfrenda;
  moneda: Moneda;
  caja: { nombre: string };
  usuario: { nombre: string; apellido: string } | null;
}

interface DonacionesClientProps {
  donaciones: DonacionData[];
  tiposOfrenda: TipoOfrenda[];
  monedas: Moneda[];
  tieneCajaGeneral: boolean;
}

export function DonacionesClient({
  donaciones: donacionesIniciales,
  tiposOfrenda,
  monedas,
  tieneCajaGeneral,
}: DonacionesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [donaciones, setDonaciones] = useState(donacionesIniciales);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<DonacionData | null>(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  // Filtros
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    tipoOfrendaId: "",
    nombre: "",
  });

  // Memoizar opciones de select
  const tipoOfrendaOptions = useMemo(
    () => tiposOfrenda.map((t) => ({ value: t.id, label: t.nombre })),
    [tiposOfrenda]
  );

  // Filtrar donaciones localmente
  const donacionesFiltradas = useMemo(
    () =>
      donaciones.filter((donacion) => {
        if (filtros.desde) {
          const desde = new Date(filtros.desde);
          if (new Date(donacion.fecha) < desde) return false;
        }
        if (filtros.hasta) {
          const hasta = new Date(filtros.hasta);
          hasta.setHours(23, 59, 59);
          if (new Date(donacion.fecha) > hasta) return false;
        }
        if (
          filtros.tipoOfrendaId &&
          donacion.tipoOfrenda.id !== filtros.tipoOfrendaId
        ) {
          return false;
        }
        if (
          filtros.nombre &&
          !donacion.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [donaciones, filtros]
  );

  // Cálculos de paginación
  const totalPaginas = Math.ceil(donacionesFiltradas.length / filasPorPagina);
  const donacionesPaginadas = useMemo(
    () =>
      donacionesFiltradas.slice(
        (paginaActual - 1) * filasPorPagina,
        paginaActual * filasPorPagina
      ),
    [donacionesFiltradas, paginaActual]
  );

  // Resetear página cuando cambian los filtros
  const handleFiltroChange = (nuevosFiltros: typeof filtros) => {
    setFiltros(nuevosFiltros);
    setPaginaActual(1);
  };

  // Calcular totales por moneda
  const totalesPorMoneda = useMemo(() => {
    const totales: Record<string, { total: number; simbolo: string }> = {};
    donacionesFiltradas.forEach((d) => {
      if (!totales[d.moneda.id]) {
        totales[d.moneda.id] = { total: 0, simbolo: d.moneda.simbolo };
      }
      totales[d.moneda.id].total += d.monto;
    });
    return Object.values(totales);
  }, [donacionesFiltradas]);

  const handleEliminar = useCallback(
    (id: string) => {
      startTransition(async () => {
        try {
          await eliminarDonacion(id);
          setDonaciones((prev) => prev.filter((d) => d.id !== id));
          setDeleteConfirm(null);
          router.refresh();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Error al eliminar donación"
          );
        }
      });
    },
    [router]
  );

  const limpiarFiltros = useCallback(() => {
    handleFiltroChange({
      desde: "",
      hasta: "",
      tipoOfrendaId: "",
      nombre: "",
    });
  }, []);

  const formatearFecha = (fecha: Date) => {
    return new Date(fecha).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearMonto = (monto: number, simbolo: string) => {
    return `${simbolo}${monto.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
    })}`;
  };

  if (!tieneCajaGeneral) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Caja General No Configurada
          </h2>
          <p className="text-gray-600 mb-6">
            Para registrar donaciones, primero debe configurar una caja como
            &quot;General&quot; en la sección de Configuración.
          </p>
          <Link href="/dashboard/configuracion">
            <Button>Ir a Configuración</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Mensaje de error */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              ✕
            </Button>
          </div>
        </Card>
      )}

      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-500">
            {donacionesFiltradas.length} donaciones encontradas
          </p>
          {totalesPorMoneda.length > 0 && (
            <div className="flex gap-4 mt-1">
              {totalesPorMoneda.map((t, i) => (
                <span key={i} className="text-sm font-medium text-[#2ba193]">
                  Total: {formatearMonto(t.total, t.simbolo)}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link href="/dashboard/donaciones/nuevo">
          <Button>➕ Nueva Donación</Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            type="date"
            label="Desde"
            value={filtros.desde}
            onChange={(e) =>
              handleFiltroChange({ ...filtros, desde: e.target.value })
            }
          />
          <Input
            type="date"
            label="Hasta"
            value={filtros.hasta}
            onChange={(e) =>
              handleFiltroChange({ ...filtros, hasta: e.target.value })
            }
          />
          <Combobox
            label="Tipo de Ofrenda"
            options={tipoOfrendaOptions}
            value={filtros.tipoOfrendaId}
            onChange={(value) =>
              handleFiltroChange({ ...filtros, tipoOfrendaId: value })
            }
            placeholder="Todos los tipos"
          />
          <Input
            label="Nombre Donante"
            placeholder="Buscar por nombre..."
            value={filtros.nombre}
            onChange={(e) =>
              handleFiltroChange({ ...filtros, nombre: e.target.value })
            }
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de donaciones */}
      <Card>
        {donacionesPaginadas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No hay donaciones registradas</p>
            <Link href="/dashboard/donaciones/nuevo" className="mt-4 block">
              <Button variant="secondary">Registrar primera donación</Button>
            </Link>
          </div>
        ) : (
          <>
            <Table
              columns={[
                {
                  key: "fecha",
                  header: "Fecha",
                  render: (item: DonacionData) => (
                    <span className="text-[#203b46] font-medium">
                      {formatearFecha(item.fecha)}
                    </span>
                  ),
                },
                {
                  key: "nombre",
                  header: "Donante",
                  render: (item: DonacionData) => (
                    <div>
                      <span className="font-medium">{item.nombre}</span>
                      {item.telefono && (
                        <span className="text-xs text-gray-500 block md:hidden">
                          {item.telefono}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: "telefono",
                  header: "Teléfono",
                  hideOnMobile: true,
                  render: (item: DonacionData) => (
                    <span className="text-gray-600">
                      {item.telefono || "-"}
                    </span>
                  ),
                },
                {
                  key: "tipoOfrenda",
                  header: "Tipo",
                  render: (item: DonacionData) => (
                    <Badge variant="info">{item.tipoOfrenda.nombre}</Badge>
                  ),
                },
                {
                  key: "monto",
                  header: "Monto",
                  className: "text-right",
                  render: (item: DonacionData) => (
                    <span className="font-semibold text-[#2ba193]">
                      {formatearMonto(item.monto, item.moneda.simbolo)}
                    </span>
                  ),
                },
                {
                  key: "acciones",
                  header: "Acciones",
                  render: (item: DonacionData) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetalleSeleccionado(item)}
                        className="p-1.5 text-[#40768c] hover:bg-[#eef4f7] rounded-lg"
                        title="Ver detalle"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      {deleteConfirm === item.id ? (
                        <>
                          <button
                            onClick={() => handleEliminar(item.id)}
                            disabled={isPending}
                            className="p-1.5 text-white bg-[#e0451f] rounded-lg hover:bg-[#b43718] disabled:opacity-50"
                            title="Confirmar"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-[#73a9bf] hover:bg-[#eef4f7] rounded-lg"
                            title="Cancelar"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 text-[#e0451f] hover:bg-[#fcece9] rounded-lg"
                          title="Eliminar"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={donacionesPaginadas}
            />

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => p - 1)}
                >
                  ← Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((p) => p + 1)}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de detalle */}
      {detalleSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Detalle de Donación</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetalleSeleccionado(null)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">Donante:</span>
                <p className="font-medium">{detalleSeleccionado.nombre}</p>
              </div>
              {detalleSeleccionado.telefono && (
                <div>
                  <span className="text-gray-500 text-sm">Teléfono:</span>
                  <p>{detalleSeleccionado.telefono}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500 text-sm">Fecha:</span>
                <p>{formatearFecha(detalleSeleccionado.fecha)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Tipo de Ofrenda:</span>
                <p>
                  <Badge variant="info">
                    {detalleSeleccionado.tipoOfrenda.nombre}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Monto:</span>
                <p className="text-xl font-bold text-[#2ba193]">
                  {formatearMonto(
                    detalleSeleccionado.monto,
                    detalleSeleccionado.moneda.simbolo
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Caja destino:</span>
                <p>{detalleSeleccionado.caja.nombre}</p>
              </div>
              {detalleSeleccionado.comentario && (
                <div>
                  <span className="text-gray-500 text-sm">Comentario:</span>
                  <p className="text-gray-700">
                    {detalleSeleccionado.comentario}
                  </p>
                </div>
              )}
              {detalleSeleccionado.usuario && (
                <div>
                  <span className="text-gray-500 text-sm">Registrado por:</span>
                  <p>
                    {detalleSeleccionado.usuario.nombre}{" "}
                    {detalleSeleccionado.usuario.apellido}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setDetalleSeleccionado(null)}
              >
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
