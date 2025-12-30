"use client";

import { useState, useTransition } from "react";
import { Card, Button, Select, Input, Badge, Table } from "@/components/ui";
import { obtenerDatosReporte } from "@/app/actions/operaciones";

interface Sociedad {
  id: string;
  nombre: string;
}

interface Caja {
  id: string;
  nombre: string;
}

interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface MovimientoReporte {
  id: string;
  fecha: Date;
  tipo: "Ingreso" | "Egreso";
  concepto: string;
  sociedad: string | null;
  caja: string;
  montos: {
    monto: number;
    monedaId: string;
    monedaCodigo: string;
    monedaSimbolo: string;
  }[];
  // Campos adicionales para vista detallada
  servicio?: string;
  tipoIngreso?: string;
  tipoGasto?: string;
  solicitante?: string;
  comentario?: string;
  usuario?: string;
}

interface ReportesClientProps {
  sociedades: Sociedad[];
  cajas: Caja[];
  monedas: Moneda[];
}

const tipoReporteOptions = [
  { value: "todos", label: "Todos los Movimientos" },
  { value: "ingresos", label: "Solo Ingresos" },
  { value: "egresos", label: "Solo Egresos" },
];

const periodoOptions = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mes" },
  { value: "trimestre", label: "Este Trimestre" },
  { value: "anio", label: "Este Año" },
  { value: "personalizado", label: "Rango Personalizado" },
];

function calcularFechas(periodo: string): { inicio: Date; fin: Date } {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  switch (periodo) {
    case "hoy":
      return { inicio, fin: hoy };
    case "semana":
      inicio.setDate(inicio.getDate() - inicio.getDay());
      return { inicio, fin: hoy };
    case "mes":
      inicio.setDate(1);
      return { inicio, fin: hoy };
    case "trimestre":
      const mesActual = inicio.getMonth();
      const inicioTrimestre = mesActual - (mesActual % 3);
      inicio.setMonth(inicioTrimestre, 1);
      return { inicio, fin: hoy };
    case "anio":
      inicio.setMonth(0, 1);
      return { inicio, fin: hoy };
    default:
      return { inicio, fin: hoy };
  }
}

export function ReportesClient({
  sociedades,
  cajas,
  monedas,
}: ReportesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [filtros, setFiltros] = useState({
    tipoReporte: "todos",
    periodo: "mes",
    fechaInicio: "",
    fechaFin: "",
    cajaId: "",
    sociedadId: "",
    monedaId: "",
  });
  const [resultados, setResultados] = useState<MovimientoReporte[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<MovimientoReporte | null>(null);

  const sociedadOptions = [
    { value: "", label: "Todas las Sociedades" },
    ...sociedades.map((s) => ({ value: s.id, label: s.nombre })),
  ];

  const cajaOptions = [
    { value: "", label: "Todas las Cajas" },
    ...cajas.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  const monedaOptions = [
    { value: "", label: "Todas las Monedas" },
    ...monedas.map((m) => ({ value: m.id, label: `${m.simbolo} ${m.codigo}` })),
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerarReporte = () => {
    startTransition(async () => {
      let fechaInicio: Date | undefined;
      let fechaFin: Date | undefined;

      if (filtros.periodo === "personalizado") {
        if (filtros.fechaInicio) {
          const [y, m, d] = filtros.fechaInicio.split("-").map(Number);
          fechaInicio = new Date(y, m - 1, d, 0, 0, 0);
        }
        if (filtros.fechaFin) {
          const [y, m, d] = filtros.fechaFin.split("-").map(Number);
          fechaFin = new Date(y, m - 1, d, 23, 59, 59);
        }
      } else {
        const fechas = calcularFechas(filtros.periodo);
        fechaInicio = fechas.inicio;
        fechaFin = fechas.fin;
      }

      const datos = await obtenerDatosReporte({
        fechaInicio,
        fechaFin,
        cajaId: filtros.cajaId || undefined,
        sociedadId: filtros.sociedadId || undefined,
      });

      let movimientos: MovimientoReporte[] = [];

      if (
        filtros.tipoReporte === "ingresos" ||
        filtros.tipoReporte === "todos"
      ) {
        movimientos = [...movimientos, ...datos.ingresos];
      }
      if (
        filtros.tipoReporte === "egresos" ||
        filtros.tipoReporte === "todos"
      ) {
        movimientos = [...movimientos, ...datos.egresos];
      }

      // Filtrar por moneda si se seleccionó una
      if (filtros.monedaId) {
        movimientos = movimientos.filter((mov) =>
          mov.montos.some((m) => m.monedaId === filtros.monedaId)
        );
      }

      // Ordenar por fecha descendente
      movimientos.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setResultados(movimientos);
      setMostrarResultados(true);
    });
  };

  // Calcular totales por moneda
  const calcularTotales = () => {
    const totales: Record<
      string,
      { ingresos: number; egresos: number; simbolo: string; codigo: string }
    > = {};

    monedas.forEach((m) => {
      totales[m.id] = {
        ingresos: 0,
        egresos: 0,
        simbolo: m.simbolo,
        codigo: m.codigo,
      };
    });

    resultados.forEach((mov) => {
      mov.montos.forEach((monto) => {
        if (!totales[monto.monedaId]) {
          totales[monto.monedaId] = {
            ingresos: 0,
            egresos: 0,
            simbolo: monto.monedaSimbolo,
            codigo: monto.monedaCodigo,
          };
        }
        if (mov.tipo === "Ingreso") {
          totales[monto.monedaId].ingresos += monto.monto;
        } else {
          totales[monto.monedaId].egresos += monto.monto;
        }
      });
    });

    return totales;
  };

  const totales = calcularTotales();

  // Función para exportar a Excel (CSV)
  const exportarExcel = () => {
    const headers = [
      "Fecha",
      "Tipo",
      "Concepto",
      "Caja",
      "Sociedad",
      "Moneda",
      "Monto",
    ];
    const rows = resultados.flatMap((mov) =>
      mov.montos.map((m) => [
        new Date(mov.fecha).toLocaleDateString("es-GT"),
        mov.tipo,
        mov.concepto,
        mov.caja,
        mov.sociedad || "",
        m.monedaCodigo,
        (mov.tipo === "Ingreso" ? "" : "-") + m.monto.toFixed(2),
      ])
    );

    // Agregar filas vacías y totales
    const totalesRows: string[][] = [];
    totalesRows.push(["", "", "", "", "", "", ""]); // Fila vacía
    totalesRows.push(["", "", "", "", "", "RESUMEN POR MONEDA", ""]); // Título
    totalesRows.push([
      "",
      "",
      "",
      "",
      "Moneda",
      "Ingresos",
      "Egresos",
      "Balance",
    ]); // Headers de totales

    Object.entries(totales)
      .filter(([, data]) => data.ingresos > 0 || data.egresos > 0)
      .forEach(([, data]) => {
        totalesRows.push([
          "",
          "",
          "",
          "",
          data.codigo,
          data.simbolo + data.ingresos.toFixed(2),
          data.simbolo + data.egresos.toFixed(2),
          data.simbolo + (data.ingresos - data.egresos).toFixed(2),
        ]);
      });

    // Agregar totales generales
    totalesRows.push(["", "", "", "", "", "", ""]); // Fila vacía
    totalesRows.push([
      "",
      "",
      "",
      "",
      "",
      "Total Registros:",
      resultados.length.toString(),
    ]);

    const csvContent = [headers, ...rows, ...totalesRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Función para exportar a PDF
  const exportarPDF = () => {
    // Crear contenido HTML para impresión
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Movimientos</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #203b46; font-size: 24px; }
          h2 { color: #40768c; font-size: 16px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #40768c; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #dceaef; }
          .ingreso { color: #2ba193; }
          .egreso { color: #e0451f; }
          .resumen { display: flex; gap: 20px; margin: 20px 0; }
          .resumen-card { background: #eef4f7; padding: 15px; border-radius: 8px; flex: 1; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Movimientos Contables</h1>
        <p>Generado: ${new Date().toLocaleString("es-GT")}</p>
        
        <h2>Resumen por Moneda</h2>
        <div class="resumen">
          ${Object.entries(totales)
            .filter(([, data]) => data.ingresos > 0 || data.egresos > 0)
            .map(
              ([, data]) => `
                <div class="resumen-card">
                  <strong>${data.codigo}</strong><br>
                  <span class="ingreso">Ingresos: ${
                    data.simbolo
                  }${data.ingresos.toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}</span><br>
                  <span class="egreso">Egresos: ${
                    data.simbolo
                  }${data.egresos.toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}</span><br>
                  <strong>Balance: ${data.simbolo}${(
                data.ingresos - data.egresos
              ).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</strong>
                </div>
              `
            )
            .join("")}
        </div>

        <h2>Detalle de Movimientos (${resultados.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Caja</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${resultados
              .map(
                (mov) => `
                  <tr>
                    <td>${new Date(mov.fecha).toLocaleDateString("es-GT")}</td>
                    <td class="${mov.tipo.toLowerCase()}">${mov.tipo}</td>
                    <td>${mov.concepto}</td>
                    <td>${mov.caja}</td>
                    <td style="text-align: right;">
                      ${mov.montos
                        .map(
                          (m) =>
                            `<span class="${mov.tipo.toLowerCase()}">${
                              mov.tipo === "Ingreso" ? "+" : "-"
                            }${m.monedaSimbolo}${m.monto.toLocaleString(
                              "es-GT",
                              { minimumFractionDigits: 2 }
                            )}</span>`
                        )
                        .join("<br>")}
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const columns = [
    {
      key: "fecha",
      header: "Fecha",
      render: (item: MovimientoReporte) =>
        new Date(item.fecha).toLocaleDateString("es-GT"),
    },
    {
      key: "concepto",
      header: "Concepto",
      render: (item: MovimientoReporte) => (
        <span className="font-medium text-[#203b46]">{item.concepto}</span>
      ),
    },
    {
      key: "caja",
      header: "Caja",
      render: (item: MovimientoReporte) => (
        <span className="text-[#40768c]">{item.caja}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (item: MovimientoReporte) => (
        <Badge variant={item.tipo === "Ingreso" ? "success" : "danger"}>
          {item.tipo}
        </Badge>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      className: "text-right",
      render: (item: MovimientoReporte) => (
        <div>
          {item.montos.map((m, idx) => (
            <span
              key={idx}
              className={`block font-semibold ${
                item.tipo === "Ingreso" ? "text-[#2ba193]" : "text-[#e0451f]"
              }`}
            >
              {item.tipo === "Ingreso" ? "+" : "-"}
              {m.monedaSimbolo}
              {m.monto.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "acciones",
      header: "",
      className: "text-center",
      render: (item: MovimientoReporte) => (
        <button
          onClick={() => setDetalleSeleccionado(item)}
          className="text-[#40768c] hover:text-[#305969] p-1 rounded hover:bg-[#eef4f7] transition-colors"
          title="Ver detalle"
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
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Panel de Filtros */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4 flex items-center gap-2">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Configurar Reporte
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select
            label="Tipo de Reporte"
            name="tipoReporte"
            options={tipoReporteOptions}
            value={filtros.tipoReporte}
            onChange={handleChange}
          />
          <Select
            label="Período"
            name="periodo"
            options={periodoOptions}
            value={filtros.periodo}
            onChange={handleChange}
          />
          <Select
            label="Caja"
            name="cajaId"
            options={cajaOptions}
            value={filtros.cajaId}
            onChange={handleChange}
          />
          <Select
            label="Moneda"
            name="monedaId"
            options={monedaOptions}
            value={filtros.monedaId}
            onChange={handleChange}
          />
        </div>

        {filtros.periodo === "personalizado" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Input
              label="Fecha Inicio"
              name="fechaInicio"
              type="date"
              value={filtros.fechaInicio}
              onChange={handleChange}
            />
            <Input
              label="Fecha Fin"
              name="fechaFin"
              type="date"
              value={filtros.fechaFin}
              onChange={handleChange}
            />
          </div>
        )}

        {filtros.tipoReporte !== "egresos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Select
              label="Sociedad"
              name="sociedadId"
              options={sociedadOptions}
              value={filtros.sociedadId}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleGenerarReporte} disabled={isPending}>
            {isPending ? (
              "Generando..."
            ) : (
              <>
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generar Reporte
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Resultados */}
      {mostrarResultados && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(totales).map(([monedaId, data]) => {
              if (data.ingresos === 0 && data.egresos === 0) return null;
              const balance = data.ingresos - data.egresos;
              return (
                <Card key={monedaId}>
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                      {data.codigo}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-[#73a9bf]">Ingresos</p>
                        <p className="text-[#2ba193] font-bold">
                          {data.simbolo}
                          {data.ingresos.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#73a9bf]">Egresos</p>
                        <p className="text-[#e0451f] font-bold">
                          {data.simbolo}
                          {data.egresos.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#73a9bf]">Balance</p>
                        <p
                          className={`font-bold ${
                            balance >= 0 ? "text-[#2ba193]" : "text-[#e0451f]"
                          }`}
                        >
                          {data.simbolo}
                          {balance.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Tabla de resultados */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide">
                Movimientos ({resultados.length})
              </h3>
              {resultados.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={exportarExcel}>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel
                  </Button>
                  <Button variant="secondary" size="sm" onClick={exportarPDF}>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    PDF
                  </Button>
                </div>
              )}
            </div>

            {resultados.length === 0 ? (
              <div className="text-center py-8 text-[#73a9bf]">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>
                  No se encontraron movimientos con los filtros seleccionados
                </p>
              </div>
            ) : (
              <Table data={resultados} columns={columns} />
            )}
          </Card>
        </>
      )}

      {/* Modal de Detalle */}
      {detalleSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#dceaef] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    detalleSeleccionado.tipo === "Ingreso"
                      ? "success"
                      : "danger"
                  }
                >
                  {detalleSeleccionado.tipo}
                </Badge>
                <h3 className="text-lg font-semibold text-[#203b46]">
                  Detalle del Movimiento
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
                    {new Date(detalleSeleccionado.fecha).toLocaleDateString(
                      "es-GT",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#73a9bf] uppercase">Caja</p>
                  <p className="font-medium text-[#203b46]">
                    {detalleSeleccionado.caja}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#73a9bf] uppercase">Concepto</p>
                <p className="font-medium text-[#203b46]">
                  {detalleSeleccionado.concepto}
                </p>
              </div>

              {detalleSeleccionado.tipo === "Ingreso" && (
                <>
                  {detalleSeleccionado.sociedad && (
                    <div>
                      <p className="text-xs text-[#73a9bf] uppercase">
                        Sociedad
                      </p>
                      <p className="font-medium text-[#203b46]">
                        {detalleSeleccionado.sociedad}
                      </p>
                    </div>
                  )}
                  {detalleSeleccionado.tipoIngreso && (
                    <div>
                      <p className="text-xs text-[#73a9bf] uppercase">
                        Tipo de Ingreso
                      </p>
                      <p className="font-medium text-[#203b46]">
                        {detalleSeleccionado.tipoIngreso}
                      </p>
                    </div>
                  )}
                  {detalleSeleccionado.servicio && (
                    <div>
                      <p className="text-xs text-[#73a9bf] uppercase">
                        Servicio
                      </p>
                      <p className="font-medium text-[#203b46]">
                        {detalleSeleccionado.servicio}
                      </p>
                    </div>
                  )}
                </>
              )}

              {detalleSeleccionado.tipo === "Egreso" && (
                <>
                  {detalleSeleccionado.tipoGasto && (
                    <div>
                      <p className="text-xs text-[#73a9bf] uppercase">
                        Tipo de Gasto
                      </p>
                      <p className="font-medium text-[#203b46]">
                        {detalleSeleccionado.tipoGasto}
                      </p>
                    </div>
                  )}
                  {detalleSeleccionado.solicitante && (
                    <div>
                      <p className="text-xs text-[#73a9bf] uppercase">
                        Solicitante
                      </p>
                      <p className="font-medium text-[#203b46]">
                        {detalleSeleccionado.solicitante}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div>
                <p className="text-xs text-[#73a9bf] uppercase">Monto(s)</p>
                <div className="space-y-1">
                  {detalleSeleccionado.montos.map((m, idx) => (
                    <p
                      key={idx}
                      className={`text-lg font-bold ${
                        detalleSeleccionado.tipo === "Ingreso"
                          ? "text-[#2ba193]"
                          : "text-[#e0451f]"
                      }`}
                    >
                      {detalleSeleccionado.tipo === "Ingreso" ? "+" : "-"}
                      {m.monedaSimbolo}
                      {m.monto.toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                      })}
                      <span className="text-sm font-normal text-[#73a9bf] ml-2">
                        ({m.monedaCodigo})
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
                    {detalleSeleccionado.usuario}
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
