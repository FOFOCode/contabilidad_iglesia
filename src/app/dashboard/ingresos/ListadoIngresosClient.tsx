"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Button, Select, Input, Badge, Table } from "@/components/ui";
import { eliminarIngreso } from "@/app/actions/operaciones";
import { useRouter } from "next/navigation";

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
  fechaRecaudacion: Date;
  comentario: string | null;
  sociedad: { nombre: string };
  servicio: { nombre: string };
  tipoIngreso: { nombre: string };
  caja: { nombre: string };
  montos: IngresoMonto[];
  usuario: { nombre: string; apellido: string } | null;
}

interface Sociedad {
  id: string;
  nombre: string;
}

interface TipoIngreso {
  id: string;
  nombre: string;
}

interface ListadoIngresosClientProps {
  ingresos: IngresoData[];
  sociedades: Sociedad[];
  tiposIngreso: TipoIngreso[];
  monedas: Moneda[];
}

export function ListadoIngresosClient({
  ingresos: ingresosIniciales,
  sociedades,
  tiposIngreso,
  monedas,
}: ListadoIngresosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ingresos, setIngresos] = useState(ingresosIniciales);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<IngresoData | null>(null);

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
    () => [
      { value: "", label: "Todas las sociedades" },
      ...sociedades.map((s) => ({ value: s.id, label: s.nombre })),
    ],
    [sociedades]
  );

  const tipoIngresoOptions = useMemo(
    () => [
      { value: "", label: "Todos los tipos" },
      ...tiposIngreso.map((t) => ({ value: t.id, label: t.nombre })),
    ],
    [tiposIngreso]
  );

  const monedaOptions = useMemo(
    () => [
      { value: "", label: "Todas las monedas" },
      ...monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo}`,
      })),
    ],
    [monedas]
  );

  // Filtrar ingresos localmente - memoizado
  const ingresosFiltrados = useMemo(
    () =>
      ingresos.filter((ingreso) => {
        if (filtros.desde) {
          const desde = new Date(filtros.desde);
          if (new Date(ingreso.fechaRecaudacion) < desde) return false;
        }
        if (filtros.hasta) {
          const hasta = new Date(filtros.hasta);
          hasta.setHours(23, 59, 59);
          if (new Date(ingreso.fechaRecaudacion) > hasta) return false;
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
      }),
    [ingresos, filtros, sociedades, tiposIngreso]
  );

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
          const total = ingresosFiltrados.reduce((acc, ingreso) => {
            const montoEnMoneda = ingreso.montos.find(
              (m) => m.moneda.id === moneda.id
            );
            return acc + (montoEnMoneda ? Number(montoEnMoneda.monto) : 0);
          }, 0);
          return { moneda, total };
        })
        .filter((t) => t.total > 0),
    [monedas, ingresosFiltrados]
  );

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: IngresoData) => (
        <span className="text-[#203b46] font-medium">
          {formatDate(item.fechaRecaudacion)}
        </span>
      ),
    },
    {
      key: "sociedad",
      header: "Sociedad",
      render: (item: IngresoData) => (
        <Badge variant="info">{item.sociedad.nombre}</Badge>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (item: IngresoData) => (
        <span className="text-[#40768c]">{item.tipoIngreso.nombre}</span>
      ),
    },
    {
      key: "caja",
      header: "Caja",
      render: (item: IngresoData) => (
        <span className="text-[#73a9bf] text-sm">{item.caja.nombre}</span>
      ),
    },
    {
      key: "montos",
      header: "Montos",
      render: (item: IngresoData) => (
        <div className="space-y-1">
          {item.montos.map((m, idx) => (
            <div key={idx} className="font-semibold text-[#2ba193]">
              {formatMonto(Number(m.monto), m.moneda.simbolo)}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "ver",
      header: "",
      render: (item: IngresoData) => (
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
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (item: IngresoData) => (
        <div className="flex items-center gap-2">
          {deleteConfirm === item.id ? (
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
          )}
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
      </div>

      {/* Filtros */}
      <Card className="mb-4 md:mb-5">
        <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
          Filtros
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Input
            label="Desde"
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
          <Input
            label="Hasta"
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
          <Select
            label="Sociedad"
            value={filtros.sociedadId}
            onChange={(e) =>
              setFiltros({ ...filtros, sociedadId: e.target.value })
            }
            options={sociedadOptions}
          />
          <Select
            label="Tipo de Ingreso"
            value={filtros.tipoIngresoId}
            onChange={(e) =>
              setFiltros({ ...filtros, tipoIngresoId: e.target.value })
            }
            options={tipoIngresoOptions}
          />
          <Select
            label="Moneda"
            value={filtros.monedaId}
            onChange={(e) =>
              setFiltros({ ...filtros, monedaId: e.target.value })
            }
            options={monedaOptions}
          />
        </div>
        {(filtros.desde ||
          filtros.hasta ||
          filtros.sociedadId ||
          filtros.tipoIngresoId ||
          filtros.monedaId) && (
          <button
            onClick={() =>
              setFiltros({
                desde: "",
                hasta: "",
                sociedadId: "",
                tipoIngresoId: "",
                monedaId: "",
              })
            }
            className="mt-3 text-sm text-[#40768c] underline"
          >
            Limpiar filtros
          </button>
        )}
      </Card>

      {/* Totales */}
      {totalesPorMoneda.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {totalesPorMoneda.map(({ moneda, total }) => (
            <Card key={moneda.id} className="bg-[#ebfaf8] border-[#aeeae3]">
              <div className="text-sm text-[#20796f]">
                Total {moneda.codigo}
              </div>
              <div className="text-2xl font-bold text-[#15514a]">
                {moneda.simbolo} {total.toFixed(2)}
              </div>
            </Card>
          ))}
          <Card className="bg-[#eef4f7] border-[#b9d4df]">
            <div className="text-sm text-[#40768c]">Registros</div>
            <div className="text-2xl font-bold text-[#305969]">
              {ingresosFiltrados.length}
            </div>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={ingresosFiltrados}
          emptyMessage="No hay ingresos registrados. ¡Crea el primero!"
        />
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
                    {new Date(
                      detalleSeleccionado.fechaRecaudacion
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
    </div>
  );
}
