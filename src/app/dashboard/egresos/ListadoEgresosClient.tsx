"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Card, Button, Select, Input, Badge, Table } from "@/components/ui";
import { eliminarEgreso } from "@/app/actions/operaciones";

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
  tipoGasto: { nombre: string };
  caja: { nombre: string };
  moneda: Moneda;
  usuario: { nombre: string; apellido: string } | null;
}

interface ListadoEgresosClientProps {
  egresos: EgresoData[];
  tiposGasto: TipoGasto[];
  monedas: Moneda[];
}

export function ListadoEgresosClient({
  egresos: egresosIniciales,
  tiposGasto,
  monedas,
}: ListadoEgresosClientProps) {
  const [isPending, startTransition] = useTransition();
  const [egresos, setEgresos] = useState(egresosIniciales);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<EgresoData | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    tipoGastoId: "",
    monedaId: "",
  });

  // Memoizar opciones de select
  const tipoGastoOptions = useMemo(
    () => [
      { value: "", label: "Todos los tipos" },
      ...tiposGasto.map((t) => ({ value: t.id, label: t.nombre })),
    ],
    [tiposGasto]
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
    [egresos, filtros, tiposGasto]
  );

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
            .reduce((acc, e) => acc + Number(e.monto), 0);
          return { moneda, total };
        })
        .filter((t) => t.total > 0),
    [monedas, egresosFiltrados]
  );

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: EgresoData) => (
        <span className="text-[#203b46] font-medium">
          {formatDate(item.fechaSalida)}
        </span>
      ),
    },
    {
      key: "solicitante",
      header: "Solicitante",
      render: (item: EgresoData) => (
        <span className="text-[#305969]">{item.solicitante}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo de Gasto",
      render: (item: EgresoData) => (
        <Badge variant="warning">{item.tipoGasto.nombre}</Badge>
      ),
    },
    {
      key: "caja",
      header: "Caja",
      render: (item: EgresoData) => (
        <span className="text-[#73a9bf] text-sm">{item.caja.nombre}</span>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      render: (item: EgresoData) => (
        <span className="font-semibold text-[#e0451f]">
          {formatMonto(Number(item.monto), item.moneda.simbolo)}
        </span>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (item: EgresoData) => (
        <span className="text-[#73a9bf] text-sm truncate max-w-[200px] block">
          {item.descripcionGasto || "-"}
        </span>
      ),
    },
    {
      key: "ver",
      header: "",
      render: (item: EgresoData) => (
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
      render: (item: EgresoData) => (
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
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
          <Input
            label="Hasta"
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
          <Select
            label="Tipo de Gasto"
            value={filtros.tipoGastoId}
            onChange={(e) =>
              setFiltros({ ...filtros, tipoGastoId: e.target.value })
            }
            options={tipoGastoOptions}
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
          filtros.tipoGastoId ||
          filtros.monedaId) && (
          <button
            onClick={() =>
              setFiltros({
                desde: "",
                hasta: "",
                tipoGastoId: "",
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
            <Card key={moneda.id} className="bg-[#fcece9] border-[#f3b5a5]">
              <div className="text-sm text-[#b43718]">
                Total {moneda.codigo}
              </div>
              <div className="text-2xl font-bold text-[#e0451f]">
                {moneda.simbolo} {total.toFixed(2)}
              </div>
            </Card>
          ))}
          <Card className="bg-[#eef4f7] border-[#b9d4df]">
            <div className="text-sm text-[#40768c]">Registros</div>
            <div className="text-2xl font-bold text-[#305969]">
              {egresosFiltrados.length}
            </div>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          data={egresosFiltrados}
          emptyMessage="No hay egresos registrados."
        />
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
                      detalleSeleccionado.fechaSalida
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
    </div>
  );
}
