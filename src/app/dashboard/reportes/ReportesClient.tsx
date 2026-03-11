"use client";

import {
  useState,
  useTransition,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Card, Button, Combobox, Input, Badge, Table } from "@/components/ui";
import {
  obtenerDatosReporte,
  obtenerDatosReporteAnalitico,
  obtenerReporteSaldosActuales,
  obtenerLogAuditoria,
  obtenerEstadisticasAuditoria,
  type FiltrosAuditoria,
} from "@/app/actions/operaciones";
import {
  obtenerReporteDiezmosFiliales,
  obtenerReporteCajaFiliales,
  obtenerPaises,
} from "@/app/actions/filiales";
import { obtenerFechaElSalvador } from "@/lib/fechas";

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

interface Pais {
  id: string;
  nombre: string;
  codigo: string | null;
  orden: number;
  activo: boolean;
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
  // nota: numeroFactura y numeroDocumento ya están integrados en el concepto
}

interface ReportesClientProps {
  sociedades: Sociedad[];
  cajas: Caja[];
  monedas: Moneda[];
  usuarioActual?: any; // Usuario con rol y permisos
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

// Tipos de reportes disponibles
type TipoVista =
  | "movimientos"
  | "comparativo"
  | "sociedades"
  | "tipoIngreso"
  | "tipoGasto"
  | "cajas"
  | "saldosActuales"
  | "diezmosFiliales"
  | "cajaFiliales"
  | "auditoria";

interface DatosAnaliticos {
  anio: number;
  periodo?: string; // Nuevo campo para mostrar el período personalizado
  monedaSeleccionada: {
    id: string;
    codigo: string;
    simbolo: string;
    nombre: string;
  } | null;
  datosMensuales: {
    mes: number;
    nombreMes: string;
    ingresos: number;
    egresos: number;
    balance: number;
  }[];
  porSociedad: {
    id: string;
    nombre: string;
    total: number;
    cantidad: number;
  }[];
  porTipoIngreso: {
    id: string;
    nombre: string;
    total: number;
    cantidad: number;
    porSociedad?: {
      id: string;
      nombre: string;
      total: number;
      cantidad: number;
    }[];
  }[];
  porTipoGasto: {
    id: string;
    nombre: string;
    total: number;
    cantidad: number;
  }[];
  porCaja: {
    id: string;
    nombre: string;
    ingresos: number;
    egresos: number;
    balance: number;
  }[];
  totales: {
    ingresos: number;
    egresos: number;
    balance: number;
    cantidadIngresos: number;
    cantidadEgresos: number;
  };
  monedas: { id: string; codigo: string; simbolo: string; nombre: string }[];
}

function calcularFechas(periodo: string): { inicio: Date; fin: Date } {
  // Usar hora de El Salvador para calcular períodos
  const ahora = obtenerFechaElSalvador();

  // Crear fecha de inicio: hoy a las 00:00:00
  const inicio = new Date(ahora);
  inicio.setHours(0, 0, 0, 0);

  // Crear fecha de fin (se ajustará según el período)
  const fin = new Date(ahora);
  fin.setHours(23, 59, 59, 999);

  switch (periodo) {
    case "hoy":
      return { inicio, fin };
    case "semana":
      // Retroceder al domingo de esta semana
      const diaSemana = inicio.getDay();
      inicio.setDate(inicio.getDate() - diaSemana);
      inicio.setHours(0, 0, 0, 0);
      // Fin de semana = sábado
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
      return { inicio, fin };
    case "mes":
      // Primer día del mes actual
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
      // Último día del mes actual
      fin.setMonth(fin.getMonth() + 1, 0); // Día 0 del siguiente mes = último día del mes actual
      fin.setHours(23, 59, 59, 999);
      return { inicio, fin };
    case "trimestre":
      const mesActual = inicio.getMonth();
      const inicioTrimestre = mesActual - (mesActual % 3);
      inicio.setMonth(inicioTrimestre, 1);
      inicio.setHours(0, 0, 0, 0);
      // Último día del trimestre
      fin.setMonth(inicioTrimestre + 3, 0);
      fin.setHours(23, 59, 59, 999);
      return { inicio, fin };
    case "anio":
      // Primer día del año
      inicio.setMonth(0, 1);
      inicio.setHours(0, 0, 0, 0);
      // Último día del año
      fin.setMonth(11, 31);
      fin.setHours(23, 59, 59, 999);
      return { inicio, fin };
    default:
      return { inicio, fin };
  }
}

export function ReportesClient({
  sociedades,
  cajas,
  monedas,
  usuarioActual,
}: ReportesClientProps) {
  const [isPending, startTransition] = useTransition();
  const [vistaActiva, setVistaActiva] = useState<TipoVista>("movimientos");
  const [paises, setPaises] = useState<Pais[]>([]);
  const [filtros, setFiltros] = useState({
    tipoReporte: "todos",
    periodo: "mes",
    fechaInicio: "",
    fechaFin: "",
    cajaId: "",
    sociedadId: "",
    monedaId: "",
  });
  const [filtrosAnaliticos, setFiltrosAnaliticos] = useState({
    anio: obtenerFechaElSalvador().getFullYear(),
    monedaId: monedas.find((m) => m.esPrincipal)?.id || "",
    modoFiltro: "anio" as "anio" | "rango", // Nuevo: modo de filtro
    fechaInicio: "", // Nuevo: fecha inicio para rango
    fechaFin: "", // Nuevo: fecha fin para rango
  });
  const [filtrosSaldos, setFiltrosSaldos] = useState({});
  const [filtrosDiezmosFiliales, setFiltrosDiezmosFiliales] = useState({
    anio: obtenerFechaElSalvador().getFullYear(),
    monedaId: "",
    paisId: "",
  });
  const [filtrosCajaFiliales, setFiltrosCajaFiliales] = useState({
    anio: obtenerFechaElSalvador().getFullYear(),
    monedaId: "",
  });
  const [resultados, setResultados] = useState<MovimientoReporte[]>([]);
  const [datosAnaliticos, setDatosAnaliticos] =
    useState<DatosAnaliticos | null>(null);
  const [datosSaldosActuales, setDatosSaldosActuales] = useState<any>(null);
  const [datosDiezmosFiliales, setDatosDiezmosFiliales] = useState<any>(null);
  const [datosCajaFiliales, setDatosCajaFiliales] = useState<any>(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] =
    useState<MovimientoReporte | null>(null);

  // Memoizar opciones de select para evitar recalcular en cada render
  const sociedadOptions = useMemo(
    () => sociedades.map((s) => ({ value: s.id, label: s.nombre })),
    [sociedades]
  );

  const cajaOptions = useMemo(
    () => cajas.map((c) => ({ value: c.id, label: c.nombre })),
    [cajas]
  );

  const monedaOptions = useMemo(
    () =>
      monedas.map((m) => ({
        value: m.id,
        label: `${m.simbolo} ${m.codigo}`,
      })),
    [monedas]
  );

  const paisOptions = useMemo(
    () =>
      paises.map((p) => ({
        value: p.id,
        label: p.nombre,
      })),
    [paises]
  );

  const handleComboboxChange = useCallback((name: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const { name, value } = e.target;
      setFiltros((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Años disponibles para el reporte analítico
  const anioOptions = useMemo(() => {
    const anioActual = obtenerFechaElSalvador().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: (anioActual - i).toString(),
      label: (anioActual - i).toString(),
    }));
  }, []);

  // Helper para mostrar el período en los títulos de reportes
  const obtenerLabelPeriodo = useCallback(() => {
    if (!datosAnaliticos) return "";
    return datosAnaliticos.periodo || datosAnaliticos.anio.toString();
  }, [datosAnaliticos]);

  const handleGenerarReporteAnalitico = () => {
    startTransition(async () => {
      const datos = await obtenerDatosReporteAnalitico({
        anio: filtrosAnaliticos.anio,
        monedaId: filtrosAnaliticos.monedaId || undefined,
        usarRangoFechas: filtrosAnaliticos.modoFiltro === "rango",
        fechaInicio: filtrosAnaliticos.fechaInicio || undefined,
        fechaFin: filtrosAnaliticos.fechaFin || undefined,
      });
      setDatosAnaliticos(datos as DatosAnaliticos);
      setMostrarResultados(true);
    });
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

      // Enviar fechas como ISO strings para evitar problemas de serialización
      const datos = await obtenerDatosReporte({
        fechaInicio: fechaInicio?.toISOString(),
        fechaFin: fechaFin?.toISOString(),
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

  const handleGenerarReporteDiezmosFiliales = () => {
    startTransition(async () => {
      const datos = await obtenerReporteDiezmosFiliales({
        anio: filtrosDiezmosFiliales.anio,
        monedaId: filtrosDiezmosFiliales.monedaId || undefined,
        paisId: filtrosDiezmosFiliales.paisId || undefined,
      });
      setDatosDiezmosFiliales(datos);
      setMostrarResultados(true);
    });
  };

  const handleGenerarReporteCajaFiliales = () => {
    startTransition(async () => {
      const datos = await obtenerReporteCajaFiliales({
        anio: filtrosCajaFiliales.anio,
        monedaId: filtrosCajaFiliales.monedaId || undefined,
      });
      setDatosCajaFiliales(datos);
      setMostrarResultados(true);
    });
  };

  const handleGenerarReporteSaldosActuales = () => {
    startTransition(async () => {
      const datos = await obtenerReporteSaldosActuales();
      setDatosSaldosActuales(datos);
      setMostrarResultados(true);
    });
  };

  // Cargar países al montar
  useEffect(() => {
    const cargarPaises = async () => {
      const paisesData = await obtenerPaises();
      setPaises(paisesData);
    };
    cargarPaises();
  }, []);

  // Calcular totales por moneda - memoizado
  const calcularTotales = useCallback(() => {
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
  }, [resultados, monedas]);

  const totales = useMemo(() => calcularTotales(), [calcularTotales]);

  // Función para exportar a Excel (CSV)
  const exportarExcel = () => {
    const headers = ["Fecha", "Tipo", "Concepto", "Caja", "Sociedad", "Moneda", "Monto"];
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
          data.codigo,
          data.simbolo + data.ingresos.toFixed(2),
          data.simbolo + data.egresos.toFixed(2),
          data.simbolo + (data.ingresos - data.egresos).toFixed(2),
        ]);
      });

    // Agregar totales generales
    totalesRows.push(["", "", "", "", "", "", ""]); // Fila vacía
    totalesRows.push(["", "", "", "", "", "Total Registros:", resultados.length.toString()]);

    const csvContent = [headers, ...rows, ...totalesRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_${
      obtenerFechaElSalvador().toISOString().split("T")[0]
    }.csv`;
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
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #203b46; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          h1 { 
            color: #203b46; 
            font-size: 24px; 
            margin: 5px 0;
          }
          .fecha-generacion {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
          }
          h2 { 
            color: #40768c; 
            font-size: 16px; 
            margin-top: 20px; 
            border-bottom: 1px solid #40768c;
            padding-bottom: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
          }
          th { 
            background: #203b46; 
            color: white; 
            padding: 12px; 
            text-align: left; 
            font-weight: bold;
            border: 1px solid #203b46;
          }
          td { 
            padding: 8px; 
            border-bottom: 1px solid #dceaef; 
            border-right: 1px solid #dceaef;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .ingreso { 
            color: #2ba193; 
            font-weight: bold;
          }
          .egreso { 
            color: #e0451f; 
            font-weight: bold;
          }
          .resumen { 
            display: flex; 
            gap: 20px; 
            margin: 20px 0; 
            flex-wrap: wrap;
          }
          .resumen-card { 
            background: #eef4f7; 
            padding: 15px; 
            border-left: 4px solid #203b46;
            flex: 1;
            min-width: 150px;
          }
          .firmas {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .firma-bloque {
            flex: 1;
            text-align: center;
          }
          .firma-linea {
            border-top: 2px solid #000;
            margin-bottom: 5px;
            padding-top: 10px;
            min-height: 50px;
          }
          .firma-titulo {
            font-weight: bold;
            font-size: 12px;
          }
          .firma-subtitulo {
            font-size: 10px;
            color: #666;
            margin-top: 3px;
          }
          @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Movimientos Contables</h1>
        </div>
        <div class="fecha-generacion">
          <strong>Fecha de Generación:</strong> ${obtenerFechaElSalvador().toLocaleString(
            "es-GT"
          )}
        </div>
        
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

        <div class="firmas">
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-titulo">Presidente/Representante</div>
            <div class="firma-subtitulo">Firma y Sello</div>
          </div>
          <div class="firma-bloque">
            <div class="firma-linea"></div>
            <div class="firma-titulo">Tesorero</div>
            <div class="firma-subtitulo">Firma y Sello</div>
          </div>
        </div>
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

  // Funciones de exportación para Saldos Actuales
  const exportarSaldosActualesExcel = () => {
    if (!datosSaldosActuales) return;

    const headers = [
      "Tipo de Caja",
      "Nombre",
      "Moneda",
      "Ingresos",
      "Egresos",
      "Saldo",
    ];
    const rows: string[][] = [];

    // Cajas Generales
    if (datosSaldosActuales.cajasGenerales) {
      rows.push(["CAJAS GENERALES", "", "", "", "", ""]);
      datosSaldosActuales.cajasGenerales.forEach((caja: any) => {
        caja.saldos?.forEach((saldo: any) => {
          rows.push([
            "",
            caja.nombre,
            saldo.monedaCodigo,
            saldo.ingresos.toFixed(2),
            saldo.egresos.toFixed(2),
            saldo.saldo.toFixed(2),
          ]);
        });
      });
      rows.push(["", "", "", "", "", ""]);
    }

    // Cajas de Sociedades
    if (datosSaldosActuales.cajasSociedades) {
      rows.push(["CAJAS DE SOCIEDADES", "", "", "", "", ""]);
      datosSaldosActuales.cajasSociedades.forEach((caja: any) => {
        caja.saldos?.forEach((saldo: any) => {
          rows.push([
            "",
            `${caja.sociedad?.nombre || "-"} - ${caja.nombre}`,
            saldo.monedaCodigo,
            saldo.ingresos.toFixed(2),
            saldo.egresos.toFixed(2),
            saldo.saldo.toFixed(2),
          ]);
        });
      });
      rows.push(["", "", "", "", "", ""]);
    }

    // Cajas Virtuales
    if (datosSaldosActuales.cajasVirtuales) {
      rows.push(["CAJAS VIRTUALES", "", "", "", "", ""]);
      datosSaldosActuales.cajasVirtuales.forEach((caja: any) => {
        caja.saldos?.forEach((saldo: any) => {
          rows.push([
            "",
            caja.nombre,
            saldo.monedaCodigo,
            saldo.ingresos.toFixed(2),
            saldo.egresos.toFixed(2),
            saldo.saldo.toFixed(2),
          ]);
        });
      });
    }

    // Agregar resumen por moneda
    rows.push(["", "", "", "", "", ""]);
    rows.push(["RESUMEN POR MONEDA", "", "", "", "", ""]);
    Object.entries(datosSaldosActuales.totalesPorMoneda || {}).forEach(
      ([monedaId, datos]: [string, any]) => {
        const moneda = datosSaldosActuales.monedas?.find(
          (m: any) => m.id === monedaId
        );
        rows.push([
          "",
          moneda?.codigo || monedaId,
          moneda?.simbolo || "$",
          datos.ingresos.toFixed(2),
          datos.egresos.toFixed(2),
          datos.saldo.toFixed(2),
        ]);
      }
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_saldos_${
      obtenerFechaElSalvador().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarSaldosActualesPDF = () => {
    if (!datosSaldosActuales) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Saldos Actuales</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #203b46; font-size: 24px; margin-bottom: 10px; }
          .fecha { color: #73a9bf; font-size: 12px; margin-bottom: 20px; }
          h2 { color: #40768c; font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #40768c; color: white; padding: 10px; text-align: left; font-weight: bold; }
          td { padding: 8px; border-bottom: 1px solid #dceaef; }
          tr:nth-child(even) { background: #f9fafb; }
          .seccion { background: #eef4f7; padding: 10px; font-weight: bold; margin-top: 15px; }
          .total { background: #d4edea; font-weight: bold; }
          .positivo { color: #2ba193; }
          .negativo { color: #e0451f; }
          .resumen { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
          .resumen-card { background: #eef4f7; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Saldos Actuales de Cajas</h1>
        <p class="fecha">Generado: ${obtenerFechaElSalvador().toLocaleString(
          "es-GT"
        )}</p>
        
        <h2>Resumen por Moneda</h2>
        <div class="resumen">
          ${Object.entries(datosSaldosActuales.totalesPorMoneda || {})
            .map(([monedaId, datos]: [string, any]) => {
              const moneda = datosSaldosActuales.monedas?.find(
                (m: any) => m.id === monedaId
              );
              return `
                <div class="resumen-card">
                  <strong>${moneda?.codigo || monedaId}</strong><br>
                  <span class="positivo">Ingresos: ${moneda?.simbolo || "$"}${(
                datos.ingresos || 0
              ).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}</span><br>
                  <span class="negativo">Egresos: ${moneda?.simbolo || "$"}${(
                datos.egresos || 0
              ).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
              })}</span><br>
                  <strong>Saldo: ${moneda?.simbolo || "$"}${(
                datos.saldo || 0
              ).toLocaleString("es-GT", { minimumFractionDigits: 2 })}</strong>
                </div>
              `;
            })
            .join("")}
        </div>

        <table>
          <thead>
            <tr>
              <th>Tipo de Caja</th>
              <th>Nombre</th>
              <th>Moneda</th>
              <th style="text-align: right;">Ingresos</th>
              <th style="text-align: right;">Egresos</th>
              <th style="text-align: right;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${
              datosSaldosActuales.cajasGenerales
                ? `
                  <tr class="seccion">
                    <td colspan="6">CAJAS GENERALES</td>
                  </tr>
                  ${datosSaldosActuales.cajasGenerales
                    .map(
                      (caja: any) => `
                    ${caja.saldos
                      ?.map(
                        (saldo: any) => `
                      <tr>
                        <td></td>
                        <td>${caja.nombre}</td>
                        <td>${saldo.monedaCodigo}</td>
                        <td style="text-align: right;" class="positivo">${
                          saldo.monedaSimbolo
                        }${saldo.ingresos.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td style="text-align: right;" class="negativo">${
                          saldo.monedaSimbolo
                        }${saldo.egresos.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td style="text-align: right;" class="${
                          saldo.saldo >= 0 ? "positivo" : "negativo"
                        }">${saldo.monedaSimbolo}${saldo.saldo.toLocaleString(
                          "es-GT",
                          { minimumFractionDigits: 2 }
                        )}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  `
                    )
                    .join("")}
                `
                : ""
            }
            ${
              datosSaldosActuales.cajasSociedades
                ? `
                  <tr class="seccion">
                    <td colspan="6">CAJAS DE SOCIEDADES</td>
                  </tr>
                  ${datosSaldosActuales.cajasSociedades
                    .map(
                      (caja: any) => `
                    ${caja.saldos
                      ?.map(
                        (saldo: any) => `
                      <tr>
                        <td></td>
                        <td>${caja.sociedad?.nombre || "-"} - ${
                          caja.nombre
                        }</td>
                        <td>${saldo.monedaCodigo}</td>
                        <td style="text-align: right;" class="positivo">${
                          saldo.monedaSimbolo
                        }${saldo.ingresos.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td style="text-align: right;" class="negativo">${
                          saldo.monedaSimbolo
                        }${saldo.egresos.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td style="text-align: right;" class="${
                          saldo.saldo >= 0 ? "positivo" : "negativo"
                        }">${saldo.monedaSimbolo}${saldo.saldo.toLocaleString(
                          "es-GT",
                          { minimumFractionDigits: 2 }
                        )}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  `
                    )
                    .join("")}
                `
                : ""
            }
            ${
              datosSaldosActuales.cajasVirtuales
                ? `
                  <tr class="seccion">
                    <td colspan="6">CAJAS VIRTUALES</td>
                  </tr>
                  ${datosSaldosActuales.cajasVirtuales
                    .map(
                      (caja: any) => `
                    ${caja.saldos
                      ?.map(
                        (saldo: any) => `
                      <tr>
                        <td></td>
                        <td>${caja.nombre}</td>
                        <td>${saldo.monedaCodigo}</td>
                        <td style="text-align: right;" class="positivo">${
                          saldo.monedaSimbolo
                        }${saldo.ingresos.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td style="text-align: right;" class="negativo">${
                          saldo.monedaSimbolo
                        }${saldo.egresos.toLocaleString("es-GT", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td style="text-align: right;" class="${
                          saldo.saldo >= 0 ? "positivo" : "negativo"
                        }">${saldo.monedaSimbolo}${saldo.saldo.toLocaleString(
                          "es-GT",
                          { minimumFractionDigits: 2 }
                        )}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  `
                    )
                    .join("")}
                `
                : ""
            }
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
      key: "tipo",
      header: "Tipo",
      render: (item: MovimientoReporte) => (
        <Badge variant={item.tipo === "Ingreso" ? "success" : "danger"}>
          {item.tipo}
        </Badge>
      ),
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

  // Helper para formatear moneda
  const formatMonto = (monto: number, simbolo?: string) => {
    const sym = simbolo || datosAnaliticos?.monedaSeleccionada?.simbolo || "$";
    return `${sym}${monto.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
    })}`;
  };

  // Calcular el máximo para la barra de progreso
  const maxMensual = useMemo(() => {
    if (!datosAnaliticos) return 0;
    return Math.max(
      ...datosAnaliticos.datosMensuales.map((d) =>
        Math.max(d.ingresos, d.egresos)
      )
    );
  }, [datosAnaliticos]);

  return (
    <div className="p-4 md:p-5 lg:p-6 max-w-7xl mx-auto">
      {/* Selector de Reportes - Diseño Compacto */}
      {!mostrarResultados && (
        <div className="mb-8">
          {/* Header Principal */}
          <div className="mb-6 pb-4 border-b border-[#dceaef]">
            <h1 className="text-2xl md:text-3xl font-bold text-[#203b46] mb-1">
              📊 Generador de Reportes
            </h1>
            <p className="text-sm md:text-base text-[#73a9bf]">
              Selecciona el tipo de análisis que necesitas para tu gestión
              financiera
            </p>
          </div>

          {/* Sección 1: Análisis Detallados */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1 h-6 bg-gradient-to-b from-[#2ba193] to-[#238a7e] rounded"></div>
              <h2 className="text-sm font-semibold text-[#40768c] uppercase tracking-wider">
                Análisis Detallados
              </h2>
            </div>
            <p className="text-xs text-[#73a9bf] mb-3 px-1">
              Reportes con filtros avanzados y visualización de datos
            </p>

            {/* Grid de Reportes - Compacto */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Reporte de Movimientos */}
              <button
                onClick={() => {
                  setVistaActiva("movimientos");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "movimientos"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📋</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "movimientos"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Movimientos
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "movimientos"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Lista de ingresos y egresos con filtros
                </p>
              </button>

              {/* Reporte Comparativo */}
              <button
                onClick={() => {
                  setVistaActiva("comparativo");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "comparativo"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📈</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "comparativo"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Análisis Mensual
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "comparativo"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Comparativa ingresos vs egresos por mes
                </p>
              </button>

              {/* Reporte por Sociedades */}
              <button
                onClick={() => {
                  setVistaActiva("sociedades");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "sociedades"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">👥</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "sociedades"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Por Sociedad
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "sociedades"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Recaudación por Hombres, Mujeres, etc.
                </p>
              </button>

              {/* Reporte por Tipo de Ingreso */}
              <button
                onClick={() => {
                  setVistaActiva("tipoIngreso");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "tipoIngreso"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💰</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "tipoIngreso"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Tipo Ingreso
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "tipoIngreso"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Diezmos, Ofrendas, Primicias, etc.
                </p>
              </button>

              {/* Reporte por Tipo de Gasto */}
              <button
                onClick={() => {
                  setVistaActiva("tipoGasto");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "tipoGasto"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💸</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "tipoGasto"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Tipo Gasto
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "tipoGasto"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Servicios, Mantenimiento, etc.
                </p>
              </button>

              {/* Reporte de Cajas */}
              <button
                onClick={() => {
                  setVistaActiva("cajas");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "cajas"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏦</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "cajas" ? "text-white" : "text-[#203b46]"
                    }`}
                  >
                    Estado Cajas
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "cajas" ? "text-white/85" : "text-[#73a9bf]"
                  }`}
                >
                  Saldos por caja y moneda
                </p>
              </button>

              {/* Reporte de Saldos Actuales */}
              <button
                onClick={() => {
                  setVistaActiva("saldosActuales");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "saldosActuales"
                    ? "bg-gradient-to-br from-[#2ba193] to-[#238a7e] text-white shadow-lg ring-2 ring-[#2ba193]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#2ba193] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">💰</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "saldosActuales"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Saldos Actuales
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "saldosActuales"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Estado actual de todas las cajas
                </p>
              </button>
            </div>
          </div>

          {/* Sección 2: Reportes de Filiales */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1 h-6 bg-gradient-to-b from-[#e0451f] to-[#c73a15] rounded"></div>
              <h2 className="text-sm font-semibold text-[#40768c] uppercase tracking-wider">
                Filiales & Diezmos
              </h2>
            </div>
            <p className="text-xs text-[#73a9bf] mb-3 px-1">
              Reportes específicos para iglesias filiales y gestión de diezmos
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Reporte de Diezmos por Filial */}
              <button
                onClick={() => {
                  setVistaActiva("diezmosFiliales");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "diezmosFiliales"
                    ? "bg-gradient-to-br from-[#e0451f] to-[#c73a15] text-white shadow-lg ring-2 ring-[#e0451f]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#e0451f] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⛪</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "diezmosFiliales"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Diezmos Filiales
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "diezmosFiliales"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Aportes de iglesias filiales
                </p>
              </button>

              {/* Reporte de Cajas por Filial */}
              <button
                onClick={() => {
                  setVistaActiva("cajaFiliales");
                  setMostrarResultados(false);
                }}
                className={`group text-left p-4 rounded-xl transition-all duration-150 ${
                  vistaActiva === "cajaFiliales"
                    ? "bg-gradient-to-br from-[#e0451f] to-[#c73a15] text-white shadow-lg ring-2 ring-[#e0451f]/30"
                    : "bg-white border border-[#dceaef] hover:border-[#e0451f] hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📦</span>
                  <h3
                    className={`text-sm font-bold ${
                      vistaActiva === "cajaFiliales"
                        ? "text-white"
                        : "text-[#203b46]"
                    }`}
                  >
                    Finanzas Filiales
                  </h3>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    vistaActiva === "cajaFiliales"
                      ? "text-white/85"
                      : "text-[#73a9bf]"
                  }`}
                >
                  Balance consolidado por iglesia
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb cuando hay resultados */}
      {mostrarResultados && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setMostrarResultados(false)}
            className="text-sm text-[#2ba193] hover:underline flex items-center gap-1"
          >
            ← Volver a Reportes
          </button>
          <span className="text-[#dceaef]">|</span>
          <span className="text-sm text-[#73a9bf]">
            {vistaActiva === "movimientos" && "Movimientos Detallados"}
            {vistaActiva === "comparativo" && "Análisis Mensual"}
            {vistaActiva === "sociedades" && "Ingresos por Sociedad"}
            {vistaActiva === "tipoIngreso" && "Clasificación de Ingresos"}
            {vistaActiva === "tipoGasto" && "Clasificación de Gastos"}
            {vistaActiva === "cajas" && "Estado de Cajas"}
            {vistaActiva === "saldosActuales" && "Saldos Actuales de Cajas"}
            {vistaActiva === "diezmosFiliales" && "Diezmos de Filiales"}
            {vistaActiva === "cajaFiliales" && "Caja General de Filiales"}
          </span>
        </div>
      )}

      {/* Panel de Filtros - Movimientos */}
      {vistaActiva === "movimientos" && !mostrarResultados && (
        <Card className="mb-4 md:mb-5">
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4 flex items-center gap-2">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5">
            <Combobox
              label="Tipo de Reporte"
              options={tipoReporteOptions}
              value={filtros.tipoReporte}
              onChange={(value) => handleComboboxChange("tipoReporte", value)}
              searchable={false}
            />
            <Combobox
              label="Período"
              options={periodoOptions}
              value={filtros.periodo}
              onChange={(value) => handleComboboxChange("periodo", value)}
              searchable={false}
            />
            <Combobox
              label="Caja"
              options={cajaOptions}
              value={filtros.cajaId}
              onChange={(value) => handleComboboxChange("cajaId", value)}
              placeholder="Todas las cajas"
              clearable
              searchable={false}
            />
            <Combobox
              label="Moneda"
              options={monedaOptions}
              value={filtros.monedaId}
              onChange={(value) => handleComboboxChange("monedaId", value)}
              placeholder="Todas las monedas"
              clearable
              searchable={false}
            />
          </div>

          {filtros.periodo === "personalizado" && (
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
              <Combobox
                label="Sociedad"
                options={sociedadOptions}
                value={filtros.sociedadId}
                onChange={(value) => handleComboboxChange("sociedadId", value)}
                placeholder="Todas las sociedades"
                clearable
                searchable={false}
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
      )}

      {/* Panel de Controles Unificado - Filtros y Reportes */}
      {vistaActiva !== "movimientos" &&
        vistaActiva !== "diezmosFiliales" &&
        vistaActiva !== "cajaFiliales" &&
        !mostrarResultados && (
          <Card className="mb-4 md:mb-5">
            {/* Configurar Análisis - para Comparativo y otros */}
            {vistaActiva !== "saldosActuales" && (
              <>
                <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4 flex items-center gap-2">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Configurar Análisis
                </h3>

                {/* Selector de modo: Año o Rango de Fechas */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() =>
                      setFiltrosAnaliticos((prev) => ({
                        ...prev,
                        modoFiltro: "anio",
                      }))
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtrosAnaliticos.modoFiltro === "anio"
                        ? "bg-[#40768c] text-white"
                        : "bg-[#eef4f7] text-[#40768c] hover:bg-[#dceaef]"
                    }`}
                  >
                    Por Año
                  </button>
                  <button
                    onClick={() =>
                      setFiltrosAnaliticos((prev) => ({
                        ...prev,
                        modoFiltro: "rango",
                      }))
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtrosAnaliticos.modoFiltro === "rango"
                        ? "bg-[#40768c] text-white"
                        : "bg-[#eef4f7] text-[#40768c] hover:bg-[#dceaef]"
                    }`}
                  >
                    Rango de Fechas
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-5">
                  {/* Mostrar selector de Año si está en modo "anio" */}
                  {filtrosAnaliticos.modoFiltro === "anio" && (
                    <Combobox
                      label="Año"
                      options={anioOptions}
                      value={filtrosAnaliticos.anio.toString()}
                      onChange={(value) =>
                        setFiltrosAnaliticos((prev) => ({
                          ...prev,
                          anio:
                            parseInt(value) ||
                            obtenerFechaElSalvador().getFullYear(),
                        }))
                      }
                      searchable={false}
                    />
                  )}

                  {/* Mostrar selectores de fecha si está en modo "rango" */}
                  {filtrosAnaliticos.modoFiltro === "rango" && (
                    <>
                      <Input
                        label="Fecha Inicio"
                        type="date"
                        value={filtrosAnaliticos.fechaInicio}
                        onChange={(e) =>
                          setFiltrosAnaliticos((prev) => ({
                            ...prev,
                            fechaInicio: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Fecha Fin"
                        type="date"
                        value={filtrosAnaliticos.fechaFin}
                        onChange={(e) =>
                          setFiltrosAnaliticos((prev) => ({
                            ...prev,
                            fechaFin: e.target.value,
                          }))
                        }
                      />
                    </>
                  )}

                  <Combobox
                    label="Moneda"
                    options={monedaOptions}
                    value={filtrosAnaliticos.monedaId}
                    onChange={(value) =>
                      setFiltrosAnaliticos((prev) => ({
                        ...prev,
                        monedaId: value,
                      }))
                    }
                    placeholder="Todas las monedas"
                    clearable
                    searchable={false}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerarReporteAnalitico}
                    disabled={
                      isPending ||
                      (filtrosAnaliticos.modoFiltro === "rango" &&
                        (!filtrosAnaliticos.fechaInicio ||
                          !filtrosAnaliticos.fechaFin))
                    }
                  >
                    {isPending ? (
                      "Analizando..."
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
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Generar Análisis
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Reporte de Saldos - para Saldos Actuales */}
            {vistaActiva === "saldosActuales" && (
              <>
                <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4 flex items-center gap-2">
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
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Saldos Actuales
                </h3>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerarReporteSaldosActuales}
                    disabled={isPending}
                  >
                    {isPending ? (
                      "Cargando..."
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Ver Saldos Actuales
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

      {/* Resultados - Movimientos */}
      {vistaActiva === "movimientos" && mostrarResultados && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-5">
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

      {/* Resultados - Comparativo Mensual */}
      {vistaActiva === "comparativo" &&
        mostrarResultados &&
        datosAnaliticos && (
          <>
            {/* Resumen anual */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              <Card>
                <div className="text-center">
                  <p className="text-xs text-[#73a9bf] uppercase mb-1">
                    Total Ingresos {obtenerLabelPeriodo()}
                  </p>
                  <p className="text-2xl font-bold text-[#2ba193]">
                    {formatMonto(datosAnaliticos.totales.ingresos)}
                  </p>
                  <p className="text-xs text-[#73a9bf]">
                    {datosAnaliticos.totales.cantidadIngresos} registros
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs text-[#73a9bf] uppercase mb-1">
                    Total Egresos {obtenerLabelPeriodo()}
                  </p>
                  <p className="text-2xl font-bold text-[#e0451f]">
                    {formatMonto(datosAnaliticos.totales.egresos)}
                  </p>
                  <p className="text-xs text-[#73a9bf]">
                    {datosAnaliticos.totales.cantidadEgresos} registros
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs text-[#73a9bf] uppercase mb-1">
                    Balance {obtenerLabelPeriodo()}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      datosAnaliticos.totales.balance >= 0
                        ? "text-[#2ba193]"
                        : "text-[#e0451f]"
                    }`}
                  >
                    {formatMonto(datosAnaliticos.totales.balance)}
                  </p>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <p className="text-xs text-[#73a9bf] uppercase mb-1">
                    Moneda
                  </p>
                  <p className="text-2xl font-bold text-[#40768c]">
                    {datosAnaliticos.monedaSeleccionada?.codigo || "Todas"}
                  </p>
                </div>
              </Card>
            </div>

            {/* Gráfica de barras */}
            <Card className="mb-5">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
                📊 Tendencia Mensual {obtenerLabelPeriodo()}
              </h3>
              <div className="space-y-3">
                {datosAnaliticos.datosMensuales.map((mes) => (
                  <div key={mes.mes} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#305969] w-24">
                        {mes.nombreMes.substring(0, 3)}
                      </span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-[#2ba193]">
                          +{formatMonto(mes.ingresos)}
                        </span>
                        <span className="text-[#e0451f]">
                          -{formatMonto(mes.egresos)}
                        </span>
                        <span
                          className={`font-semibold ${
                            mes.balance >= 0
                              ? "text-[#2ba193]"
                              : "text-[#e0451f]"
                          }`}
                        >
                          = {formatMonto(mes.balance)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div
                        className="bg-[#2ba193] rounded-l"
                        style={{
                          width: `${
                            maxMensual > 0
                              ? (mes.ingresos / maxMensual) * 50
                              : 0
                          }%`,
                        }}
                      />
                      <div
                        className="bg-[#e0451f] rounded-r"
                        style={{
                          width: `${
                            maxMensual > 0 ? (mes.egresos / maxMensual) * 50 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

      {/* Resultados - Por Sociedad */}
      {vistaActiva === "sociedades" && mostrarResultados && datosAnaliticos && (
        <Card>
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
            👥 Ingresos por Sociedad - {obtenerLabelPeriodo()}
          </h3>
          {datosAnaliticos.porSociedad.length === 0 ? (
            <p className="text-center py-8 text-[#73a9bf]">
              No hay datos para mostrar
            </p>
          ) : (
            <div className="space-y-3">
              {datosAnaliticos.porSociedad
                .sort((a, b) => b.total - a.total)
                .map((soc, idx) => {
                  const maxTotal = Math.max(
                    ...datosAnaliticos.porSociedad.map((s) => s.total)
                  );
                  return (
                    <div
                      key={soc.id}
                      className="p-3 bg-[#f8fbfc] rounded-lg border border-[#eef4f7]"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#40768c]">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-[#305969]">
                            {soc.nombre}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#2ba193]">
                            {formatMonto(soc.total)}
                          </p>
                          <p className="text-xs text-[#73a9bf]">
                            {soc.cantidad} registros
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-[#dceaef] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2ba193] rounded-full transition-all"
                          style={{
                            width: `${
                              maxTotal > 0 ? (soc.total / maxTotal) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}

      {/* Resultados - Por Tipo de Ingreso (Cajas Virtuales) */}
      {vistaActiva === "tipoIngreso" &&
        mostrarResultados &&
        datosAnaliticos && (
          <Card>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-2">
              💰 Ingresos por Tipo - {obtenerLabelPeriodo()}
            </h3>
            <p className="text-xs text-[#73a9bf] mb-4">
              Vista consolidada de ingresos agrupados por tipo (cajas
              virtuales), con desglose por sociedad
            </p>
            {datosAnaliticos.porTipoIngreso.length === 0 ? (
              <p className="text-center py-8 text-[#73a9bf]">
                No hay datos para mostrar
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {datosAnaliticos.porTipoIngreso
                  .sort((a, b) => b.total - a.total)
                  .map((tipo) => {
                    const porcentaje =
                      datosAnaliticos.totales.ingresos > 0
                        ? (tipo.total / datosAnaliticos.totales.ingresos) * 100
                        : 0;
                    return (
                      <div
                        key={tipo.id}
                        className="p-4 bg-gradient-to-r from-[#eef4f7] to-white rounded-lg border border-[#dceaef]"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-[#305969]">
                            💵 {tipo.nombre}
                          </h4>
                          <Badge variant="success">
                            {porcentaje.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-xl font-bold text-[#2ba193]">
                          {formatMonto(tipo.total)}
                        </p>
                        <p className="text-xs text-[#73a9bf] mb-2">
                          {tipo.cantidad} registros
                        </p>
                        <div className="h-2 bg-[#dceaef] rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full bg-[#2ba193] rounded-full"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>

                        {/* Desglose por sociedad */}
                        {tipo.porSociedad && tipo.porSociedad.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#dceaef]">
                            <p className="text-xs font-medium text-[#73a9bf] mb-2">
                              Desglose por origen:
                            </p>
                            <div className="space-y-1">
                              {tipo.porSociedad.map((soc) => {
                                const socPorcentaje =
                                  tipo.total > 0
                                    ? (soc.total / tipo.total) * 100
                                    : 0;
                                return (
                                  <div
                                    key={soc.id}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span className="text-[#40768c]">
                                      {soc.nombre}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-[#305969]">
                                        {formatMonto(soc.total)}
                                      </span>
                                      <span className="text-xs text-[#73a9bf]">
                                        ({socPorcentaje.toFixed(0)}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        )}

      {/* Resultados - Por Tipo de Gasto */}
      {vistaActiva === "tipoGasto" && mostrarResultados && datosAnaliticos && (
        <Card>
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
            💸 Egresos por Tipo - {obtenerLabelPeriodo()}
          </h3>
          {datosAnaliticos.porTipoGasto.length === 0 ? (
            <p className="text-center py-8 text-[#73a9bf]">
              No hay datos para mostrar
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datosAnaliticos.porTipoGasto
                .sort((a, b) => b.total - a.total)
                .map((tipo) => {
                  const porcentaje =
                    datosAnaliticos.totales.egresos > 0
                      ? (tipo.total / datosAnaliticos.totales.egresos) * 100
                      : 0;
                  return (
                    <div
                      key={tipo.id}
                      className="p-4 bg-gradient-to-r from-[#fcf0ed] to-white rounded-lg border border-[#f5d4cc]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#305969]">
                          {tipo.nombre}
                        </h4>
                        <Badge variant="danger">{porcentaje.toFixed(1)}%</Badge>
                      </div>
                      <p className="text-xl font-bold text-[#e0451f]">
                        {formatMonto(tipo.total)}
                      </p>
                      <p className="text-xs text-[#73a9bf]">
                        {tipo.cantidad} registros
                      </p>
                      <div className="h-2 bg-[#f5d4cc] rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-[#e0451f] rounded-full"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}

      {/* Resultados - Por Caja */}
      {vistaActiva === "cajas" && mostrarResultados && datosAnaliticos && (
        <Card>
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
            🏦 Movimientos por Caja - {obtenerLabelPeriodo()}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#dceaef]">
                  <th className="text-left p-3 text-xs font-semibold text-[#40768c] uppercase">
                    Caja
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                    Ingresos
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                    Egresos
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {datosAnaliticos.porCaja.map((caja) => (
                  <tr
                    key={caja.id}
                    className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                  >
                    <td className="p-3 font-medium text-[#305969]">
                      {caja.nombre}
                    </td>
                    <td className="p-3 text-right text-[#2ba193] font-semibold">
                      {formatMonto(caja.ingresos)}
                    </td>
                    <td className="p-3 text-right text-[#e0451f] font-semibold">
                      {formatMonto(caja.egresos)}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        caja.balance >= 0 ? "text-[#2ba193]" : "text-[#e0451f]"
                      }`}
                    >
                      {formatMonto(caja.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#eef4f7] font-bold">
                  <td className="p-3 text-[#305969]">TOTAL</td>
                  <td className="p-3 text-right text-[#2ba193]">
                    {formatMonto(datosAnaliticos.totales.ingresos)}
                  </td>
                  <td className="p-3 text-right text-[#e0451f]">
                    {formatMonto(datosAnaliticos.totales.egresos)}
                  </td>
                  <td
                    className={`p-3 text-right ${
                      datosAnaliticos.totales.balance >= 0
                        ? "text-[#2ba193]"
                        : "text-[#e0451f]"
                    }`}
                  >
                    {formatMonto(datosAnaliticos.totales.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
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

              {detalleSeleccionado.usuario &&
                usuarioActual?.rol?.nombre === "Admin" && (
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

      {/* Vista: Diezmos Filiales - Panel de Filtros */}
      {vistaActiva === "diezmosFiliales" && !mostrarResultados && (
        <Card className="mb-4 md:mb-5">
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4 flex items-center gap-2">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Configurar Reporte de Diezmos
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-5">
            <Combobox
              label="Año"
              options={anioOptions}
              value={filtrosDiezmosFiliales.anio.toString()}
              onChange={(value) =>
                setFiltrosDiezmosFiliales({
                  ...filtrosDiezmosFiliales,
                  anio:
                    parseInt(value) || obtenerFechaElSalvador().getFullYear(),
                })
              }
              searchable={false}
            />
            <Combobox
              label="País"
              options={[
                { value: "", label: "Todos los países" },
                ...paisOptions,
              ]}
              value={filtrosDiezmosFiliales.paisId}
              onChange={(value) =>
                setFiltrosDiezmosFiliales({
                  ...filtrosDiezmosFiliales,
                  paisId: value,
                })
              }
              placeholder="Todos los países"
              clearable
              searchable={false}
            />
            <Combobox
              label="Moneda"
              options={[
                { value: "", label: "Todas las monedas" },
                ...monedaOptions,
              ]}
              value={filtrosDiezmosFiliales.monedaId}
              onChange={(value) =>
                setFiltrosDiezmosFiliales({
                  ...filtrosDiezmosFiliales,
                  monedaId: value,
                })
              }
              placeholder="Todas las monedas"
              clearable
              searchable={false}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerarReporteDiezmosFiliales}
              disabled={isPending}
            >
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Vista: Diezmos Filiales - Resultados */}
      {vistaActiva === "diezmosFiliales" && datosDiezmosFiliales && (
        <>
          {/* Resumen General */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-5">
            <Card>
              <div className="text-center">
                <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                  Total Diezmos
                </h4>
                <p className="text-2xl font-bold text-[#2ba193]">
                  $
                  {datosDiezmosFiliales.total.toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                  Registros
                </h4>
                <p className="text-2xl font-bold text-[#203b46]">
                  {datosDiezmosFiliales.cantidadRegistros}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                  Filiales Activas
                </h4>
                <p className="text-2xl font-bold text-[#203b46]">
                  {datosDiezmosFiliales.porFilial.length}
                </p>
              </div>
            </Card>
          </div>

          {/* Diezmos por Filial */}
          <Card className="mb-4 md:mb-5">
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
              ⛪ Diezmos por Iglesia Filial
            </h3>
            {datosDiezmosFiliales.porFilial.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fbfc]">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                        Iglesia
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                        Pastor
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                        País
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-[#40768c]">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-[#40768c]">
                        Registros
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosDiezmosFiliales.porFilial.map((filial: any) => (
                      <tr
                        key={filial.id}
                        className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                      >
                        <td className="font-medium py-3 px-4 text-[#203b46]">
                          {filial.nombre}
                        </td>
                        <td className="py-3 px-4 text-[#305969]">
                          {filial.pastor}
                        </td>
                        <td className="py-3 px-4 text-[#305969]">
                          {filial.pais}
                        </td>
                        <td className="text-right font-semibold py-3 px-4 text-[#2ba193]">
                          $
                          {filial.total.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center py-3 px-4 text-[#305969]">
                          {filial.cantidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#73a9bf] text-center py-8">
                No hay datos de diezmos para mostrar
              </p>
            )}
          </Card>

          {/* Diezmos por País */}
          {datosDiezmosFiliales.porPais.length > 0 && (
            <Card className="mb-4 md:mb-5">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
                🌎 Diezmos por País
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fbfc]">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                        País
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-[#40768c]">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-[#40768c]">
                        Registros
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosDiezmosFiliales.porPais.map((pais: any) => (
                      <tr
                        key={pais.id}
                        className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                      >
                        <td className="font-medium py-3 px-4 text-[#203b46]">
                          {pais.nombre}
                        </td>
                        <td className="text-right font-semibold py-3 px-4 text-[#2ba193]">
                          $
                          {pais.total.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center py-3 px-4 text-[#305969]">
                          {pais.cantidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Diezmos por Mes */}
          <Card>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
              📅 Diezmos por Mes - {datosDiezmosFiliales.anio}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fbfc]">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                      Mes
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-[#40768c]">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-[#40768c]">
                      Registros
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosDiezmosFiliales.porMes
                    .filter((m: any) => m.cantidad > 0)
                    .map((mes: any) => (
                      <tr
                        key={mes.mes}
                        className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                      >
                        <td className="font-medium capitalize py-3 px-4 text-[#203b46]">
                          {mes.nombreMes}
                        </td>
                        <td className="text-right font-semibold py-3 px-4 text-[#2ba193]">
                          $
                          {mes.total.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center py-3 px-4 text-[#305969]">
                          {mes.cantidad}
                        </td>
                      </tr>
                    ))}
                  {datosDiezmosFiliales.porMes.filter(
                    (m: any) => m.cantidad > 0
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8 text-[#73a9bf]"
                      >
                        No hay datos de diezmos por mes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Vista: Caja General Filiales - Panel de Filtros */}
      {vistaActiva === "cajaFiliales" && !mostrarResultados && (
        <Card className="mb-4 md:mb-5">
          <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4 flex items-center gap-2">
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Configurar Reporte de Caja
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
            <Combobox
              label="Año"
              options={anioOptions}
              value={filtrosCajaFiliales.anio.toString()}
              onChange={(value) =>
                setFiltrosCajaFiliales({
                  ...filtrosCajaFiliales,
                  anio:
                    parseInt(value) || obtenerFechaElSalvador().getFullYear(),
                })
              }
              searchable={false}
            />
            <Combobox
              label="Moneda"
              options={[
                { value: "", label: "Todas las monedas" },
                ...monedaOptions,
              ]}
              value={filtrosCajaFiliales.monedaId}
              onChange={(value) =>
                setFiltrosCajaFiliales({
                  ...filtrosCajaFiliales,
                  monedaId: value,
                })
              }
              placeholder="Todas las monedas"
              clearable
              searchable={false}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerarReporteCajaFiliales}
              disabled={isPending}
            >
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Vista: Caja General Filiales - Resultados */}
      {vistaActiva === "cajaFiliales" && datosCajaFiliales && (
        <>
          {/* Resumen de Saldos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-5">
            {datosCajaFiliales.saldos.map((saldo: any) => (
              <Card key={saldo.monedaId}>
                <div className="text-center">
                  <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                    Saldo {saldo.monedaCodigo}
                  </h4>
                  <p className="text-2xl font-bold text-[#2ba193]">
                    {saldo.monedaSimbolo}
                    {saldo.saldo.toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-[#73a9bf] mt-1">
                    Diezmos: {saldo.monedaSimbolo}
                    {saldo.ingresos.toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumen de Egresos */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
            <Card>
              <div className="text-center">
                <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                  Total Egresos {datosCajaFiliales.anio}
                </h4>
                <p className="text-2xl font-bold text-[#ee5f40]">
                  $
                  {datosCajaFiliales.totalEgresos.toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                  Cantidad de Egresos
                </h4>
                <p className="text-2xl font-bold text-[#203b46]">
                  {datosCajaFiliales.cantidadEgresos}
                </p>
              </div>
            </Card>
          </div>

          {/* Egresos por Tipo de Gasto */}
          {datosCajaFiliales.porTipoGasto.length > 0 && (
            <Card className="mb-4 md:mb-5">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
                📋 Egresos por Tipo de Gasto
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fbfc]">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                        Tipo de Gasto
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-[#40768c]">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-[#40768c]">
                        Cantidad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosCajaFiliales.porTipoGasto.map((tipo: any) => (
                      <tr
                        key={tipo.id}
                        className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                      >
                        <td className="font-medium py-3 px-4 text-[#203b46]">
                          {tipo.nombre}
                        </td>
                        <td className="text-right font-semibold py-3 px-4 text-[#ee5f40]">
                          $
                          {tipo.total.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center py-3 px-4 text-[#305969]">
                          {tipo.cantidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Egresos por Mes */}
          <Card>
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 md:mb-4">
              📅 Egresos por Mes - {datosCajaFiliales.anio}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fbfc]">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-[#40768c]">
                      Mes
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-[#40768c]">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-[#40768c]">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosCajaFiliales.porMes
                    .filter((m: any) => m.cantidad > 0)
                    .map((mes: any) => (
                      <tr
                        key={mes.mes}
                        className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                      >
                        <td className="font-medium capitalize py-3 px-4 text-[#203b46]">
                          {mes.nombreMes}
                        </td>
                        <td className="text-right font-semibold py-3 px-4 text-[#ee5f40]">
                          $
                          {mes.total.toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="text-center py-3 px-4 text-[#305969]">
                          {mes.cantidad}
                        </td>
                      </tr>
                    ))}
                  {datosCajaFiliales.porMes.filter((m: any) => m.cantidad > 0)
                    .length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8 text-[#73a9bf]"
                      >
                        No hay egresos registrados este año
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Vista: Saldos Actuales - Resultados */}
      {vistaActiva === "saldosActuales" && datosSaldosActuales && (
        <>
          {/* Resumen General por Moneda */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
              📊 Resumen de Saldos por Moneda
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Object.entries(datosSaldosActuales.totalesPorMoneda).map(
                ([monedaId, datos]: [string, any]) => {
                  const moneda = datosSaldosActuales.monedas.find(
                    (m: any) => m.id === monedaId
                  );
                  return (
                    <Card key={monedaId}>
                      <div className="text-center">
                        <h4 className="text-sm font-medium text-[#73a9bf] mb-2">
                          {moneda?.codigo}
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-[#73a9bf]">
                              Ingresos Totales
                            </p>
                            <p className="text-lg font-bold text-[#2ba193]">
                              {moneda?.simbolo}
                              {datos.ingresos.toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#73a9bf]">
                              Egresos Totales
                            </p>
                            <p className="text-lg font-bold text-[#e0451f]">
                              {moneda?.simbolo}
                              {datos.egresos.toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div className="border-t border-[#dceaef] pt-2">
                            <p className="text-xs text-[#73a9bf]">
                              Saldo Final
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                datos.saldo >= 0
                                  ? "text-[#2ba193]"
                                  : "text-[#e0451f]"
                              }`}
                            >
                              {moneda?.simbolo}
                              {datos.saldo.toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                }
              )}
            </div>
          </div>

          {/* Barra de Control - Exportación */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide">
                📊 Reporte de Saldos Actuales
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportarSaldosActualesExcel}
                >
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
                  Exportar Excel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportarSaldosActualesPDF}
                >
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
                  Exportar PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* Cajas Generales */}
          {datosSaldosActuales.cajasGenerales.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
                🏛️ Cajas Generales
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dceaef]">
                      <th className="text-left p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Caja
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Moneda
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Ingresos
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Egresos
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosSaldosActuales.cajasGenerales.map((caja: any) =>
                      caja.saldos.map((saldo: any) => (
                        <tr
                          key={`${caja.id}-${saldo.monedaId}`}
                          className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                        >
                          <td className="p-3 font-medium text-[#305969]">
                            {caja.nombre}
                          </td>
                          <td className="p-3 text-sm text-[#73a9bf]">
                            {saldo.monedaCodigo}
                          </td>
                          <td className="p-3 text-right text-[#2ba193] font-semibold">
                            {saldo.monedaSimbolo}
                            {saldo.ingresos.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3 text-right text-[#e0451f] font-semibold">
                            {saldo.monedaSimbolo}
                            {saldo.egresos.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              saldo.saldo >= 0
                                ? "text-[#2ba193]"
                                : "text-[#e0451f]"
                            }`}
                          >
                            {saldo.monedaSimbolo}
                            {saldo.saldo.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Cajas de Sociedades */}
          {datosSaldosActuales.cajasSociedades.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
                👥 Cajas de Sociedades
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dceaef]">
                      <th className="text-left p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Sociedad
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Moneda
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Ingresos
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Egresos
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#40768c] uppercase">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosSaldosActuales.cajasSociedades.map((caja: any) =>
                      caja.saldos.map((saldo: any) => (
                        <tr
                          key={`${caja.id}-${saldo.monedaId}`}
                          className="border-b border-[#eef4f7] hover:bg-[#f8fbfc]"
                        >
                          <td className="p-3 font-medium text-[#305969]">
                            {caja.sociedad?.nombre || caja.nombre}
                          </td>
                          <td className="p-3 text-sm text-[#73a9bf]">
                            {saldo.monedaCodigo}
                          </td>
                          <td className="p-3 text-right text-[#2ba193] font-semibold">
                            {saldo.monedaSimbolo}
                            {saldo.ingresos.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3 text-right text-[#e0451f] font-semibold">
                            {saldo.monedaSimbolo}
                            {saldo.egresos.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              saldo.saldo >= 0
                                ? "text-[#2ba193]"
                                : "text-[#e0451f]"
                            }`}
                          >
                            {saldo.monedaSimbolo}
                            {saldo.saldo.toLocaleString("es-GT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Cajas Virtuales */}
          {datosSaldosActuales.cajasVirtuales.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-4">
                💻 Cajas Virtuales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {datosSaldosActuales.cajasVirtuales.map((cajaVirtual: any) => (
                  <div
                    key={cajaVirtual.id}
                    className="border border-[#dceaef] rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-[#305969] mb-3">
                      {cajaVirtual.nombre}
                    </h4>
                    <p className="text-xs text-[#73a9bf] mb-3">
                      {cajaVirtual.descripcion}
                    </p>
                    <div className="space-y-2">
                      {cajaVirtual.saldos.map((saldo: any) => (
                        <div
                          key={saldo.monedaId}
                          className="flex justify-between items-center py-2 border-b border-[#eef4f7] last:border-0"
                        >
                          <div>
                            <p className="text-xs text-[#73a9bf]">
                              {saldo.monedaCodigo}
                            </p>
                            <p className="text-sm text-[#305969] font-medium">
                              {saldo.monedaSimbolo}
                              {saldo.saldo.toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#2ba193]">
                              +
                              {saldo.ingresos.toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-xs text-[#e0451f]">
                              -
                              {saldo.egresos.toLocaleString("es-GT", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
