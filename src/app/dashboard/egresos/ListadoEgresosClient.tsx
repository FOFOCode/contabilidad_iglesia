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
import { eliminarEgreso, actualizarEgreso } from "@/app/actions/operaciones";

interface Moneda {
  id: string;
  codigo: string;
  simbolo: string;
}

interface TipoGasto {
  id: string;
  nombre: string;
}

interface EgresoData {
  id: string;
  fechaSalida: Date;
  solicitante: string;
  monto: number;
  descripcionGasto: string | null;
  comentario: string | null;
  numeroFactura: string | null;
  tipoGasto: { nombre: string };
  caja: { nombre: string };
  moneda: Moneda;
  usuario: { nombre: string; apellido: string } | null;
}

interface ListadoEgresosClientProps {
  egresos: EgresoData[];
  tiposGasto: TipoGasto[];
  monedas: Moneda[];
  permisos: {
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
  };
}

export function ListadoEgresosClient({
  egresos: egresosIniciales,
  tiposGasto,
  monedas,
  permisos,
}: ListadoEgresosClientProps) {
  const [isPending, startTransition] = useTransition();
  const [egresos, setEgresos] = useState(egresosIniciales);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<EgresoData | null>(null);
  const [editando, setEditando] = useState<EgresoData | null>(null);
  const [formEdit, setFormEdit] = useState({
    fechaSalida: "",
    solicitante: "",
    monto: "",
    descripcionGasto: "",
    comentario: "",
    tipoGastoId: "",
    monedaId: "",
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  // Filtros
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    tipoGastoId: "",
    monedaId: "",
  });

  // Memoizar opciones de select
  const tipoGastoOptions = useMemo(
    () => tiposGasto.map((t) => ({ value: t.id, label: t.nombre })),
    [tiposGasto],
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo}`,
      })),
    [monedas],
  );

  // Filtrar egresos localmente - memoizado
  const egresosFiltrados = useMemo(
    () =>
      egresos.filter((egreso) => {
        if (filtros.desde) {
          const desde = new Date(filtros.desde);
          if (new Date(egreso.fechaSalida) < desde) return false;
        }
        if (filtros.hasta) {
          const hasta = new Date(filtros.hasta);
          hasta.setHours(23, 59, 59);
          if (new Date(egreso.fechaSalida) > hasta) return false;
        }
        if (
          filtros.tipoGastoId &&
          egreso.tipoGasto.nombre !==
            tiposGasto.find((t) => t.id === filtros.tipoGastoId)?.nombre
        ) {
          return false;
        }
        if (filtros.monedaId && egreso.moneda.id !== filtros.monedaId) {
          return false;
        }
        return true;
      }),
    [egresos, filtros, tiposGasto],
  );

  // Cálculos de paginación
  const totalPaginas = Math.ceil(egresosFiltrados.length / filasPorPagina);
  const egresosPaginados = useMemo(
    () =>
      egresosFiltrados.slice(
        (paginaActual - 1) * filasPorPagina,
        paginaActual * filasPorPagina,
      ),
    [egresosFiltrados, paginaActual, filasPorPagina],
  );

  // Resetear página cuando cambian los filtros
  const handleFiltroChange = (nuevosFiltros: typeof filtros) => {
    setFiltros(nuevosFiltros);
    setPaginaActual(1);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await eliminarEgreso(id);
        setEgresos(egresos.filter((e) => e.id !== id));
        setDeleteConfirm(null);
      } catch (e) {
        setError("Error al eliminar el egreso");
        console.error(e);
      }
    });
  };

  const handleEditar = useCallback(
    (egreso: EgresoData) => {
      setEditando(egreso);
      setFormEdit({
        fechaSalida: new Date(egreso.fechaSalida).toISOString().split("T")[0],
        solicitante: egreso.solicitante,
        monto: egreso.monto.toString(),
        descripcionGasto: egreso.descripcionGasto || "",
        comentario: egreso.comentario || "",
        tipoGastoId:
          tiposGasto.find((t) => t.nombre === egreso.tipoGasto.nombre)?.id ||
          "",
        monedaId: egreso.moneda.id,
      });
      setError(null);
    },
    [tiposGasto],
  );

  const handleActualizar = useCallback(() => {
    if (!editando) return;

    if (
      !formEdit.fechaSalida ||
      !formEdit.solicitante ||
      !formEdit.monto ||
      !formEdit.tipoGastoId ||
      !formEdit.monedaId
    ) {
      setError("Todos los campos marcados con * son obligatorios");
      return;
    }

    const monto = Math.round(parseFloat(formEdit.monto) * 100) / 100;
    if (isNaN(monto) || monto <= 0) {
      setError("El monto debe ser un número mayor a 0");
      return;
    }

    startTransition(async () => {
      try {
        await actualizarEgreso(editando.id, {
          fechaSalida: new Date(formEdit.fechaSalida),
          solicitante: formEdit.solicitante,
          monto,
          descripcionGasto: formEdit.descripcionGasto || undefined,
          comentario: formEdit.comentario || undefined,
          tipoGastoId: formEdit.tipoGastoId,
          monedaId: formEdit.monedaId,
        });

        // Actualizar la lista localmente
        setEgresos((prev) =>
          prev.map((e) =>
            e.id === editando.id
              ? {
                  ...e,
                  fechaSalida: new Date(formEdit.fechaSalida),
                  solicitante: formEdit.solicitante,
                  monto,
                  descripcionGasto: formEdit.descripcionGasto || null,
                  comentario: formEdit.comentario || null,
                  tipoGasto:
                    tiposGasto.find((t) => t.id === formEdit.tipoGastoId) ||
                    e.tipoGasto,
                  moneda:
                    monedas.find((m) => m.id === formEdit.monedaId) || e.moneda,
                }
              : e,
          ),
        );

        setEditando(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al actualizar egreso",
        );
      }
    });
  }, [editando, formEdit, tiposGasto, monedas]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMonto = (monto: number, simbolo: string) => {
    return `${simbolo} ${monto.toFixed(2)}`;
  };

  // Calcular totales por moneda - memoizado
  const totalesPorMoneda = useMemo(
    () =>
      monedas
        .map((moneda) => {
          const total = egresosFiltrados
            .filter((e) => e.moneda.id === moneda.id)
            .reduce(
              (acc, e) => Math.round((acc + Number(e.monto)) * 100) / 100,
              0,
            );
          return { moneda, total };
        })
        .filter((t) => t.total > 0),
    [monedas, egresosFiltrados],
  );

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: EgresoData) => (
        <div>
          <span className="text-[#203b46] font-medium block">
            {formatDate(item.fechaSalida)}
          </span>
          {/* Mostrar tipo de gasto debajo de la fecha en móvil/tablet */}
          <span className="text-xs text-[#73a9bf] md:hidden block">
            {item.tipoGasto.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "detalle",
      header: "Detalle",
      render: (item: EgresoData) => (
        <div className="min-w-0">
          <span className="text-[#305969] font-medium block truncate">
            {item.solicitante}
          </span>
          <span className="text-xs text-[#73a9bf] block truncate">
            {item.descripcionGasto || item.tipoGasto.nombre}
          </span>
          {/* Mostrar caja en móvil */}
          <span className="text-xs text-[#40768c] md:hidden block">
            {item.caja.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      hideOnMobile: true,
      render: (item: EgresoData) => (
        <Badge variant="warning">{item.tipoGasto.nombre}</Badge>
      ),
    },
    {
      key: "caja",
      header: "Caja",
      hideOnMobile: true,
      hideOnTablet: true,
      render: (item: EgresoData) => (
        <span className="text-[#73a9bf] text-sm">{item.caja.nombre}</span>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (item: EgresoData) => (
        <span className="font-semibold text-[#e0451f] whitespace-nowrap">
          {formatMonto(Number(item.monto), item.moneda.simbolo)}
        </span>
      ),
    },
    {
      key: "factura",
      header: "Factura",
      hideOnMobile: true,
      render: (item: EgresoData) => (
        <span className="text-[#73a9bf] text-sm">
          {item.numeroFactura || "-"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      className: "text-right",
      render: (item: EgresoData) => (
        <div className="flex items-center justify-end gap-1">
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
                  onClick={() => handleDelete(item.id)}
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
  ];

  return (
    <div className="p-4 md:p-5 lg:p-6">
      {error && (
        <div className="mb-3 md:mb-4 p-3 md:p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg text-[#b43718]">
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 md:gap-4 mb-4 md:mb-5">
        {permisos.puedeCrear && (
          <div className="flex gap-2">
            <Link href="/dashboard/egresos/nuevo">
              <Button>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nuevo Egreso
              </Button>
            </Link>
            <Link href="/dashboard/egresos/multiple">
              <Button variant="secondary">Egreso Múltiple</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-4 md:mb-5">
        <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
          Filtros
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Input
            label="Desde"
            type="date"
            value={filtros.desde}
            onChange={(e) =>
              handleFiltroChange({ ...filtros, desde: e.target.value })
            }
          />
          <Input
            label="Hasta"
            type="date"
            value={filtros.hasta}
            onChange={(e) =>
              handleFiltroChange({ ...filtros, hasta: e.target.value })
            }
          />
          <Combobox
            label="Tipo de Gasto"
            value={filtros.tipoGastoId}
            onChange={(value) =>
              handleFiltroChange({ ...filtros, tipoGastoId: value })
            }
            options={tipoGastoOptions}
            placeholder="Todos los tipos"
            clearable
            searchable={false}
          />
          <Combobox
            label="Moneda"
            value={filtros.monedaId}
            onChange={(value) =>
              handleFiltroChange({ ...filtros, monedaId: value })
            }
            options={monedaOptions}
            placeholder="Todas las monedas"
            clearable
            searchable={false}
          />
        </div>
        {(filtros.desde ||
          filtros.hasta ||
          filtros.tipoGastoId ||
          filtros.monedaId) && (
          <button
            onClick={() => {
              handleFiltroChange({
                desde: "",
                hasta: "",
                tipoGastoId: "",
                monedaId: "",
              });
            }}
            className="mt-3 text-sm text-[#40768c] underline"
          >
            Limpiar filtros
          </button>
        )}
      </Card>

      {/* Resumen de Egresos Filtrados */}
      {totalesPorMoneda.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-[#40768c] uppercase tracking-wide">
              📊 Resumen de egresos
            </span>
            {(filtros.desde || filtros.hasta) && (
              <span className="text-xs text-[#73a9bf] bg-[#eef4f7] px-2 py-0.5 rounded-full">
                {filtros.desde && filtros.hasta
                  ? `${filtros.desde} al ${filtros.hasta}`
                  : filtros.desde
                    ? `Desde ${filtros.desde}`
                    : `Hasta ${filtros.hasta}`}
              </span>
            )}
            {!filtros.desde && !filtros.hasta && (
              <span className="text-xs text-[#73a9bf] bg-[#eef4f7] px-2 py-0.5 rounded-full">
                Todos los registros
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {totalesPorMoneda.map(({ moneda, total }) => (
              <Card key={moneda.id} className="bg-[#fcece9] border-[#f3b5a5]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#b43718] uppercase font-medium">
                      Total Egresos ({moneda.codigo})
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-[#e0451f]">
                      {moneda.simbolo}{" "}
                      {total.toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <span className="text-2xl opacity-50">💸</span>
                </div>
              </Card>
            ))}
            <Card className="bg-[#eef4f7] border-[#b9d4df]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#40768c] uppercase font-medium">
                    Total Registros
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-[#305969]">
                    {egresosFiltrados.length}
                  </div>
                </div>
                <span className="text-2xl opacity-50">📋</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={egresosPaginados}
          emptyMessage="No hay egresos registrados."
        />

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-[#dceaef]">
            <div className="text-sm text-[#73a9bf]">
              Mostrando{" "}
              <span className="font-semibold text-[#305969]">
                {(paginaActual - 1) * filasPorPagina + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-[#305969]">
                {Math.min(
                  paginaActual * filasPorPagina,
                  egresosFiltrados.length,
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-[#305969]">
                {egresosFiltrados.length}
              </span>{" "}
              registros
            </div>
            <div className="flex items-center gap-1 bg-[#f5f9fb] rounded-xl p-1">
              <button
                onClick={() => setPaginaActual(1)}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg text-[#40768c] hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
                title="Primera página"
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
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg text-[#40768c] hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
                title="Página anterior"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="px-4 py-1.5 text-sm font-semibold text-white bg-[#2ba193] rounded-lg mx-1">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg text-[#40768c] hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
                title="Página siguiente"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg text-[#40768c] hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
                title="Última página"
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
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Detalle */}
      {detalleSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#dceaef] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="danger">Egreso</Badge>
                <h3 className="text-lg font-semibold text-[#203b46]">
                  Detalle del Egreso
                </h3>
              </div>
              <button
                onClick={() => setDetalleSeleccionado(null)}
                className="text-[#73a9bf] hover:text-[#305969] p-1"
              >
                <svg
                  className="w-6 h-6"
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
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">Fecha</p>
                  <p className="font-medium text-[#203b46]">
                    {new Date(
                      detalleSeleccionado.fechaSalida,
                    ).toLocaleDateString("es-GT", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">Caja</p>
                  <p className="font-medium text-[#203b46]">
                    {detalleSeleccionado.caja.nombre}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">
                    Tipo de Gasto
                  </p>
                  <Badge variant="warning">
                    {detalleSeleccionado.tipoGasto.nombre}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">
                    Solicitante
                  </p>
                  <p className="font-medium text-[#203b46]">
                    {detalleSeleccionado.solicitante}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#73a9bf] uppercase">Monto</p>
                <p className="text-lg font-bold text-[#e0451f]">
                  -{detalleSeleccionado.moneda.simbolo}
                  {Number(detalleSeleccionado.monto).toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal text-[#73a9bf] ml-2">
                    ({detalleSeleccionado.moneda.codigo})
                  </span>
                </p>
              </div>

              {detalleSeleccionado.descripcionGasto && (
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">
                    Descripción del Gasto
                  </p>
                  <p className="text-[#305969] bg-[#eef4f7] p-3 rounded-lg">
                    {detalleSeleccionado.descripcionGasto}
                  </p>
                </div>
              )}

              {detalleSeleccionado.comentario && (
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">Comentario</p>
                  <p className="text-[#305969] bg-[#eef4f7] p-3 rounded-lg">
                    {detalleSeleccionado.comentario}
                  </p>
                </div>
              )}

              {detalleSeleccionado.usuario && (
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">
                    Registrado por
                  </p>
                  <p className="font-medium text-[#203b46]">
                    {detalleSeleccionado.usuario.nombre}{" "}
                    {detalleSeleccionado.usuario.apellido}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#dceaef]">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setDetalleSeleccionado(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <Modal
        isOpen={!!editando}
        onClose={() => {
          setEditando(null);
          setError(null);
        }}
        title="Editar Egreso"
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
              label="Fecha de Salida *"
              type="date"
              value={formEdit.fechaSalida}
              onChange={(e) =>
                setFormEdit({ ...formEdit, fechaSalida: e.target.value })
              }
              required
            />

            <Input
              label="Solicitante *"
              value={formEdit.solicitante}
              onChange={(e) =>
                setFormEdit({ ...formEdit, solicitante: e.target.value })
              }
              placeholder="Nombre del solicitante"
              required
            />

            <Combobox
              label="Tipo de Gasto *"
              options={tipoGastoOptions}
              value={formEdit.tipoGastoId}
              onChange={(value) =>
                setFormEdit({ ...formEdit, tipoGastoId: value })
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

          <Input
            label="Descripción del Gasto"
            value={formEdit.descripcionGasto}
            onChange={(e) =>
              setFormEdit({ ...formEdit, descripcionGasto: e.target.value })
            }
            placeholder="Describe brevemente el gasto..."
          />

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
