"use client";

import { useState, useTransition } from "react";
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

  // Filtros
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    sociedadId: "",
    tipoIngresoId: "",
  });

  const sociedadOptions = [
    { value: "", label: "Todas las sociedades" },
    ...sociedades.map((s) => ({ value: s.id, label: s.nombre })),
  ];

  const tipoIngresoOptions = [
    { value: "", label: "Todos los tipos" },
    ...tiposIngreso.map((t) => ({ value: t.id, label: t.nombre })),
  ];

  // Filtrar ingresos localmente
  const ingresosFiltrados = ingresos.filter((ingreso) => {
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
    return true;
  });

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

  // Calcular totales por moneda
  const totalesPorMoneda = monedas
    .map((moneda) => {
      const total = ingresosFiltrados.reduce((acc, ingreso) => {
        const montoEnMoneda = ingreso.montos.find(
          (m) => m.moneda.id === moneda.id
        );
        return acc + (montoEnMoneda ? Number(montoEnMoneda.monto) : 0);
      }, 0);
      return { moneda, total };
    })
    .filter((t) => t.total > 0);

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
    <div className="p-4 md:p-6">
      {error && (
        <div className="mb-4 p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg text-[#b43718]">
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
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
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
          Filtros
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
        {(filtros.desde ||
          filtros.hasta ||
          filtros.sociedadId ||
          filtros.tipoIngresoId) && (
          <button
            onClick={() =>
              setFiltros({
                desde: "",
                hasta: "",
                sociedadId: "",
                tipoIngresoId: "",
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
    </div>
  );
}
