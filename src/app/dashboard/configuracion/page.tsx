"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout";
import { Card, Button, Input, Badge, Table, Select } from "@/components/ui";

// Tipos de datos
interface ConfigItem {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

interface CajaItem extends ConfigItem {
  sociedadId?: string;
  tipoIngresoId?: string;
}

// Datos de ejemplo para cada configuración
const tiposServicioIniciales: ConfigItem[] = [
  {
    id: "1",
    nombre: "Culto",
    descripcion: "Servicio dominical regular",
    activo: true,
  },
  {
    id: "2",
    nombre: "Oración",
    descripcion: "Servicio de oración",
    activo: true,
  },
  {
    id: "3",
    nombre: "Vigilia",
    descripcion: "Servicio nocturno de vigilia",
    activo: true,
  },
  {
    id: "4",
    nombre: "Matutino",
    descripcion: "Servicio de la mañana",
    activo: true,
  },
  {
    id: "5",
    nombre: "Enseñanza",
    descripcion: "Estudio bíblico y enseñanza",
    activo: true,
  },
];

const sociedadesIniciales: ConfigItem[] = [
  {
    id: "1",
    nombre: "Hombres",
    descripcion: "Sociedad de varones",
    activo: true,
  },
  {
    id: "2",
    nombre: "Mujeres",
    descripcion: "Sociedad de damas",
    activo: true,
  },
  {
    id: "3",
    nombre: "Culto General",
    descripcion: "Congregación general",
    activo: true,
  },
];

const tiposIngresoIniciales: ConfigItem[] = [
  {
    id: "1",
    nombre: "Ofrenda",
    descripcion: "Ofrendas generales del culto",
    activo: true,
  },
  {
    id: "2",
    nombre: "Talentos",
    descripcion: "Recaudación de talentos por sociedad",
    activo: true,
  },
  {
    id: "3",
    nombre: "Promesas",
    descripcion: "Promesas (solo mujeres)",
    activo: true,
  },
  {
    id: "4",
    nombre: "Diezmo",
    descripcion: "Diezmos de los miembros",
    activo: true,
  },
  {
    id: "5",
    nombre: "Donación",
    descripcion: "Donaciones especiales",
    activo: true,
  },
  {
    id: "6",
    nombre: "Hermano en Ayuda",
    descripcion: "Fondos para ayuda fraternal",
    activo: true,
  },
];

const tiposGastoIniciales: ConfigItem[] = [
  {
    id: "1",
    nombre: "Combustible",
    descripcion: "Gastos de combustible",
    activo: true,
  },
  {
    id: "2",
    nombre: "Agua / Pipa",
    descripcion: "Servicio de agua",
    activo: true,
  },
  {
    id: "3",
    nombre: "Funeraria",
    descripcion: "Gastos funerarios",
    activo: true,
  },
  {
    id: "4",
    nombre: "Luz Eléctrica",
    descripcion: "Servicio de electricidad",
    activo: true,
  },
  {
    id: "5",
    nombre: "Otros",
    descripcion: "Otros gastos varios",
    activo: true,
  },
];

const cajasIniciales: CajaItem[] = [
  {
    id: "1",
    nombre: "Caja General",
    descripcion: "Ofrendas del culto general",
    sociedadId: "3",
    tipoIngresoId: "1",
    activo: true,
  },
  {
    id: "2",
    nombre: "Caja Talentos - Hombres",
    descripcion: "Talentos de la sociedad de hombres",
    sociedadId: "1",
    tipoIngresoId: "2",
    activo: true,
  },
  {
    id: "3",
    nombre: "Caja Talentos - Mujeres",
    descripcion: "Talentos de la sociedad de mujeres",
    sociedadId: "2",
    tipoIngresoId: "2",
    activo: true,
  },
  {
    id: "4",
    nombre: "Caja de Promesas",
    descripcion: "Promesas de la sociedad de mujeres",
    sociedadId: "2",
    tipoIngresoId: "3",
    activo: true,
  },
  {
    id: "5",
    nombre: "Caja de Diezmos",
    descripcion: "Diezmos de todos los miembros",
    sociedadId: undefined,
    tipoIngresoId: "4",
    activo: true,
  },
  {
    id: "6",
    nombre: "Caja de Donaciones",
    descripcion: "Donaciones especiales",
    sociedadId: undefined,
    tipoIngresoId: "5",
    activo: true,
  },
  {
    id: "7",
    nombre: "Caja Hermano en Ayuda",
    descripcion: "Fondos para ayuda a hermanos",
    sociedadId: undefined,
    tipoIngresoId: "6",
    activo: true,
  },
];

type TabType = "servicios" | "sociedades" | "ingresos" | "gastos" | "cajas";

const tabs: { key: TabType; label: string; icon: ReactNode }[] = [
  {
    key: "servicios",
    label: "Tipos de Servicio",
    icon: (
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
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    key: "sociedades",
    label: "Sociedades / Orígenes",
    icon: (
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    key: "ingresos",
    label: "Tipos de Ingreso",
    icon: (
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
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    key: "gastos",
    label: "Tipos de Gasto",
    icon: (
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
          d="M20 12H4"
        />
      </svg>
    ),
  },
  {
    key: "cajas",
    label: "Cajas",
    icon: (
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
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
];

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabType>("servicios");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigItem | CajaItem | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Estados para cada tipo de configuración
  const [tiposServicio, setTiposServicio] = useState(tiposServicioIniciales);
  const [sociedades, setSociedades] = useState(sociedadesIniciales);
  const [tiposIngreso, setTiposIngreso] = useState(tiposIngresoIniciales);
  const [tiposGasto, setTiposGasto] = useState(tiposGastoIniciales);
  const [cajas, setCajas] = useState<CajaItem[]>(cajasIniciales);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sociedadId: "",
    tipoIngresoId: "",
  });

  // Opciones para selects
  const sociedadOptions = [
    { value: "", label: "-- Todas las sociedades --" },
    ...sociedades
      .filter((s) => s.activo)
      .map((s) => ({ value: s.id, label: s.nombre })),
  ];

  const tipoIngresoOptions = [
    { value: "", label: "-- Sin tipo específico --" },
    ...tiposIngreso
      .filter((t) => t.activo)
      .map((t) => ({ value: t.id, label: t.nombre })),
  ];

  // Helper para obtener nombre de sociedad
  const getSociedadNombre = (id?: string) => {
    if (!id) return null;
    return sociedades.find((s) => s.id === id)?.nombre;
  };

  // Helper para obtener nombre de tipo de ingreso
  const getTipoIngresoNombre = (id?: string) => {
    if (!id) return null;
    return tiposIngreso.find((t) => t.id === id)?.nombre;
  };

  const getCurrentData = (): ConfigItem[] => {
    switch (activeTab) {
      case "servicios":
        return tiposServicio;
      case "sociedades":
        return sociedades;
      case "ingresos":
        return tiposIngreso;
      case "gastos":
        return tiposGasto;
      case "cajas":
        return cajas;
      default:
        return [];
    }
  };

  const setCurrentData = (data: ConfigItem[]) => {
    switch (activeTab) {
      case "servicios":
        setTiposServicio(data);
        break;
      case "sociedades":
        setSociedades(data);
        break;
      case "ingresos":
        setTiposIngreso(data);
        break;
      case "gastos":
        setTiposGasto(data);
        break;
      case "cajas":
        setCajas(data);
        break;
    }
  };

  const getTabLabel = () => {
    return tabs.find((t) => t.key === activeTab)?.label || "";
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      descripcion: "",
      sociedadId: "",
      tipoIngresoId: "",
    });
    setShowModal(true);
  };

  const handleEdit = (item: ConfigItem | CajaItem) => {
    setEditingItem(item);
    if (activeTab === "cajas") {
      const cajaItem = item as CajaItem;
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion || "",
        sociedadId: cajaItem.sociedadId || "",
        tipoIngresoId: cajaItem.tipoIngresoId || "",
      });
    } else {
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion || "",
        sociedadId: "",
        tipoIngresoId: "",
      });
    }
    setShowModal(true);
  };

  const handleToggleActive = (id: string) => {
    const data = getCurrentData();
    const updated = data.map((item) =>
      item.id === id ? { ...item, activo: !item.activo } : item
    );
    setCurrentData(updated);
  };

  const handleDelete = (id: string) => {
    const data = getCurrentData();
    const updated = data.filter((item) => item.id !== id);
    setCurrentData(updated);
    setDeleteConfirm(null);
  };

  const handleSave = () => {
    if (!formData.nombre.trim()) return;

    if (activeTab === "cajas") {
      // Lógica especial para cajas
      if (editingItem) {
        const updated = cajas.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                sociedadId: formData.sociedadId || undefined,
                tipoIngresoId: formData.tipoIngresoId || undefined,
              }
            : item
        );
        setCajas(updated);
      } else {
        const newItem: CajaItem = {
          id: Date.now().toString(),
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          sociedadId: formData.sociedadId || undefined,
          tipoIngresoId: formData.tipoIngresoId || undefined,
          activo: true,
        };
        setCajas([...cajas, newItem]);
      }
    } else {
      const data = getCurrentData();

      if (editingItem) {
        // Editar existente
        const updated = data.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                nombre: formData.nombre,
                descripcion: formData.descripcion,
              }
            : item
        );
        setCurrentData(updated);
      } else {
        // Agregar nuevo
        const newItem: ConfigItem = {
          id: Date.now().toString(),
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          activo: true,
        };
        setCurrentData([...data, newItem]);
      }
    }

    setShowModal(false);
    setFormData({
      nombre: "",
      descripcion: "",
      sociedadId: "",
      tipoIngresoId: "",
    });
  };

  // Columnas base para todas las tablas
  const baseColumns = [
    {
      key: "nombre",
      header: "Nombre",
      render: (item: ConfigItem) => (
        <span className="font-medium text-[#203b46]">{item.nombre}</span>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (item: ConfigItem) => (
        <span className="text-[#73a9bf]">{item.descripcion || "-"}</span>
      ),
    },
  ];

  // Columnas adicionales para cajas
  const cajasExtraColumns = [
    {
      key: "sociedad",
      header: "Sociedad Asignada",
      render: (item: CajaItem) => {
        const nombre = getSociedadNombre(item.sociedadId);
        return nombre ? (
          <Badge variant="info">{nombre}</Badge>
        ) : (
          <span className="text-[#73a9bf] text-sm italic">General</span>
        );
      },
    },
    {
      key: "tipoIngreso",
      header: "Tipo de Ingreso",
      render: (item: CajaItem) => {
        const nombre = getTipoIngresoNombre(item.tipoIngresoId);
        return nombre ? (
          <Badge variant="success">{nombre}</Badge>
        ) : (
          <span className="text-[#73a9bf] text-sm italic">Varios</span>
        );
      },
    },
  ];

  // Columna de estado y acciones
  const actionColumns = [
    {
      key: "estado",
      header: "Estado",
      render: (item: ConfigItem) => (
        <Badge variant={item.activo ? "success" : "default"}>
          {item.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (item: ConfigItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(item)}
            className="p-1.5 text-[#40768c] hover:bg-[#eef4f7] rounded-lg transition-colors"
            title="Editar"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => handleToggleActive(item.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              item.activo
                ? "text-[#b1871b] hover:bg-[#fcf6e9]"
                : "text-[#2ba193] hover:bg-[#ebfaf8]"
            }`}
            title={item.activo ? "Desactivar" : "Activar"}
          >
            {item.activo ? (
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>
          {deleteConfirm === item.id ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-white bg-[#e0451f] rounded-lg hover:bg-[#b43718] transition-colors"
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
                className="p-1.5 text-[#73a9bf] hover:bg-[#eef4f7] rounded-lg transition-colors"
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
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(item.id)}
              className="p-1.5 text-[#e0451f] hover:bg-[#fcece9] rounded-lg transition-colors"
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

  // Obtener columnas según la pestaña activa
  const getColumns = () => {
    if (activeTab === "cajas") {
      return [...baseColumns, ...cajasExtraColumns, ...actionColumns];
    }
    return [...baseColumns, ...actionColumns];
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Configuración"
        subtitle="Administra los datos maestros del sistema"
      />

      <div className="p-4 md:p-6">
        {/* Tabs de navegación */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setDeleteConfirm(null);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
                  ${
                    activeTab === tab.key
                      ? "bg-[#305969] text-white shadow-md"
                      : "bg-white text-[#40768c] hover:bg-[#eef4f7] border border-[#b9d4df]"
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de la pestaña */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#203b46]">
                {getTabLabel()}
              </h3>
              <p className="text-sm text-[#73a9bf]">
                {getCurrentData().filter((i) => i.activo).length} activos de{" "}
                {getCurrentData().length} registros
              </p>
            </div>
            <Button onClick={handleAdd}>
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
              Agregar Nuevo
            </Button>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <Table
              columns={getColumns()}
              data={getCurrentData()}
              emptyMessage="No hay registros configurados"
            />
          </div>
        </Card>

        {/* Información adicional */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#ebfaf8] border-[#aeeae3]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#2ba193] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-[#15514a]">
                  Elementos Activos
                </h4>
                <p className="text-sm text-[#20796f]">
                  Solo los elementos activos aparecen en los formularios de
                  registro.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#fcf6e9] border-[#f2dca6]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#dea821] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-[#856514]">Precaución</h4>
                <p className="text-sm text-[#59430d]">
                  Eliminar un elemento puede afectar registros históricos.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#eef4f7] border-[#b9d4df]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#40768c] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-[#305969]">Recomendación</h4>
                <p className="text-sm text-[#40768c]">
                  Desactive en lugar de eliminar para mantener el historial.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de agregar/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#203b46]">
                {editingItem ? "Editar" : "Agregar"}{" "}
                {getTabLabel().slice(0, -1)}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-[#73a9bf] hover:text-[#305969] transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ingrese el nombre"
                required
              />
              <Input
                label="Descripción (opcional)"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                placeholder="Ingrese una descripción"
              />

              {/* Campos adicionales para Cajas */}
              {activeTab === "cajas" && (
                <>
                  <Select
                    label="Sociedad Asignada"
                    value={formData.sociedadId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sociedadId: e.target.value,
                      }))
                    }
                    options={sociedadOptions}
                  />
                  <Select
                    label="Tipo de Ingreso Asociado"
                    value={formData.tipoIngresoId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoIngresoId: e.target.value,
                      }))
                    }
                    options={tipoIngresoOptions}
                  />
                  <div className="p-3 bg-[#eef4f7] rounded-lg border border-[#b9d4df]">
                    <p className="text-xs text-[#40768c]">
                      <strong>Nota:</strong> La sociedad y tipo de ingreso
                      determinan qué ingresos se asignan automáticamente a esta
                      caja.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.nombre.trim()}>
                {editingItem ? "Guardar Cambios" : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
