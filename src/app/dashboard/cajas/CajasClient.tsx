"use client";

import { useState } from "react";
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
  sociedad: { nombre: string } | null;
  tipoIngreso: { nombre: string } | null;
  saldos: SaldoCaja[];
}

interface CajasClientProps {
  cajas: CajaData[];
  monedas: Moneda[];
}

export function CajasClient({ cajas, monedas }: CajasClientProps) {
  const [expandedCaja, setExpandedCaja] = useState<string | null>(null);

  // Calcular totales globales por moneda
  const totalesGlobales = monedas
    .map((moneda) => {
      let totalIngresos = 0;
      let totalEgresos = 0;
      cajas.forEach((caja) => {
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
    .filter((t) => t.ingresos > 0 || t.egresos > 0);

  const formatMonto = (monto: number, simbolo: string) => {
    return `${simbolo} ${monto.toFixed(2)}`;
  };

  return (
    <div className="p-4 md:p-6">
      {/* Resumen global */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {totalesGlobales.length > 0 ? (
          totalesGlobales.map(({ moneda, ingresos, egresos, saldo }) => (
            <Card
              key={moneda.id}
              className="bg-gradient-to-br from-[#203b46] to-[#305969] text-white"
            >
              <div className="text-sm opacity-75">
                Saldo Total {moneda.codigo}
              </div>
              <div
                className={`text-3xl font-bold my-2 ${
                  saldo >= 0 ? "text-[#aeeae3]" : "text-[#f3b5a5]"
                }`}
              >
                {formatMonto(saldo, moneda.simbolo)}
              </div>
              <div className="flex justify-between text-xs opacity-75">
                <span>Ingresos: {formatMonto(ingresos, moneda.simbolo)}</span>
                <span>Egresos: {formatMonto(egresos, moneda.simbolo)}</span>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full bg-[#eef4f7] border-[#b9d4df]">
            <p className="text-[#40768c] text-center py-4">
              No hay movimientos registrados aún. Las cajas mostrarán saldos
              cuando registres ingresos y egresos.
            </p>
          </Card>
        )}

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
      </div>

      {/* Listado de cajas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cajas.map((caja) => {
          const isExpanded = expandedCaja === caja.id;
          const hasSaldos = caja.saldos.some(
            (s) => s.ingresos > 0 || s.egresos > 0
          );

          return (
            <Card key={caja.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-[#203b46]">
                    {caja.nombre}
                  </h3>
                  {caja.descripcion && (
                    <p className="text-sm text-[#73a9bf]">{caja.descripcion}</p>
                  )}
                </div>
                <Badge variant={caja.activa ? "success" : "default"}>
                  {caja.activa ? "Activa" : "Inactiva"}
                </Badge>
              </div>

              {/* Tags de asignación */}
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

              {/* Saldos por moneda */}
              {hasSaldos ? (
                <div className="space-y-2">
                  {caja.saldos
                    .filter((s) => s.ingresos > 0 || s.egresos > 0)
                    .map((saldo) => (
                      <div
                        key={saldo.monedaId}
                        className="bg-[#eef4f7] rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#40768c]">
                            {saldo.monedaCodigo}
                          </span>
                          <span
                            className={`font-bold ${
                              saldo.saldo >= 0
                                ? "text-[#2ba193]"
                                : "text-[#e0451f]"
                            }`}
                          >
                            {formatMonto(saldo.saldo, saldo.monedaSimbolo)}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="flex justify-between text-xs mt-1 text-[#73a9bf]">
                            <span>
                              +{" "}
                              {formatMonto(saldo.ingresos, saldo.monedaSimbolo)}
                            </span>
                            <span>
                              -{" "}
                              {formatMonto(saldo.egresos, saldo.monedaSimbolo)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-[#eef4f7] rounded-lg p-3 text-center">
                  <span className="text-sm text-[#73a9bf]">
                    Sin movimientos
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#dceaef]">
                <button
                  onClick={() => setExpandedCaja(isExpanded ? null : caja.id)}
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
        })}
      </div>

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
