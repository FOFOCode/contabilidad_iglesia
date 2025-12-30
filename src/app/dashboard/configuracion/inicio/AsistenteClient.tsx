"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Badge } from "@/components/ui";
import { sembrarDatosIniciales } from "@/app/actions/sistema";
import {
  createMoneda,
  createSociedad,
  createTipoServicio,
  createTipoIngreso,
  createTipoGasto,
  createCaja,
} from "@/app/actions/configuraciones";

interface ConfigStatus {
  monedas: number;
  sociedades: number;
  tiposServicio: number;
  tiposIngreso: number;
  tiposGasto: number;
  cajas: number;
  configurado: boolean;
}

interface AsistenteClientProps {
  statusInicial: ConfigStatus;
}

type Paso =
  | "bienvenida"
  | "monedas"
  | "sociedades"
  | "servicios"
  | "ingresos"
  | "gastos"
  | "cajas"
  | "completado";

const PASOS_ORDEN: Paso[] = [
  "bienvenida",
  "monedas",
  "sociedades",
  "servicios",
  "ingresos",
  "gastos",
  "cajas",
  "completado",
];

export function AsistenteClient({ statusInicial }: AsistenteClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pasoActual, setPasoActual] = useState<Paso>("bienvenida");
  const [status, setStatus] = useState(statusInicial);
  const [error, setError] = useState<string | null>(null);

  // Estados para formularios rápidos
  const [items, setItems] = useState<
    { id: number; nombre: string; descripcion: string }[]
  >([]);
  const [nuevoItem, setNuevoItem] = useState({ nombre: "", descripcion: "" });

  // Estado específico para monedas
  const [monedas, setMonedas] = useState<
    {
      id: number;
      codigo: string;
      nombre: string;
      simbolo: string;
      tasaCambio: string;
      esPrincipal: boolean;
    }[]
  >([]);
  const [nuevaMoneda, setNuevaMoneda] = useState({
    codigo: "",
    nombre: "",
    simbolo: "",
    tasaCambio: "1",
    esPrincipal: false,
  });

  // Estado específico para cajas
  const [cajas, setCajas] = useState<
    { id: number; nombre: string; descripcion: string }[]
  >([]);
  const [nuevaCaja, setNuevaCaja] = useState({ nombre: "", descripcion: "" });

  const indicePaso = PASOS_ORDEN.indexOf(pasoActual);
  const progreso = Math.round((indicePaso / (PASOS_ORDEN.length - 1)) * 100);

  const irSiguiente = () => {
    const indiceActual = PASOS_ORDEN.indexOf(pasoActual);
    if (indiceActual < PASOS_ORDEN.length - 1) {
      setPasoActual(PASOS_ORDEN[indiceActual + 1]);
      setItems([]);
      setNuevoItem({ nombre: "", descripcion: "" });
    }
  };

  const irAnterior = () => {
    const indiceActual = PASOS_ORDEN.indexOf(pasoActual);
    if (indiceActual > 0) {
      setPasoActual(PASOS_ORDEN[indiceActual - 1]);
    }
  };

  const cargarDatosPorDefecto = () => {
    setError(null);
    startTransition(async () => {
      try {
        await sembrarDatosIniciales();
        router.push("/dashboard");
      } catch (e) {
        setError("Error al cargar datos por defecto");
        console.error(e);
      }
    });
  };

  // Agregar item genérico (sociedades, servicios, tipos ingreso, tipos gasto)
  const agregarItem = () => {
    if (!nuevoItem.nombre.trim()) return;
    setItems([...items, { id: Date.now(), ...nuevoItem }]);
    setNuevoItem({ nombre: "", descripcion: "" });
  };

  const eliminarItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Agregar moneda
  const agregarMoneda = () => {
    if (
      !nuevaMoneda.codigo.trim() ||
      !nuevaMoneda.nombre.trim() ||
      !nuevaMoneda.simbolo.trim()
    )
      return;
    // Si es la primera, hacerla principal
    const esPrincipal = monedas.length === 0 ? true : nuevaMoneda.esPrincipal;
    setMonedas([
      ...monedas.map((m) => (esPrincipal ? { ...m, esPrincipal: false } : m)),
      { id: Date.now(), ...nuevaMoneda, esPrincipal },
    ]);
    setNuevaMoneda({
      codigo: "",
      nombre: "",
      simbolo: "",
      tasaCambio: "1",
      esPrincipal: false,
    });
  };

  const eliminarMoneda = (id: number) => {
    setMonedas(monedas.filter((m) => m.id !== id));
  };

  // Agregar caja
  const agregarCaja = () => {
    if (!nuevaCaja.nombre.trim()) return;
    setCajas([...cajas, { id: Date.now(), ...nuevaCaja }]);
    setNuevaCaja({ nombre: "", descripcion: "" });
  };

  const eliminarCaja = (id: number) => {
    setCajas(cajas.filter((c) => c.id !== id));
  };

  // Guardar y continuar
  const guardarYContinuar = () => {
    setError(null);
    startTransition(async () => {
      try {
        switch (pasoActual) {
          case "monedas":
            for (const m of monedas) {
              await createMoneda({
                codigo: m.codigo.toUpperCase(),
                nombre: m.nombre,
                simbolo: m.simbolo,
                tasaCambio: parseFloat(m.tasaCambio),
                esPrincipal: m.esPrincipal,
              });
            }
            setMonedas([]);
            break;
          case "sociedades":
            for (let i = 0; i < items.length; i++) {
              await createSociedad({
                nombre: items[i].nombre,
                descripcion: items[i].descripcion || undefined,
                orden: i,
              });
            }
            break;
          case "servicios":
            for (let i = 0; i < items.length; i++) {
              await createTipoServicio({
                nombre: items[i].nombre,
                descripcion: items[i].descripcion || undefined,
                orden: i,
              });
            }
            break;
          case "ingresos":
            for (let i = 0; i < items.length; i++) {
              await createTipoIngreso({
                nombre: items[i].nombre,
                descripcion: items[i].descripcion || undefined,
                orden: i,
              });
            }
            break;
          case "gastos":
            for (let i = 0; i < items.length; i++) {
              await createTipoGasto({
                nombre: items[i].nombre,
                descripcion: items[i].descripcion || undefined,
                orden: i,
              });
            }
            break;
          case "cajas":
            for (let i = 0; i < cajas.length; i++) {
              await createCaja({
                nombre: cajas[i].nombre,
                descripcion: cajas[i].descripcion || undefined,
                orden: i,
              });
            }
            setCajas([]);
            break;
        }
        irSiguiente();
      } catch (e: any) {
        setError(
          e.message?.includes("Unique")
            ? "Ya existe un elemento con ese nombre"
            : "Error al guardar"
        );
        console.error(e);
      }
    });
  };

  const irAlDashboard = () => {
    router.push("/dashboard");
  };

  // Renderizado según el paso
  const renderPaso = () => {
    switch (pasoActual) {
      case "bienvenida":
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">⛪</div>
            <h2 className="text-2xl font-bold text-[#203b46] mb-4">
              ¡Bienvenido al Sistema de Contabilidad!
            </h2>
            <p className="text-[#40768c] mb-8">
              Este asistente te ayudará a configurar el sistema antes de empezar
              a usarlo. Configuraremos las monedas, sociedades, tipos de
              servicio, ingresos, gastos y cajas.
            </p>

            {status.configurado ? (
              <div className="bg-[#ebfaf8] border border-[#2ba193] rounded-lg p-4 mb-6">
                <p className="text-[#15514a] font-medium">
                  ✅ El sistema ya está configurado
                </p>
                <p className="text-sm text-[#20796f] mt-1">
                  Puedes ir directamente al Dashboard o reconfigurar.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={cargarDatosPorDefecto}
                disabled={isPending}
                variant="secondary"
              >
                {isPending ? "Cargando..." : "🚀 Cargar datos por defecto"}
              </Button>
              <Button onClick={irSiguiente}>✏️ Configurar manualmente</Button>
            </div>

            {status.configurado && (
              <Button
                onClick={irAlDashboard}
                variant="secondary"
                className="mt-4"
              >
                Ir al Dashboard →
              </Button>
            )}
          </div>
        );

      case "monedas":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">💱</div>
              <h2 className="text-xl font-bold text-[#203b46]">
                Paso 1: Monedas
              </h2>
              <p className="text-[#40768c] text-sm">
                Define las monedas que usarás (mínimo 1 principal)
              </p>
            </div>

            {/* Lista de monedas agregadas */}
            {monedas.length > 0 && (
              <div className="mb-4 space-y-2">
                {monedas.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-[#eef4f7] p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-[#40768c]">
                        {m.simbolo}
                      </span>
                      <div>
                        <span className="font-medium text-[#203b46]">
                          {m.codigo}
                        </span>
                        <span className="text-[#73a9bf] ml-2">
                          - {m.nombre}
                        </span>
                      </div>
                      {m.esPrincipal && (
                        <Badge variant="warning">★ Principal</Badge>
                      )}
                    </div>
                    <button
                      onClick={() => eliminarMoneda(m.id)}
                      className="text-[#e0451f] hover:bg-[#fcece9] p-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para agregar */}
            <Card className="mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  label="Código"
                  value={nuevaMoneda.codigo}
                  onChange={(e) =>
                    setNuevaMoneda({
                      ...nuevaMoneda,
                      codigo: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="USD"
                  maxLength={3}
                />
                <Input
                  label="Símbolo"
                  value={nuevaMoneda.simbolo}
                  onChange={(e) =>
                    setNuevaMoneda({ ...nuevaMoneda, simbolo: e.target.value })
                  }
                  placeholder="$"
                  maxLength={2}
                />
              </div>
              <Input
                label="Nombre completo"
                value={nuevaMoneda.nombre}
                onChange={(e) =>
                  setNuevaMoneda({ ...nuevaMoneda, nombre: e.target.value })
                }
                placeholder="Dólar estadounidense"
                className="mb-3"
              />
              <div className="flex items-center gap-4 mb-3">
                <Input
                  label="Tasa de cambio"
                  type="number"
                  value={nuevaMoneda.tasaCambio}
                  onChange={(e) =>
                    setNuevaMoneda({
                      ...nuevaMoneda,
                      tasaCambio: e.target.value,
                    })
                  }
                  placeholder="1.00"
                  step="0.01"
                  className="flex-1"
                />
                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={nuevaMoneda.esPrincipal}
                    onChange={(e) =>
                      setNuevaMoneda({
                        ...nuevaMoneda,
                        esPrincipal: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                    disabled={monedas.length === 0}
                  />
                  <span className="text-sm text-[#305969]">Principal</span>
                </label>
              </div>
              <Button
                onClick={agregarMoneda}
                variant="secondary"
                className="w-full"
              >
                + Agregar moneda
              </Button>
            </Card>

            <div className="flex justify-between">
              <Button onClick={irAnterior} variant="secondary">
                ← Atrás
              </Button>
              <Button
                onClick={guardarYContinuar}
                disabled={monedas.length === 0 || isPending}
              >
                {isPending ? "Guardando..." : "Continuar →"}
              </Button>
            </div>
          </div>
        );

      case "sociedades":
        return renderPasoGenerico(
          "👥",
          "Paso 2: Sociedades / Orígenes",
          "Los grupos de tu iglesia que recaudan dinero",
          "Ej: Hombres, Mujeres, Jóvenes, Culto General"
        );

      case "servicios":
        return renderPasoGenerico(
          "⛪",
          "Paso 3: Tipos de Servicio",
          "Los tipos de reuniones donde se recauda",
          "Ej: Culto, Oración, Vigilia, Estudio Bíblico"
        );

      case "ingresos":
        return renderPasoGenerico(
          "💵",
          "Paso 4: Tipos de Ingreso",
          "Las formas en que entra el dinero",
          "Ej: Ofrenda, Diezmo, Talentos, Donación"
        );

      case "gastos":
        return renderPasoGenerico(
          "💸",
          "Paso 5: Tipos de Gasto",
          "Las categorías de gastos",
          "Ej: Luz, Agua, Combustible, Mantenimiento"
        );

      case "cajas":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🗃️</div>
              <h2 className="text-xl font-bold text-[#203b46]">
                Paso 6: Cajas
              </h2>
              <p className="text-[#40768c] text-sm">
                Los "bolsillos" donde se guarda el dinero según su propósito
              </p>
            </div>

            {/* Lista de cajas agregadas */}
            {cajas.length > 0 && (
              <div className="mb-4 space-y-2">
                {cajas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-[#eef4f7] p-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-[#203b46]">
                        {c.nombre}
                      </span>
                      {c.descripcion && (
                        <span className="text-[#73a9bf] ml-2 text-sm">
                          - {c.descripcion}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => eliminarCaja(c.id)}
                      className="text-[#e0451f] hover:bg-[#fcece9] p-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para agregar */}
            <Card className="mb-4">
              <Input
                label="Nombre de la caja"
                value={nuevaCaja.nombre}
                onChange={(e) =>
                  setNuevaCaja({ ...nuevaCaja, nombre: e.target.value })
                }
                placeholder="Ej: Caja General, Caja Diezmos"
                className="mb-3"
              />
              <Input
                label="Descripción (opcional)"
                value={nuevaCaja.descripcion}
                onChange={(e) =>
                  setNuevaCaja({ ...nuevaCaja, descripcion: e.target.value })
                }
                placeholder="Para qué se usa esta caja"
                className="mb-3"
              />
              <Button
                onClick={agregarCaja}
                variant="secondary"
                className="w-full"
              >
                + Agregar caja
              </Button>
            </Card>

            <p className="text-xs text-[#73a9bf] text-center mb-4">
              💡 Podrás asignar sociedades y tipos de ingreso a cada caja desde
              Configuración
            </p>

            <div className="flex justify-between">
              <Button onClick={irAnterior} variant="secondary">
                ← Atrás
              </Button>
              <Button
                onClick={guardarYContinuar}
                disabled={cajas.length === 0 || isPending}
              >
                {isPending ? "Guardando..." : "Finalizar →"}
              </Button>
            </div>
          </div>
        );

      case "completado":
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-[#203b46] mb-4">
              ¡Configuración Completada!
            </h2>
            <p className="text-[#40768c] mb-8">
              El sistema está listo para usar. Ahora puedes empezar a registrar
              ingresos y egresos.
            </p>

            <div className="bg-[#ebfaf8] border border-[#2ba193] rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-[#15514a] mb-3">
                Resumen de configuración:
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-[#20796f]">
                <span>Monedas configuradas</span>
                <span>Sociedades configuradas</span>
                <span>Tipos de servicio</span>
                <span>Tipos de ingreso</span>
                <span>Tipos de gasto</span>
                <span>Cajas creadas</span>
              </div>
            </div>

            <Button onClick={irAlDashboard} className="px-8">
              Ir al Dashboard →
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Función helper para pasos genéricos (sociedades, servicios, ingresos, gastos)
  const renderPasoGenerico = (
    emoji: string,
    titulo: string,
    subtitulo: string,
    placeholder: string
  ) => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{emoji}</div>
        <h2 className="text-xl font-bold text-[#203b46]">{titulo}</h2>
        <p className="text-[#40768c] text-sm">{subtitulo}</p>
      </div>

      {/* Lista de items agregados */}
      {items.length > 0 && (
        <div className="mb-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-[#eef4f7] p-3 rounded-lg"
            >
              <div>
                <span className="font-medium text-[#203b46]">
                  {item.nombre}
                </span>
                {item.descripcion && (
                  <span className="text-[#73a9bf] ml-2 text-sm">
                    - {item.descripcion}
                  </span>
                )}
              </div>
              <button
                onClick={() => eliminarItem(item.id)}
                className="text-[#e0451f] hover:bg-[#fcece9] p-1 rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario para agregar */}
      <Card className="mb-4">
        <Input
          label="Nombre"
          value={nuevoItem.nombre}
          onChange={(e) =>
            setNuevoItem({ ...nuevoItem, nombre: e.target.value })
          }
          placeholder={placeholder}
          className="mb-3"
        />
        <Input
          label="Descripción (opcional)"
          value={nuevoItem.descripcion}
          onChange={(e) =>
            setNuevoItem({ ...nuevoItem, descripcion: e.target.value })
          }
          placeholder="Descripción breve"
          className="mb-3"
        />
        <Button onClick={agregarItem} variant="secondary" className="w-full">
          + Agregar
        </Button>
      </Card>

      <div className="flex justify-between">
        <Button onClick={irAnterior} variant="secondary">
          ← Atrás
        </Button>
        <Button
          onClick={guardarYContinuar}
          disabled={items.length === 0 || isPending}
        >
          {isPending ? "Guardando..." : "Continuar →"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef4f7] to-white p-4">
      {/* Barra de progreso */}
      {pasoActual !== "bienvenida" && pasoActual !== "completado" && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between text-xs text-[#73a9bf] mb-2">
            <span>
              Paso {indicePaso} de {PASOS_ORDEN.length - 2}
            </span>
            <span>{progreso}%</span>
          </div>
          <div className="h-2 bg-[#b9d4df] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2ba193] transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="max-w-2xl mx-auto mb-4 p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg text-[#b43718]">
          {error}
        </div>
      )}

      {/* Contenido del paso */}
      <div className="py-8">{renderPaso()}</div>
    </div>
  );
}
