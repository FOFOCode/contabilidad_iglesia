"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";

interface Moneda {
  id: string;
  codigo: string;
  simbolo: string;
  esPrincipal: boolean;
}

interface SaldoCaja {
  monedaId: string;
  monedaCodigo: string;
  monedaSimbolo: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

interface CajaData {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  esGeneral: boolean;
  // true = tiene sociedad/tipoIngreso → su dinero ya está físicamente en Caja General
  esSubcaja: boolean;
  esVirtual: boolean;
  sociedad: { nombre: string } | null;
  tipoIngreso: { nombre: string } | null;
  saldos: SaldoCaja[];
}

interface CajasClientProps {
  cajas: CajaData[];
  monedas: Moneda[];
}

// ─── Componente de tarjeta individual de caja ─────────────────────────────────
function CajaCard({
  caja,
  isExpanded,
  onToggle,
  formatMonto,
}: {
  caja: CajaData;
  isExpanded: boolean;
  onToggle: () => void;
  formatMonto: (monto: number, simbolo: string) => string;
}) {
  const hasSaldos = caja.saldos.some((s) => s.ingresos > 0 || s.egresos > 0);

  let cardClass = "hover:shadow-lg transition-shadow";
  if (caja.esVirtual) {
    cardClass =
      "hover:shadow-lg transition-shadow border-2 border-dashed border-[#9775c4] bg-gradient-to-br from-[#f8f3ff] to-white";
  } else if (caja.esSubcaja) {
    cardClass =
      "hover:shadow-lg transition-shadow border border-[#ffd08a] bg-[#fffbf2]";
  }

  return (
    <Card className={cardClass}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#203b46]">{caja.nombre}</h3>
            {caja.esVirtual && (
              <Badge variant="info" size="sm">
                Virtual
              </Badge>
            )}
          </div>
          {caja.descripcion && (
            <p className="text-sm text-[#73a9bf] mt-1">{caja.descripcion}</p>
          )}
        </div>
        {!caja.esVirtual && (
          <Badge variant={caja.activa ? "success" : "default"}>
            {caja.activa ? "Activa" : "Inactiva"}
          </Badge>
        )}
      </div>

      {/* Tags de asignación */}
      {!caja.esVirtual && (
        <div className="flex flex-wrap gap-1 mb-3">
          {caja.sociedad && (
            <Badge variant="info">{caja.sociedad.nombre}</Badge>
          )}
          {caja.tipoIngreso && (
            <Badge variant="warning">{caja.tipoIngreso.nombre}</Badge>
          )}
          {!caja.sociedad && !caja.tipoIngreso && (
            <span className="text-xs text-[#73a9bf] italic">General</span>
          )}
        </div>
      )}

      {/* Indicador de subcaja */}
      {caja.esSubcaja && (
        <div className="bg-[#fff4e6] border border-[#ffa94d] rounded px-3 py-2 mb-3">
          <p className="text-xs text-[#c77700] font-medium">
            📊 Seguimiento — dinero acumulado en Caja General
          </p>
          <p className="text-xs text-[#a36400] mt-0.5">
            Este saldo ya está incluido en el total real de la iglesia.
          </p>
        </div>
      )}

      {/* Saldos por moneda */}
      {hasSaldos ? (
        <div className="space-y-2">
          {caja.saldos
            .filter((s) => s.ingresos > 0 || s.egresos > 0)
            .map((saldo) => (
              <div key={saldo.monedaId} className="bg-[#eef4f7] rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#40768c]">
                    {saldo.monedaCodigo}
                  </span>
                  <span
                    className={`font-bold ${
                      saldo.saldo >= 0 ? "text-[#2ba193]" : "text-[#e0451f]"
                    }`}
                  >
                    {formatMonto(saldo.saldo, saldo.monedaSimbolo)}
                  </span>
                </div>
                {isExpanded && (
                  <div className="flex justify-between text-xs mt-1 text-[#73a9bf]">
                    <span>
                      + {formatMonto(saldo.ingresos, saldo.monedaSimbolo)}
                    </span>
                    <span>
                      - {formatMonto(saldo.egresos, saldo.monedaSimbolo)}
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-[#eef4f7] rounded-lg p-3 text-center">
          <span className="text-sm text-[#73a9bf]">Sin movimientos</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#dceaef]">
        <button
          onClick={onToggle}
          className="text-xs text-[#40768c] hover:underline"
        >
          {isExpanded ? "Ver menos" : "Ver detalle"}
        </button>
        <Link href={`/dashboard/cajas/${caja.id}`}>
          <Button size="sm" variant="secondary">
            Movimientos
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function CajasClient({ cajas, monedas }: CajasClientProps) {
  const [expandedCaja, setExpandedCaja] = useState<string | null>(null);

  // Total de dinero REAL disponible:
  // ✅ Caja General (incluye el flujo de subcajas de sociedad/tipo-ingreso)
  // ✅ Cajas virtuales con dinero propio (Talentos, Promesas, Filiales)
  // ❌ Subcajas de seguimiento (su dinero ya está contado en Caja General)
  const totalesGlobales = useMemo(
    () =>
      monedas
        .map((moneda) => {
          let totalIngresos = 0;
          let totalEgresos = 0;
          cajas.forEach((caja) => {
            // Excluir subcajas: su dinero ya está físicamente en Caja General
            if (caja.esSubcaja) return;
            // Excluir caja virtual de Donaciones (es tracking, no efectivo separado)
            if (caja.esVirtual && caja.nombre === "Donaciones") return;

            const saldo = caja.saldos.find((s) => s.monedaId === moneda.id);
            if (saldo) {
              totalIngresos += saldo.ingresos;
              totalEgresos += saldo.egresos;
            }
          });
          return {
            moneda,
            ingresos: totalIngresos,
            egresos: totalEgresos,
            saldo: totalIngresos - totalEgresos,
          };
        })
        .filter((t) => t.ingresos > 0 || t.egresos > 0),
    [monedas, cajas],
  );

  const formatMonto = (monto: number, simbolo: string) => {
    return `${simbolo} ${monto.toFixed(2)}`;
  };

  // Separar cajas en grupos para el layout:
  // - Dinero real: todo lo que NO es subcaja ni virtual (incluye Caja General, Talentos, Promesas, etc.)
  // - Subcajas de seguimiento: tienen esSubcaja=true (checkbox "Guardar en Caja General" activado)
  // - Virtuales: cajas sintéticas (Donaciones, Filiales)
  const cajasConDineroReal = cajas.filter((c) => !c.esSubcaja && !c.esVirtual);
  const cajasSubcaja = cajas.filter((c) => c.esSubcaja);
  const cajasVirtuales = cajas.filter((c) => c.esVirtual);

  return (
    <div className="p-4 md:p-6">
      {/* Resumen global */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-[#eef4f7] border-[#b9d4df]">
          <div className="text-sm text-[#40768c]">Cajas Activas</div>
          <div className="text-3xl font-bold text-[#305969] my-2">
            {cajas.length}
          </div>
          <Link
            href="/dashboard/configuracion"
            className="text-xs text-[#2ba193] underline"
          >
            Administrar cajas →
          </Link>
        </Card>
        {totalesGlobales.map(({ moneda, ingresos, egresos, saldo }) => (
          <Card key={moneda.id} className="bg-white border-[#b9d4df]">
            <div className="text-sm text-[#40768c] mb-1">
              Efectivo total real
            </div>
            <div className="text-2xl font-bold text-[#203b46] my-1">
              {moneda.simbolo}
              {saldo.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[#73a9bf] flex gap-3 mt-1">
              <span className="text-[#2ba193]">
                ↑ {moneda.simbolo}
                {ingresos.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[#e0451f]">
                ↓ {moneda.simbolo}
                {egresos.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-[#73a9bf] mt-2 border-t border-[#dceaef] pt-2">
              Incluye Caja General y cajas con dinero propio. Excluye subcajas
              de seguimiento.
            </p>
          </Card>
        ))}
      </div>

      {/* ── GRUPO 1: CAJAS GENERALES ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#40768c] uppercase tracking-wide mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2ba193]"></span>
          Cajas con dinero real
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cajasConDineroReal.map((caja) => (
            <CajaCard
              key={caja.id}
              caja={caja}
              isExpanded={expandedCaja === caja.id}
              onToggle={() =>
                setExpandedCaja(expandedCaja === caja.id ? null : caja.id)
              }
              formatMonto={formatMonto}
            />
          ))}
        </div>
      </section>

      {/* ── GRUPO 2: SUBCAJAS DE SEGUIMIENTO ── */}
      {cajasSubcaja.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#c77700] uppercase tracking-wide mb-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#ffa94d]"></span>
            Subcajas de seguimiento
          </h2>
          <p className="text-xs text-[#73a9bf] mb-3">
            El dinero de estas cajas se acumula físicamente en{" "}
            <strong>Caja General</strong>. Se muestran por separado para
            visualizar cuánto aporta cada sociedad o tipo de ingreso.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cajasSubcaja.map((caja) => (
              <CajaCard
                key={caja.id}
                caja={caja}
                isExpanded={expandedCaja === caja.id}
                onToggle={() =>
                  setExpandedCaja(expandedCaja === caja.id ? null : caja.id)
                }
                formatMonto={formatMonto}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── GRUPO 3: CAJAS VIRTUALES ── */}
      {cajasVirtuales.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#9775c4] uppercase tracking-wide mb-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#9775c4]"></span>
            Resúmenes virtuales
          </h2>
          <p className="text-xs text-[#73a9bf] mb-3">
            Totalizadores automáticos de registros especiales (donaciones,
            filiales). No representan efectivo físico separado.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cajasVirtuales.map((caja) => (
              <CajaCard
                key={caja.id}
                caja={caja}
                isExpanded={expandedCaja === caja.id}
                onToggle={() =>
                  setExpandedCaja(expandedCaja === caja.id ? null : caja.id)
                }
                formatMonto={formatMonto}
              />
            ))}
          </div>
        </section>
      )}

      {cajas.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🗃️</div>
          <h3 className="text-lg font-semibold text-[#203b46] mb-2">
            No hay cajas configuradas
          </h3>
          <p className="text-[#73a9bf] mb-4">
            Configura tus cajas para empezar a registrar movimientos
          </p>
          <Link href="/dashboard/configuracion/inicio">
            <Button>Configurar Sistema</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
