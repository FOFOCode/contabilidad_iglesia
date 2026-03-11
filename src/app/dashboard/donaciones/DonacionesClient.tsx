"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  Combobox,
  Input,
  Badge,
  Table,
  Modal,
  TextArea,
} from "@/components/ui";
import { eliminarDonacion, actualizarDonacion } from "@/app/actions/donaciones";
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
  numeroDocumento: string;
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
  permisos: {
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
  };
}

export function DonacionesClient({
  donaciones: donacionesIniciales,
  tiposOfrenda,
  monedas,
  permisos,
}: DonacionesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [donaciones, setDonaciones] = useState(donacionesIniciales);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<DonacionData | null>(null);
  const [editando, setEditando] = useState<DonacionData | null>(null);
  const [formEdit, setFormEdit] = useState({
    nombre: "",
    numeroDocumento: "",
    telefono: "",
    fecha: "",
    tipoOfrendaId: "",
    monto: "",
    monedaId: "",
    comentario: "",
  });

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
    [tiposOfrenda],
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({ value: m.id, label: `${m.simbolo} ${m.codigo}` })),
    [monedas],
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
    [donaciones, filtros],
  );

  // Cálculos de paginación
  const totalPaginas = Math.ceil(donacionesFiltradas.length / filasPorPagina);
  const donacionesPaginadas = useMemo(
    () =>
      donacionesFiltradas.slice(
        (paginaActual - 1) * filasPorPagina,
        paginaActual * filasPorPagina,
      ),
    [donacionesFiltradas, paginaActual],
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
            err instanceof Error ? err.message : "Error al eliminar donación",
          );
        }
      });
    },
    [router],
  );

  const handleEditar = useCallback((donacion: DonacionData) => {
    setEditando(donacion);
    setFormEdit({
      nombre: donacion.nombre,
      numeroDocumento: donacion.numeroDocumento,
      telefono: donacion.telefono || "",
      fecha: new Date(donacion.fecha).toISOString().split("T")[0],
      tipoOfrendaId: donacion.tipoOfrenda.id,
      monto: donacion.monto.toString(),
      monedaId: donacion.moneda.id,
      comentario: donacion.comentario || "",
    });
    setError(null);
  }, []);

  const handleActualizar = useCallback(() => {
    if (!editando) return;

    if (
      !formEdit.nombre ||
      !formEdit.fecha ||
      !formEdit.tipoOfrendaId ||
      !formEdit.monto ||
      !formEdit.monedaId
    ) {
      setError("Todos los campos marcados son obligatorios");
      return;
    }

    const monto = Math.round(parseFloat(formEdit.monto) * 100) / 100;
    if (isNaN(monto) || monto <= 0) {
      setError("El monto debe ser un número mayor a 0");
      return;
    }

    startTransition(async () => {
      try {
        await actualizarDonacion(editando.id, {
          nombre: formEdit.nombre,
          numeroDocumento: formEdit.numeroDocumento,
          telefono: formEdit.telefono || undefined,
          fecha: new Date(formEdit.fecha),
          tipoOfrendaId: formEdit.tipoOfrendaId,
          monto,
          monedaId: formEdit.monedaId,
          comentario: formEdit.comentario || undefined,
        });

        // Actualizar la lista localmente
        setDonaciones((prev) =>
          prev.map((d) =>
            d.id === editando.id
              ? {
                  ...d,
                  nombre: formEdit.nombre,
                  numeroDocumento: formEdit.numeroDocumento,
                  telefono: formEdit.telefono || null,
                  fecha: new Date(formEdit.fecha),
                  monto,
                  comentario: formEdit.comentario || null,
                  tipoOfrenda:
                    tiposOfrenda.find((t) => t.id === formEdit.tipoOfrendaId) ||
                    d.tipoOfrenda,
                  moneda:
                    monedas.find((m) => m.id === formEdit.monedaId) || d.moneda,
                }
              : d,
          ),
        );

        setEditando(null);
        setSuccessMessage("Donación actualizada correctamente");
        setTimeout(() => setSuccessMessage(null), 3000);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al actualizar donación",
        );
      }
    });
  }, [editando, formEdit, tiposOfrenda, monedas, router]);

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

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 text-[#b43718]">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[#b43718] hover:text-[#8a2c16] text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-[#ebfaf8] border border-[#aeeae3] rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#2ba193] shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[#15514a] font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[#2ba193] hover:text-[#208079] text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
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
        {permisos.puedeCrear && (
          <Link href="/dashboard/donaciones/nuevo">
            <Button>➞ Nueva Donación</Button>
          </Link>
        )}
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
                  key: "numeroDocumento",
                  header: "DUI",
                  render: (item: DonacionData) => (
                    <span className="font-mono text-sm text-[#40768c]">
                      {item.numeroDocumento}
                    </span>
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
                      {permisos.puedeEditar && (
                        <button
                          onClick={() => handleEditar(item)}
                          className="p-1.5 text-[#305969] hover:bg-[#eef4f7] rounded-lg"
                          title="Editar"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      {permisos.puedeEliminar &&
                        (deleteConfirm === item.id ? (
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
                        ))}
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
                    detalleSeleccionado.moneda.simbolo,
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

      {/* Modal de edición */}
      <Modal
        isOpen={!!editando}
        onClose={() => {
          setEditando(null);
          setError(null);
        }}
        title="Editar Donación"
        maxWidth="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleActualizar();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Donante *"
              value={formEdit.nombre}
              onChange={(e) =>
                setFormEdit({ ...formEdit, nombre: e.target.value })
              }
              placeholder="Ej: Juan Pérez"
              required
            />

            <Input
              label="Número de Documento (DUI) *"
              value={formEdit.numeroDocumento}
              onChange={(e) =>
                setFormEdit({ ...formEdit, numeroDocumento: e.target.value })
              }
              placeholder="Ej: 12345678-9"
              required
            />

            <Input
              label="Teléfono"
              type="tel"
              value={formEdit.telefono}
              onChange={(e) =>
                setFormEdit({ ...formEdit, telefono: e.target.value })
              }
              placeholder="Ej: 1234-5678"
            />

            <Input
              label="Fecha *"
              type="date"
              value={formEdit.fecha}
              onChange={(e) =>
                setFormEdit({ ...formEdit, fecha: e.target.value })
              }
              required
            />

            <Combobox
              label="Tipo de Ofrenda *"
              options={tipoOfrendaOptions}
              value={formEdit.tipoOfrendaId}
              onChange={(value) =>
                setFormEdit({ ...formEdit, tipoOfrendaId: value })
              }
              placeholder="Seleccionar tipo..."
              required
            />

            <Combobox
              label="Moneda *"
              options={monedaOptions}
              value={formEdit.monedaId}
              onChange={(value) =>
                setFormEdit({ ...formEdit, monedaId: value })
              }
              placeholder="Seleccionar moneda..."
              required
            />

            <Input
              label="Monto *"
              type="number"
              step="0.01"
              min="0.01"
              value={formEdit.monto}
              onChange={(e) =>
                setFormEdit({ ...formEdit, monto: e.target.value })
              }
              placeholder="0.00"
              required
            />
          </div>

          <TextArea
            label="Comentario"
            value={formEdit.comentario}
            onChange={(e) =>
              setFormEdit({ ...formEdit, comentario: e.target.value })
            }
            placeholder="Comentario adicional (opcional)"
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditando(null);
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
