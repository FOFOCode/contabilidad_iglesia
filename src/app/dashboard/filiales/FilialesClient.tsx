"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import { Card, Button, Input, Badge, Table, Combobox } from "@/components/ui";
import {
  crearDiezmoFilial,
  crearDiezmosMultiples,
  crearEgresoFilial,
  eliminarDiezmoFilial,
  eliminarEgresoFilial,
  obtenerResumenFiliales,
  obtenerDiezmosFiliales,
  obtenerEgresosFiliales,
  obtenerSaldoFiliales,
} from "@/app/actions/filiales";

interface Moneda {
  id: string;
  codigo: string;
  simbolo: string;
  nombre: string;
}

interface TipoGasto {
  id: string;
  nombre: string;
}

interface Pais {
  id: string;
  nombre: string;
}

interface Filial {
  id: string;
  nombre: string;
  pastor: string;
  pais: Pais;
  saldos: {
    monedaId: string;
    monedaCodigo: string;
    monedaSimbolo: string;
    total: number;
  }[];
}

interface TotalGeneral {
  monedaId: string;
  monedaCodigo: string;
  monedaSimbolo: string;
  totalIngresos: number;
  totalEgresos: number;
  saldo: number;
}

interface Diezmo {
  id: string;
  monto: number;
  mes: number;
  anio: number;
  comentario: string | null;
  filial: { id: string; nombre: string; pais: Pais };
  moneda: { id: string; codigo: string; simbolo: string };
  usuario: { nombre: string; apellido: string };
  creadoEn: Date;
}

interface Egreso {
  id: string;
  fechaSalida: Date;
  solicitante: string;
  monto: number;
  descripcionGasto: string | null;
  comentario: string | null;
  moneda: { id: string; codigo: string; simbolo: string };
  tipoGasto: { id: string; nombre: string };
  usuario: { nombre: string; apellido: string };
}

interface FilialesClientProps {
  resumen: {
    filiales: Filial[];
    totalesGenerales: TotalGeneral[];
    monedas: Moneda[];
    tiposGasto: TipoGasto[];
  };
  diezmos: Diezmo[];
  egresos: Egreso[];
  usuarioId: string;
}

type TabType = "resumen" | "diezmos" | "egresos";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function FilialesClient({
  resumen,
  diezmos,
  egresos,
  usuarioId,
}: FilialesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const [showModal, setShowModal] = useState<
    "diezmo" | "diezmo-multiple" | "egreso" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Estados locales
  const [filialesData, setFilialesData] = useState(resumen.filiales);
  const [totalesGenerales, setTotalesGenerales] = useState(
    resumen.totalesGenerales
  );
  const [diezmosData, setDiezmosData] = useState(diezmos);
  const [egresosData, setEgresosData] = useState(egresos);

  // Filtros
  const [filtroFilial, setFiltroFilial] = useState("");
  const [filtroMoneda, setFiltroMoneda] = useState("");
  const [filtroAnio, setFiltroAnio] = useState(
    new Date().getFullYear().toString()
  );

  // Formulario de diezmo individual
  const [formDiezmo, setFormDiezmo] = useState({
    filialId: "",
    monto: "",
    monedaId: resumen.monedas[0]?.id || "",
    mes: (new Date().getMonth() + 1).toString(),
    anio: new Date().getFullYear().toString(),
    comentario: "",
  });

  // Formulario de diezmos múltiples (todos las filiales a la vez)
  const [formDiezmoMultiple, setFormDiezmoMultiple] = useState<{
    monedaId: string;
    mes: string;
    anio: string;
    montos: { [filialId: string]: string };
  }>({
    monedaId: resumen.monedas[0]?.id || "",
    mes: (new Date().getMonth() + 1).toString(),
    anio: new Date().getFullYear().toString(),
    montos: {},
  });

  // Formulario de egreso
  const [formEgreso, setFormEgreso] = useState({
    fechaSalida: new Date().toISOString().split("T")[0],
    solicitante: "",
    monto: "",
    monedaId: resumen.monedas[0]?.id || "",
    tipoGastoId: resumen.tiposGasto[0]?.id || "",
    descripcionGasto: "",
    comentario: "",
  });

  // Saldo disponible para egresos
  const [saldosFiliales, setSaldosFiliales] = useState<
    {
      monedaId: string;
      monedaCodigo: string;
      monedaSimbolo: string;
      ingresos: number;
      egresos: number;
      saldo: number;
    }[]
  >([]);
  const [cargandoSaldo, setCargandoSaldo] = useState(false);

  // Cargar saldo cuando se abre el modal de egreso
  const cargarSaldoFiliales = useCallback(async () => {
    setCargandoSaldo(true);
    try {
      const saldos = await obtenerSaldoFiliales();
      setSaldosFiliales(saldos);
    } catch (err) {
      console.error("Error cargando saldos:", err);
    } finally {
      setCargandoSaldo(false);
    }
  }, []);

  // Obtener saldo actual de la moneda seleccionada
  const saldoMonedaActual = useMemo(() => {
    return saldosFiliales.find((s) => s.monedaId === formEgreso.monedaId);
  }, [saldosFiliales, formEgreso.monedaId]);

  const montoEgresoNumerico = parseFloat(formEgreso.monto) || 0;
  const saldoProyectado = saldoMonedaActual
    ? saldoMonedaActual.saldo - montoEgresoNumerico
    : null;

  // Filtrar diezmos
  const diezmosFiltrados = useMemo(() => {
    return diezmosData.filter((d) => {
      if (filtroFilial && d.filial.id !== filtroFilial) return false;
      if (filtroMoneda && d.moneda.id !== filtroMoneda) return false;
      if (filtroAnio && d.anio.toString() !== filtroAnio) return false;
      return true;
    });
  }, [diezmosData, filtroFilial, filtroMoneda, filtroAnio]);

  // Años únicos para filtro
  const aniosDisponibles = useMemo(() => {
    const anios = new Set(diezmosData.map((d) => d.anio));
    anios.add(new Date().getFullYear());
    return Array.from(anios).sort((a, b) => b - a);
  }, [diezmosData]);

  const refreshData = async () => {
    startTransition(async () => {
      const [nuevoResumen, nuevosDiezmos, nuevosEgresos] = await Promise.all([
        obtenerResumenFiliales(),
        obtenerDiezmosFiliales(),
        obtenerEgresosFiliales(),
      ]);
      setFilialesData(nuevoResumen.filiales);
      setTotalesGenerales(nuevoResumen.totalesGenerales);
      setDiezmosData(
        nuevosDiezmos.map((d) => ({ ...d, monto: Number(d.monto) })) as Diezmo[]
      );
      setEgresosData(
        nuevosEgresos.map((e) => ({ ...e, monto: Number(e.monto) })) as Egreso[]
      );
    });
  };

  const handleSubmitDiezmo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formDiezmo.filialId || !formDiezmo.monto) {
      setError("Complete todos los campos requeridos");
      return;
    }

    startTransition(async () => {
      try {
        await crearDiezmoFilial({
          filialId: formDiezmo.filialId,
          monto: parseFloat(formDiezmo.monto),
          monedaId: formDiezmo.monedaId,
          mes: parseInt(formDiezmo.mes),
          anio: parseInt(formDiezmo.anio),
          comentario: formDiezmo.comentario || undefined,
          usuarioId,
        });
        await refreshData();
        setShowModal(null);
        setSuccessMessage("Diezmo registrado correctamente");
        setFormDiezmo({
          filialId: "",
          monto: "",
          monedaId: resumen.monedas[0]?.id || "",
          mes: (new Date().getMonth() + 1).toString(),
          anio: new Date().getFullYear().toString(),
          comentario: "",
        });
        // Auto-ocultar mensaje de éxito
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const handleSubmitDiezmoMultiple = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Filtrar filiales con monto ingresado
    const diezmosACrear = Object.entries(formDiezmoMultiple.montos)
      .filter(([_, monto]) => monto && parseFloat(monto) > 0)
      .map(([filialId, monto]) => ({
        filialId,
        monto: parseFloat(monto),
        monedaId: formDiezmoMultiple.monedaId,
        mes: parseInt(formDiezmoMultiple.mes),
        anio: parseInt(formDiezmoMultiple.anio),
        usuarioId,
      }));

    if (diezmosACrear.length === 0) {
      setError("Ingrese al menos un monto para registrar");
      return;
    }

    startTransition(async () => {
      try {
        await crearDiezmosMultiples(diezmosACrear);
        await refreshData();
        setShowModal(null);
        setSuccessMessage(
          `${diezmosACrear.length} diezmo(s) registrado(s) correctamente`
        );
        setFormDiezmoMultiple({
          monedaId: resumen.monedas[0]?.id || "",
          mes: (new Date().getMonth() + 1).toString(),
          anio: new Date().getFullYear().toString(),
          montos: {},
        });
        // Auto-ocultar mensaje de éxito
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formEgreso.solicitante || !formEgreso.monto) {
      setError("Complete todos los campos requeridos");
      return;
    }

    startTransition(async () => {
      try {
        await crearEgresoFilial({
          fechaSalida: new Date(formEgreso.fechaSalida),
          solicitante: formEgreso.solicitante,
          monto: parseFloat(formEgreso.monto),
          monedaId: formEgreso.monedaId,
          tipoGastoId: formEgreso.tipoGastoId,
          descripcionGasto: formEgreso.descripcionGasto || undefined,
          comentario: formEgreso.comentario || undefined,
          usuarioId,
        });
        await refreshData();
        setShowModal(null);
        setFormEgreso({
          fechaSalida: new Date().toISOString().split("T")[0],
          solicitante: "",
          monto: "",
          monedaId: resumen.monedas[0]?.id || "",
          tipoGastoId: resumen.tiposGasto[0]?.id || "",
          descripcionGasto: "",
          comentario: "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const handleDeleteDiezmo = async (id: string) => {
    startTransition(async () => {
      try {
        await eliminarDiezmoFilial(id);
        await refreshData();
        setDeleteConfirm(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  };

  const handleDeleteEgreso = async (id: string) => {
    startTransition(async () => {
      try {
        await eliminarEgresoFilial(id);
        await refreshData();
        setDeleteConfirm(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  };

  const formatMoney = (amount: number, simbolo: string) => {
    return `${simbolo}${amount.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { key: "resumen" as TabType, label: "📊 Resumen", icon: "📊" },
          { key: "diezmos" as TabType, label: "💵 Diezmos", icon: "💵" },
          { key: "egresos" as TabType, label: "📤 Egresos", icon: "📤" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-800 font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>✅ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-4 text-green-600 hover:text-green-800 font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB RESUMEN */}
      {activeTab === "resumen" && (
        <div className="space-y-6">
          {/* Caja General */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🏦 Caja General de Diezmos Filiales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {totalesGenerales.map((total) => (
                <div
                  key={total.monedaId}
                  className={`p-4 rounded-lg ${
                    total.saldo >= 0
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="text-sm text-gray-600">
                    {total.monedaCodigo}
                  </div>
                  <div className="text-2xl font-bold">
                    {formatMoney(total.saldo, total.monedaSimbolo)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ingresos:{" "}
                    {formatMoney(total.totalIngresos, total.monedaSimbolo)} |
                    Egresos:{" "}
                    {formatMoney(total.totalEgresos, total.monedaSimbolo)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Mini Cajas por Filial */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                ⛪ Saldos por Iglesia Filial (Mini Cajas)
              </h3>
              <Button onClick={() => setShowModal("diezmo")}>
                + Registrar Diezmo
              </Button>
            </div>

            {filialesData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay iglesias filiales configuradas.
                <br />
                <span className="text-sm">
                  Ve a Configuración → Filiales para agregar iglesias.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filialesData.map((filial) => (
                  <div
                    key={filial.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="font-semibold text-[#203b46]">
                      {filial.nombre}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      👤 {filial.pastor} | 🌍 {filial.pais.nombre}
                    </div>
                    <div className="space-y-1">
                      {filial.saldos.map((s) => (
                        <div
                          key={s.monedaId}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {s.monedaCodigo}:
                          </span>
                          <span
                            className={`font-medium ${
                              s.total >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatMoney(s.total, s.monedaSimbolo)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB DIEZMOS */}
      {activeTab === "diezmos" && (
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold">Registro de Diezmos</h3>
            <div className="flex flex-wrap gap-2">
              <Combobox
                value={filtroFilial}
                onChange={(value) => setFiltroFilial(value)}
                options={filialesData.map((f) => ({
                  value: f.id,
                  label: f.nombre,
                }))}
                placeholder="Todas las filiales"
                clearable
                searchable={false}
                className="w-40"
              />
              <Combobox
                value={filtroMoneda}
                onChange={(value) => setFiltroMoneda(value)}
                options={resumen.monedas.map((m) => ({
                  value: m.id,
                  label: m.codigo,
                }))}
                placeholder="Todas monedas"
                clearable
                searchable={false}
                className="w-32"
              />
              <Combobox
                value={filtroAnio}
                onChange={(value) => setFiltroAnio(value)}
                options={aniosDisponibles.map((a) => ({
                  value: a.toString(),
                  label: a.toString(),
                }))}
                searchable={false}
                className="w-24"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowModal("diezmo-multiple")}
                >
                  📋 Registro Múltiple
                </Button>
                <Button onClick={() => setShowModal("diezmo")}>
                  + Nuevo Diezmo
                </Button>
              </div>
            </div>
          </div>

          <Table
            columns={[
              {
                key: "filial",
                header: "Iglesia",
                render: (item) => (
                  <div>
                    <div className="font-medium">{item.filial.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {item.filial.pais.nombre}
                    </div>
                  </div>
                ),
              },
              {
                key: "periodo",
                header: "Período",
                render: (item) => `${MESES[item.mes - 1]} ${item.anio}`,
              },
              {
                key: "monto",
                header: "Monto",
                render: (item) => (
                  <span className="font-medium text-green-600">
                    {formatMoney(item.monto, item.moneda.simbolo)}
                  </span>
                ),
              },
              {
                key: "comentario",
                header: "Comentario",
                render: (item) => item.comentario || "-",
              },
              {
                key: "acciones",
                header: "Acciones",
                render: (item) =>
                  deleteConfirm === item.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteDiezmo(item.id)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      Eliminar
                    </Button>
                  ),
              },
            ]}
            data={diezmosFiltrados}
            emptyMessage="No hay diezmos registrados para los filtros seleccionados"
          />
        </Card>
      )}

      {/* TAB EGRESOS */}
      {activeTab === "egresos" && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Egresos de Caja General</h3>
            <Button
              onClick={() => {
                setShowModal("egreso");
                cargarSaldoFiliales();
              }}
            >
              + Nuevo Egreso
            </Button>
          </div>

          <Table
            columns={[
              {
                key: "fecha",
                header: "Fecha",
                render: (item) =>
                  new Date(item.fechaSalida).toLocaleDateString("es-GT"),
              },
              { key: "solicitante", header: "Solicitante" },
              {
                key: "tipoGasto",
                header: "Tipo",
                render: (item) => item.tipoGasto.nombre,
              },
              {
                key: "monto",
                header: "Monto",
                render: (item) => (
                  <span className="font-medium text-red-600">
                    {formatMoney(item.monto, item.moneda.simbolo)}
                  </span>
                ),
              },
              {
                key: "descripcion",
                header: "Descripción",
                render: (item) =>
                  item.descripcionGasto || item.comentario || "-",
              },
              {
                key: "acciones",
                header: "Acciones",
                render: (item) =>
                  deleteConfirm === `e-${item.id}` ? (
                    <div className="flex gap-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteEgreso(item.id)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirm(`e-${item.id}`)}
                    >
                      Eliminar
                    </Button>
                  ),
              },
            ]}
            data={egresosData}
            emptyMessage="No hay egresos registrados"
          />
        </Card>
      )}

      {/* Modal Diezmo */}
      {showModal === "diezmo" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Registrar Diezmo</h3>
            <form onSubmit={handleSubmitDiezmo} className="space-y-4">
              <Combobox
                label="Iglesia Filial"
                value={formDiezmo.filialId}
                onChange={(value) =>
                  setFormDiezmo({ ...formDiezmo, filialId: value })
                }
                options={filialesData.map((f) => ({
                  value: f.id,
                  label: `${f.nombre} (${f.pais.nombre})`,
                }))}
                placeholder="Seleccione una iglesia"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monto"
                  type="number"
                  step="0.01"
                  value={formDiezmo.monto}
                  onChange={(e) =>
                    setFormDiezmo({ ...formDiezmo, monto: e.target.value })
                  }
                  required
                />
                <Combobox
                  label="Moneda"
                  value={formDiezmo.monedaId}
                  onChange={(value) =>
                    setFormDiezmo({ ...formDiezmo, monedaId: value })
                  }
                  options={resumen.monedas.map((m) => ({
                    value: m.id,
                    label: `${m.codigo} (${m.simbolo})`,
                  }))}
                  searchable={false}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Combobox
                  label="Mes"
                  value={formDiezmo.mes}
                  onChange={(value) =>
                    setFormDiezmo({ ...formDiezmo, mes: value })
                  }
                  options={MESES.map((m, i) => ({
                    value: (i + 1).toString(),
                    label: m,
                  }))}
                  searchable={false}
                  required
                />
                <Input
                  label="Año"
                  type="number"
                  value={formDiezmo.anio}
                  onChange={(e) =>
                    setFormDiezmo({ ...formDiezmo, anio: e.target.value })
                  }
                  required
                />
              </div>
              <Input
                label="Comentario (opcional)"
                value={formDiezmo.comentario}
                onChange={(e) =>
                  setFormDiezmo({ ...formDiezmo, comentario: e.target.value })
                }
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(null);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Diezmo Múltiple */}
      {showModal === "diezmo-multiple" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              📋 Registro Múltiple de Diezmos
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ingrese los montos para cada iglesia filial. Solo se registrarán
              las que tengan monto.
            </p>
            <form onSubmit={handleSubmitDiezmoMultiple} className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <Combobox
                  label="Mes"
                  value={formDiezmoMultiple.mes}
                  onChange={(value) =>
                    setFormDiezmoMultiple({
                      ...formDiezmoMultiple,
                      mes: value,
                    })
                  }
                  options={MESES.map((m, i) => ({
                    value: (i + 1).toString(),
                    label: m,
                  }))}
                  searchable={false}
                />
                <Input
                  label="Año"
                  type="number"
                  value={formDiezmoMultiple.anio}
                  onChange={(e) =>
                    setFormDiezmoMultiple({
                      ...formDiezmoMultiple,
                      anio: e.target.value,
                    })
                  }
                />
                <Combobox
                  label="Moneda"
                  value={formDiezmoMultiple.monedaId}
                  onChange={(value) =>
                    setFormDiezmoMultiple({
                      ...formDiezmoMultiple,
                      monedaId: value,
                    })
                  }
                  options={resumen.monedas.map((m) => ({
                    value: m.id,
                    label: `${m.codigo} (${m.simbolo})`,
                  }))}
                  searchable={false}
                />
              </div>

              <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                {filialesData.map((filial) => (
                  <div
                    key={filial.id}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{filial.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {filial.pais.nombre} • Pastor {filial.pastor}
                      </div>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formDiezmoMultiple.montos[filial.id] || ""}
                        onChange={(e) =>
                          setFormDiezmoMultiple({
                            ...formDiezmoMultiple,
                            montos: {
                              ...formDiezmoMultiple.montos,
                              [filial.id]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {Object.values(formDiezmoMultiple.montos).filter(
                (m) => m && parseFloat(m) > 0
              ).length > 0 && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  📊 Se registrarán{" "}
                  <strong>
                    {
                      Object.values(formDiezmoMultiple.montos).filter(
                        (m) => m && parseFloat(m) > 0
                      ).length
                    }
                  </strong>{" "}
                  diezmo(s)
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(null);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Todos"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Egreso */}
      {showModal === "egreso" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Registrar Egreso</h3>

            {/* Preview de Saldo Disponible */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-blue-700 uppercase">
                  💰 Saldo Disponible en Caja General
                </h4>
                <button
                  type="button"
                  onClick={cargarSaldoFiliales}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  🔄 Actualizar
                </button>
              </div>
              {cargandoSaldo ? (
                <p className="text-sm text-gray-500">Cargando saldos...</p>
              ) : saldosFiliales.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {saldosFiliales.map((s) => (
                    <div
                      key={s.monedaId}
                      className={`p-2 rounded ${
                        s.monedaId === formEgreso.monedaId
                          ? "bg-white border-2 border-blue-500"
                          : "bg-white/50 border border-gray-200"
                      }`}
                    >
                      <p className="text-xs text-gray-500">{s.monedaCodigo}</p>
                      <p
                        className={`font-bold ${
                          s.saldo >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {s.monedaSimbolo}
                        {s.saldo.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin saldos disponibles</p>
              )}

              {/* Proyección después del egreso */}
              {saldoMonedaActual && montoEgresoNumerico > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Saldo después del egreso ({saldoMonedaActual.monedaCodigo}
                      ):
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        saldoProyectado !== null && saldoProyectado >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {saldoMonedaActual.monedaSimbolo}
                      {saldoProyectado?.toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {saldoProyectado !== null && saldoProyectado < 0 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ El egreso supera el saldo disponible. No se permitirá
                      guardar.
                    </p>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitEgreso} className="space-y-4">
              <Input
                label="Fecha"
                type="date"
                value={formEgreso.fechaSalida}
                onChange={(e) =>
                  setFormEgreso({ ...formEgreso, fechaSalida: e.target.value })
                }
                required
              />
              <Input
                label="Solicitante"
                value={formEgreso.solicitante}
                onChange={(e) =>
                  setFormEgreso({ ...formEgreso, solicitante: e.target.value })
                }
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monto"
                  type="number"
                  step="0.01"
                  value={formEgreso.monto}
                  onChange={(e) =>
                    setFormEgreso({ ...formEgreso, monto: e.target.value })
                  }
                  required
                />
                <Combobox
                  label="Moneda"
                  value={formEgreso.monedaId}
                  onChange={(value) =>
                    setFormEgreso({ ...formEgreso, monedaId: value })
                  }
                  options={resumen.monedas.map((m) => ({
                    value: m.id,
                    label: `${m.codigo} (${m.simbolo})`,
                  }))}
                  searchable={false}
                  required
                />
              </div>
              <Combobox
                label="Tipo de Gasto"
                value={formEgreso.tipoGastoId}
                onChange={(value) =>
                  setFormEgreso({ ...formEgreso, tipoGastoId: value })
                }
                options={resumen.tiposGasto.map((t) => ({
                  value: t.id,
                  label: t.nombre,
                }))}
                required
              />
              <Input
                label="Descripción del Gasto"
                value={formEgreso.descripcionGasto}
                onChange={(e) =>
                  setFormEgreso({
                    ...formEgreso,
                    descripcionGasto: e.target.value,
                  })
                }
              />
              <Input
                label="Comentario (opcional)"
                value={formEgreso.comentario}
                onChange={(e) =>
                  setFormEgreso({ ...formEgreso, comentario: e.target.value })
                }
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(null);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    (saldoProyectado !== null && saldoProyectado < 0)
                  }
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
