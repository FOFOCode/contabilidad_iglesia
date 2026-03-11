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
import { eliminarIngreso, actualizarIngreso } from "@/app/actions/operaciones";
import { useRouter } from "next/navigation";
import { parsearFechaLocal } from "@/lib/fechas";

// Función robusta para manejar fechas consistentemente
function asegurarFecha(fecha: Date | string): Date {
  if (fecha instanceof Date) {
    return fecha;
  }
  // Si es string ISO, crear Date sin problemas de zona horaria
  const date = new Date(fecha);
  // Ajustar para asegurar que estamos en la fecha correcta local
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate;
}

// Función para convertir Date a string para input type="date" sin problemas
function fechaParaInput(date: Date | string): string {
  const fecha = asegurarFecha(date);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface Moneda {
  id: string;
  codigo: string;
  simbolo: string;
}

interface IngresoMonto {
  monto: number;
  moneda: Moneda;
}

interface IngresoData {
  id: string;
  fechaRecaudacion: Date | string; // Puede venir como Date o string ISO
  comentario: string | null;
  sociedad: { nombre: string };
  servicio: { nombre: string };
  tipoIngreso: { nombre: string };
  caja: { nombre: string };
  montos: IngresoMonto[];
  usuario?: { nombre: string; apellido: string };
}

interface Sociedad {
  id: string;
  nombre: string;
}

interface TipoIngreso {
  id: string;
  nombre: string;
}

interface TipoServicio {
  id: string;
  nombre: string;
}

interface ListadoIngresosClientProps {
  ingresos: IngresoData[];
  sociedades: Sociedad[];
  tiposIngreso: TipoIngreso[];
  tiposServicio: TipoServicio[];
  monedas: Moneda[];
  permisos: {
    puedeVer: boolean;
    puedeCrear: boolean;
    puedeEditar: boolean;
    puedeEliminar: boolean;
  };
}

export function ListadoIngresosClient({
  ingresos: ingresosIniciales,
  sociedades,
  tiposIngreso,
  tiposServicio,
  monedas,
  permisos,
}: ListadoIngresosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ingresos, setIngresos] = useState(ingresosIniciales);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<IngresoData | null>(null);
  const [editando, setEditando] = useState<IngresoData | null>(null);
  const [formEdit, setFormEdit] = useState({
    fechaRecaudacion: "",
    sociedadId: "",
    servicioId: "",
    tipoIngresoId: "",
    comentario: "",
    montos: [] as { monedaId: string; monto: string }[],
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  // Ordenamiento por fecha
  const [ordenFecha, setOrdenFecha] = useState<"desc" | "asc">("desc");

  // Filtros
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    sociedadId: "",
    tipoIngresoId: "",
    monedaId: "",
  });

  // Memoizar opciones de select
  const sociedadOptions = useMemo(
    () => sociedades.map((s) => ({ value: s.id, label: s.nombre })),
    [sociedades],
  );

  const tipoIngresoOptions = useMemo(
    () => tiposIngreso.map((t) => ({ value: t.id, label: t.nombre })),
    [tiposIngreso],
  );

  const tiposServicioOptions = useMemo(
    () => tiposServicio.map((s) => ({ value: s.nombre, label: s.nombre })),
    [tiposServicio],
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo}`,
      })),
    [monedas],
  );

  // Filtrar y ordenar ingresos localmente - memoizado
  const ingresosFiltrados = useMemo(
    () =>
      ingresos
        .filter((ingreso) => {
          if (filtros.desde) {
            const desde = new Date(filtros.desde);
            const fechaIngreso = asegurarFecha(ingreso.fechaRecaudacion);
            if (fechaIngreso < desde) return false;
          }
          if (filtros.hasta) {
            const hasta = new Date(filtros.hasta);
            hasta.setHours(23, 59, 59);
            const fechaIngreso = asegurarFecha(ingreso.fechaRecaudacion);
            if (fechaIngreso > hasta) return false;
          }
          if (
            filtros.sociedadId &&
            ingreso.sociedad.nombre !==
              sociedades.find((s) => s.id === filtros.sociedadId)?.nombre
          ) {
            return false;
          }
          if (
            filtros.tipoIngresoId &&
            ingreso.tipoIngreso.nombre !==
              tiposIngreso.find((t) => t.id === filtros.tipoIngresoId)?.nombre
          ) {
            return false;
          }
          if (
            filtros.monedaId &&
            !ingreso.montos.some((m) => m.moneda.id === filtros.monedaId)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          const da = asegurarFecha(a.fechaRecaudacion).getTime();
          const db = asegurarFecha(b.fechaRecaudacion).getTime();
          return ordenFecha === "desc" ? db - da : da - db;
        }),
    [ingresos, filtros, sociedades, tiposIngreso, ordenFecha],
  );

  // Cálculos de paginación
  const totalPaginas = Math.ceil(ingresosFiltrados.length / filasPorPagina);
  const ingresosPaginados = useMemo(
    () =>
      ingresosFiltrados.slice(
        (paginaActual - 1) * filasPorPagina,
        paginaActual * filasPorPagina,
      ),
    [ingresosFiltrados, paginaActual, filasPorPagina],
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
        await eliminarIngreso(id);
        setIngresos(ingresos.filter((i) => i.id !== id));
        setDeleteConfirm(null);
      } catch (e) {
        setError("Error al eliminar el ingreso");
        console.error(e);
      }
    });
  };

  const handleEditar = useCallback((ingreso: IngresoData) => {
    setEditando(ingreso);

    // Usar función robusta para convertir fecha
    const fechaStringInput = fechaParaInput(ingreso.fechaRecaudacion);

    setFormEdit({
      fechaRecaudacion: fechaStringInput,
      sociedadId: ingreso.sociedad.nombre,
      servicioId: ingreso.servicio.nombre,
      tipoIngresoId: ingreso.tipoIngreso.nombre,
      comentario: ingreso.comentario || "",
      montos: ingreso.montos.map((m) => ({
        monedaId: m.moneda.id,
        monto: m.monto.toString(),
      })),
    });
  }, []);

  const handleActualizar = async () => {
    if (!editando) return;

    // Validaciones
    if (
      !formEdit.fechaRecaudacion ||
      !formEdit.sociedadId ||
      !formEdit.servicioId ||
      !formEdit.tipoIngresoId
    ) {
      setError("Todos los campos obligatorios deben estar completos");
      return;
    }

    if (formEdit.montos.length === 0) {
      setError("Debe agregar al menos un monto");
      return;
    }

    // Validar que todos los montos sean válidos
    for (const monto of formEdit.montos) {
      if (!monto.monedaId || !monto.monto || parseFloat(monto.monto) <= 0) {
        setError("Todos los montos deben ser válidos y mayores a 0");
        return;
      }
    }

    setError(null);
    startTransition(async () => {
      try {
        // Encontrar IDs originales
        const sociedad = sociedades.find(
          (s) => s.nombre === formEdit.sociedadId,
        );
        const tipoIngreso = tiposIngreso.find(
          (t) => t.nombre === formEdit.tipoIngresoId,
        );

        if (!sociedad || !tipoIngreso) {
          setError("Error: datos no encontrados");
          return;
        }

        console.log("=== DEBUG handleActualizar ===");
        console.log("formEdit.fechaRecaudacion:", formEdit.fechaRecaudacion);

        // Crear fecha robusta para servidor
        const fechaLocal = parsearFechaLocal(formEdit.fechaRecaudacion);

        await actualizarIngreso(editando.id, {
          fechaRecaudacion: fechaLocal,
          sociedadId: sociedad.id,
          tipoIngresoId: tipoIngreso.id,
          comentario: formEdit.comentario || undefined,
          montos: formEdit.montos.map((m) => ({
            monedaId: m.monedaId,
            monto: Math.round(parseFloat(m.monto) * 100) / 100,
          })),
        });

        // Actualizar localmente usando la misma fecha
        const servicioObj = { nombre: formEdit.servicioId };
        console.log("Actualizando localmente con fechaLocal:", fechaLocal);
        setIngresos(
          ingresos.map((ing) =>
            ing.id === editando.id
              ? {
                  ...ing,
                  fechaRecaudacion: fechaLocal,
                  sociedadId: sociedad.id,
                  sociedad: { nombre: sociedad.nombre },
                  servicio: servicioObj,
                  tipoIngresoId: tipoIngreso.id,
                  tipoIngreso: { nombre: tipoIngreso.nombre },
                  comentario: formEdit.comentario || null,
                  montos: formEdit.montos.map(
                    (m: { monedaId: string; monto: string }) => {
                      const moneda = monedas.find(
                        (mon) => mon.id === m.monedaId,
                      );
                      return {
                        monto: Math.round(parseFloat(m.monto) * 100) / 100,
                        moneda: moneda!,
                      };
                    },
                  ),
                }
              : ing,
          ),
        );
        console.log("=== FIN DEBUG handleActualizar ===\n");

        setEditando(null);
        setFormEdit({
          fechaRecaudacion: "",
          sociedadId: "",
          servicioId: "",
          tipoIngresoId: "",
          comentario: "",
          montos: [],
        });
      } catch (e) {
        setError("Error al actualizar el ingreso");
        console.error(e);
      }
    });
  };

  const formatDate = (date: Date | string) => {
    // Usar función robusta para manejar fechas
    const fecha = asegurarFecha(date);
    return fecha.toLocaleDateString("es-GT", {
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
          const total = ingresosFiltrados.reduce((acc, ingreso) => {
            const montoEnMoneda = ingreso.montos.find(
              (m) => m.moneda.id === moneda.id,
            );
            return acc + (montoEnMoneda ? Number(montoEnMoneda.monto) : 0);
          }, 0);
          return { moneda, total };
        })
        .filter((t) => t.total > 0),
    [monedas, ingresosFiltrados],
  );

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: IngresoData) => (
        <div>
          <span className="text-[#203b46] font-medium block">
            {formatDate(item.fechaRecaudacion)}
          </span>
          {/* Mostrar sociedad debajo de la fecha en móvil */}
          <span className="text-xs text-[#40768c] md:hidden block">
            {item.sociedad.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "detalle",
      header: "Detalle",
      render: (item: IngresoData) => (
        <div className="min-w-0">
          <Badge variant="info" className="mb-1 hidden md:inline-flex">
            {item.sociedad.nombre}
          </Badge>
          <span className="text-[#40768c] text-sm block truncate">
            {item.tipoIngreso.nombre}
          </span>
          {/* Mostrar caja en móvil */}
          <span className="text-xs text-[#73a9bf] lg:hidden block">
            {item.caja.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "caja",
      header: "Caja",
      hideOnMobile: true,
      hideOnTablet: true,
      render: (item: IngresoData) => (
        <span className="text-[#73a9bf] text-sm">{item.caja.nombre}</span>
      ),
    },
    {
      key: "montos",
      header: "Monto",
      className: "text-right",
      render: (item: IngresoData) => (
        <div>
          {item.montos.map((m, idx) => (
            <div
              key={idx}
              className="font-semibold text-[#2ba193] whitespace-nowrap"
            >
              {formatMonto(Number(m.monto), m.moneda.simbolo)}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "acciones",
      header: "",
      className: "text-right",
      render: (item: IngresoData) => (
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
              className="p-1.5 text-[#40768c] hover:bg-[#eef4f7] rounded-lg"
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
            <Link href="/dashboard/ingresos/nuevo">
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
                Nuevo Ingreso
              </Button>
            </Link>
            <Link href="/dashboard/ingresos/multiple">
              <Button variant="secondary">Ingreso Múltiple</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-4 md:mb-5">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide">
            Filtros
          </h3>
          <button
            type="button"
            onClick={() => {
              setOrdenFecha((o) => (o === "desc" ? "asc" : "desc"));
              setPaginaActual(1);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#40768c] hover:text-[#2ba193] bg-[#eef4f7] hover:bg-[#ebfaf8] border border-[#b9d4df] hover:border-[#aeeae3] px-2.5 py-1.5 rounded-lg transition-colors"
            title={`Ordenar por fecha ${
              ordenFecha === "desc" ? "ascendente" : "descendente"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {ordenFecha === "desc" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              )}
            </svg>
            Fecha {ordenFecha === "desc" ? "↓ Reciente" : "↑ Antigua"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
            label="Sociedad"
            value={filtros.sociedadId}
            onChange={(value) =>
              handleFiltroChange({ ...filtros, sociedadId: value })
            }
            options={sociedadOptions}
            placeholder="Todas las sociedades"
            clearable
            searchable={false}
          />
          <Combobox
            label="Tipo de Ingreso"
            value={filtros.tipoIngresoId}
            onChange={(value) =>
              handleFiltroChange({ ...filtros, tipoIngresoId: value })
            }
            options={tipoIngresoOptions}
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
          filtros.sociedadId ||
          filtros.tipoIngresoId ||
          filtros.monedaId) && (
          <button
            onClick={() => {
              handleFiltroChange({
                desde: "",
                hasta: "",
                sociedadId: "",
                tipoIngresoId: "",
                monedaId: "",
              });
            }}
            className="mt-3 text-sm text-[#40768c] underline"
          >
            Limpiar filtros
          </button>
        )}
      </Card>

      {/* Resumen de Ingresos Filtrados */}
      {totalesPorMoneda.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-[#20796f] uppercase tracking-wide">
              📊 Resumen de ingresos
            </span>
            {(filtros.desde || filtros.hasta) && (
              <span className="text-xs text-[#20796f] bg-[#ebfaf8] px-2 py-0.5 rounded-full">
                {filtros.desde && filtros.hasta
                  ? `${filtros.desde} al ${filtros.hasta}`
                  : filtros.desde
                    ? `Desde ${filtros.desde}`
                    : `Hasta ${filtros.hasta}`}
              </span>
            )}
            {!filtros.desde && !filtros.hasta && (
              <span className="text-xs text-[#20796f] bg-[#ebfaf8] px-2 py-0.5 rounded-full">
                Todos los registros
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {totalesPorMoneda.map(({ moneda, total }) => (
              <Card key={moneda.id} className="bg-[#ebfaf8] border-[#aeeae3]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#20796f] uppercase font-medium">
                      Total Ingresos ({moneda.codigo})
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-[#15514a]">
                      {moneda.simbolo}{" "}
                      {total.toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <span className="text-2xl opacity-50">💰</span>
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
                    {ingresosFiltrados.length}
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
          data={ingresosPaginados}
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 bg-[#ebfaf8] rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#2ba193]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-[#305969] font-semibold text-base">
                  Sin ingresos registrados
                </p>
                <p className="text-[#73a9bf] text-sm mt-1">
                  {filtros.desde ||
                  filtros.hasta ||
                  filtros.sociedadId ||
                  filtros.tipoIngresoId ||
                  filtros.monedaId
                    ? "No hay ingresos que coincidan con los filtros aplicados"
                    : 'Registra tu primer ingreso usando el botón "Nuevo Ingreso"'}
                </p>
              </div>
            </div>
          }
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
                  ingresosFiltrados.length,
                )}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-[#305969]">
                {ingresosFiltrados.length}
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
                <Badge variant="success">Ingreso</Badge>
                <h3 className="text-lg font-semibold text-[#203b46]">
                  Detalle del Ingreso
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
                    {(() => {
                      const fecha = asegurarFecha(
                        detalleSeleccionado.fechaRecaudacion,
                      );
                      return fecha.toLocaleDateString("es-GT", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    })()}
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
                  <p className="text-xs text-[#73a9bf] uppercase">Sociedad</p>
                  <Badge variant="info">
                    {detalleSeleccionado.sociedad.nombre}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">
                    Tipo de Ingreso
                  </p>
                  <p className="font-medium text-[#203b46]">
                    {detalleSeleccionado.tipoIngreso.nombre}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#73a9bf] uppercase">Servicio</p>
                <p className="font-medium text-[#203b46]">
                  {detalleSeleccionado.servicio.nombre}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#73a9bf] uppercase">Monto(s)</p>
                <div className="space-y-1">
                  {detalleSeleccionado.montos.map((m, idx) => (
                    <p key={idx} className="text-lg font-bold text-[#2ba193]">
                      +{m.moneda.simbolo}
                      {Number(m.monto).toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                      })}
                      <span className="text-sm font-normal text-[#73a9bf] ml-2">
                        ({m.moneda.codigo})
                      </span>
                    </p>
                  ))}
                </div>
              </div>

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
      {editando && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditando(null);
            setFormEdit({
              fechaRecaudacion: "",
              sociedadId: "",
              servicioId: "",
              tipoIngresoId: "",
              comentario: "",
              montos: [],
            });
            setError(null);
          }}
          title="Editar Ingreso"
          maxWidth="2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleActualizar();
            }}
            className="space-y-4"
          >
            {error && (
              <div className="bg-[#fcece9] text-[#e0451f] p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Recaudación"
                type="date"
                value={formEdit.fechaRecaudacion}
                onChange={(e) =>
                  setFormEdit({ ...formEdit, fechaRecaudacion: e.target.value })
                }
                required
              />

              <Combobox
                label="Sociedad"
                placeholder="Seleccionar sociedad"
                options={sociedadOptions}
                value={formEdit.sociedadId}
                onChange={(value) =>
                  setFormEdit({ ...formEdit, sociedadId: value })
                }
                required
              />

              <Combobox
                label="Servicio"
                placeholder="Seleccionar servicio"
                options={tiposServicioOptions}
                value={formEdit.servicioId}
                onChange={(value) =>
                  setFormEdit({ ...formEdit, servicioId: value })
                }
                required
              />

              <Combobox
                label="Tipo de Ingreso"
                placeholder="Seleccionar tipo"
                options={tipoIngresoOptions}
                value={formEdit.tipoIngresoId}
                onChange={(value) =>
                  setFormEdit({ ...formEdit, tipoIngresoId: value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#203b46]">
                Montos
              </label>
              {formEdit.montos.map((monto, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Combobox
                      label="Moneda"
                      placeholder="Seleccionar"
                      options={monedaOptions}
                      value={monto.monedaId}
                      onChange={(value) => {
                        const nuevosMontos = [...formEdit.montos];
                        nuevosMontos[index].monedaId = value;
                        setFormEdit({ ...formEdit, montos: nuevosMontos });
                      }}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Monto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monto.monto}
                      onChange={(e) => {
                        const nuevosMontos = [...formEdit.montos];
                        nuevosMontos[index].monto = e.target.value;
                        setFormEdit({ ...formEdit, montos: nuevosMontos });
                      }}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nuevosMontos = formEdit.montos.filter(
                        (_, i) => i !== index,
                      );
                      setFormEdit({ ...formEdit, montos: nuevosMontos });
                    }}
                    className="p-2 text-[#e0451f] hover:bg-[#fcece9] rounded-lg mb-1"
                    title="Eliminar monto"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormEdit({
                    ...formEdit,
                    montos: [...formEdit.montos, { monedaId: "", monto: "" }],
                  });
                }}
                className="w-full p-2 border-2 border-dashed border-[#73a9bf] text-[#40768c] rounded-lg hover:bg-[#eef4f7] flex items-center justify-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agregar monto
              </button>
            </div>

            <TextArea
              label="Comentario (opcional)"
              value={formEdit.comentario}
              onChange={(e) =>
                setFormEdit({ ...formEdit, comentario: e.target.value })
              }
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditando(null);
                  setFormEdit({
                    fechaRecaudacion: "",
                    sociedadId: "",
                    servicioId: "",
                    tipoIngresoId: "",
                    comentario: "",
                    montos: [],
                  });
                  setError(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
