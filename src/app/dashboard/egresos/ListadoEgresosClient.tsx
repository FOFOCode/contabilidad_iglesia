"use client";

import { useState, useTransition } from "react";
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

  // Filtros
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    tipoGastoId: "",
  });

  const tipoGastoOptions = [
    { value: "", label: "Todos los tipos" },
    ...tiposGasto.map((t) => ({ value: t.id, label: t.nombre })),
  ];

  // Filtrar egresos localmente
  const egresosFiltrados = egresos.filter((egreso) => {
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
    return true;
  });

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

  // Calcular totales por moneda
  const totalesPorMoneda = monedas
    .map((moneda) => {
      const total = egresosFiltrados
        .filter((e) => e.moneda.id === moneda.id)
        .reduce((acc, e) => acc + Number(e.monto), 0);
      return { moneda, total };
    })
    .filter((t) => t.total > 0);

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
    <div className="p-4 md:p-6">
      {error && (
        <div className="mb-4 p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg text-[#b43718]">
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
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
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
          Filtros
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>
        {(filtros.desde || filtros.hasta || filtros.tipoGastoId) && (
          <button
            onClick={() =>
              setFiltros({ desde: "", hasta: "", tipoGastoId: "" })
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
    </div>
  );
}
