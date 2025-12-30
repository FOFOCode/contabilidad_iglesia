"use client";

import React, { useState, useTransition, useEffect, ReactNode } from "react";
import { Card, Button, Input, Badge, Table, Select } from "@/components/ui";
import { UsuariosConfig } from "./UsuariosConfig";
import {
  createMoneda,
  updateMoneda,
  deleteMoneda,
  createSociedad,
  updateSociedad,
  deleteSociedad,
  createTipoServicio,
  updateTipoServicio,
  deleteTipoServicio,
  createTipoIngreso,
  updateTipoIngreso,
  deleteTipoIngreso,
  createTipoGasto,
  updateTipoGasto,
  deleteTipoGasto,
  createCaja,
  updateCaja,
  deleteCaja,
} from "@/app/actions/configuraciones";

// Tipos
export interface MonedaData {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  activa: boolean;
  esPrincipal: boolean;
  tasaCambio: number;
}

export interface ConfigItemData {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo?: boolean;
  activa?: boolean;
}

export interface CajaData extends ConfigItemData {
  sociedadId: string | null;
  tipoIngresoId: string | null;
  sociedad?: { nombre: string } | null;
  tipoIngreso?: { nombre: string } | null;
}

type TabType =
  | "servicios"
  | "sociedades"
  | "ingresos"
  | "gastos"
  | "cajas"
  | "monedas"
  | "usuarios";

interface ConfiguracionClientProps {
  monedasData: MonedaData[];
  sociedadesData: ConfigItemData[];
  tiposServicioData: ConfigItemData[];
  tiposIngresoData: ConfigItemData[];
  tiposGastoData: ConfigItemData[];
  cajasData: CajaData[];
}

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
  {
    key: "monedas",
    label: "Monedas",
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
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: "usuarios",
    label: "Usuarios",
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export function ConfiguracionClient({
  monedasData,
  sociedadesData,
  tiposServicioData,
  tiposIngresoData,
  tiposGastoData,
  cajasData,
}: ConfiguracionClientProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("servicios");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados locales que reflejan los datos del servidor
  const [monedas, setMonedas] = useState<MonedaData[]>(monedasData);
  const [sociedades, setSociedades] =
    useState<ConfigItemData[]>(sociedadesData);
  const [tiposServicio, setTiposServicio] =
    useState<ConfigItemData[]>(tiposServicioData);
  const [tiposIngreso, setTiposIngreso] =
    useState<ConfigItemData[]>(tiposIngresoData);
  const [tiposGasto, setTiposGasto] =
    useState<ConfigItemData[]>(tiposGastoData);
  const [cajas, setCajas] = useState<CajaData[]>(cajasData);

  // Actualizar cuando cambien los props
  useEffect(() => {
    setMonedas(monedasData);
    setSociedades(sociedadesData);
    setTiposServicio(tiposServicioData);
    setTiposIngreso(tiposIngresoData);
    setTiposGasto(tiposGastoData);
    setCajas(cajasData);
  }, [
    monedasData,
    sociedadesData,
    tiposServicioData,
    tiposIngresoData,
    tiposGastoData,
    cajasData,
  ]);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sociedadId: "",
    tipoIngresoId: "",
    codigo: "",
    simbolo: "",
    tasaCambio: "1",
    esPrincipal: false,
  });

  const sociedadOptions = [
    { value: "", label: "-- Todas las sociedades --" },
    ...sociedades
      .filter((s) => s.activa !== false)
      .map((s) => ({ value: s.id, label: s.nombre })),
  ];

  const tipoIngresoOptions = [
    { value: "", label: "-- Sin tipo específico --" },
    ...tiposIngreso
      .filter((t) => t.activo !== false)
      .map((t) => ({ value: t.id, label: t.nombre })),
  ];

  const getTabLabel = () => tabs.find((t) => t.key === activeTab)?.label || "";

  const getCurrentData = () => {
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
      case "monedas":
        return monedas;
      default:
        return [];
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      descripcion: "",
      sociedadId: "",
      tipoIngresoId: "",
      codigo: "",
      simbolo: "",
      tasaCambio: "1",
      esPrincipal: false,
    });
    setError(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setError(null);

    if (activeTab === "monedas") {
      setFormData({
        nombre: item.nombre,
        descripcion: "",
        sociedadId: "",
        tipoIngresoId: "",
        codigo: item.codigo,
        simbolo: item.simbolo,
        tasaCambio: item.tasaCambio.toString(),
        esPrincipal: item.esPrincipal,
      });
    } else if (activeTab === "cajas") {
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion || "",
        sociedadId: item.sociedadId || "",
        tipoIngresoId: item.tipoIngresoId || "",
        codigo: "",
        simbolo: "",
        tasaCambio: "1",
        esPrincipal: false,
      });
    } else {
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion || "",
        sociedadId: "",
        tipoIngresoId: "",
        codigo: "",
        simbolo: "",
        tasaCambio: "1",
        esPrincipal: false,
      });
    }
    setShowModal(true);
  };

  const handleToggleActive = async (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        switch (activeTab) {
          case "monedas": {
            const item = monedas.find((m) => m.id === id);
            if (item) {
              await updateMoneda(id, { activa: !item.activa });
              setMonedas(
                monedas.map((m) =>
                  m.id === id ? { ...m, activa: !m.activa } : m
                )
              );
            }
            break;
          }
          case "servicios": {
            const item = tiposServicio.find((s) => s.id === id);
            if (item) {
              await updateTipoServicio(id, { activo: !item.activo });
              setTiposServicio(
                tiposServicio.map((s) =>
                  s.id === id ? { ...s, activo: !s.activo } : s
                )
              );
            }
            break;
          }
          case "sociedades": {
            const item = sociedades.find((s) => s.id === id);
            if (item) {
              await updateSociedad(id, { activa: !item.activa });
              setSociedades(
                sociedades.map((s) =>
                  s.id === id ? { ...s, activa: !s.activa } : s
                )
              );
            }
            break;
          }
          case "ingresos": {
            const item = tiposIngreso.find((t) => t.id === id);
            if (item) {
              await updateTipoIngreso(id, { activo: !item.activo });
              setTiposIngreso(
                tiposIngreso.map((t) =>
                  t.id === id ? { ...t, activo: !t.activo } : t
                )
              );
            }
            break;
          }
          case "gastos": {
            const item = tiposGasto.find((t) => t.id === id);
            if (item) {
              await updateTipoGasto(id, { activo: !item.activo });
              setTiposGasto(
                tiposGasto.map((t) =>
                  t.id === id ? { ...t, activo: !t.activo } : t
                )
              );
            }
            break;
          }
          case "cajas": {
            const item = cajas.find((c) => c.id === id);
            if (item) {
              await updateCaja(id, { activa: !item.activa });
              setCajas(
                cajas.map((c) =>
                  c.id === id ? { ...c, activa: !c.activa } : c
                )
              );
            }
            break;
          }
        }
      } catch (e) {
        setError("Error al actualizar el estado");
        console.error(e);
      }
    });
  };

  const handleDelete = async (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        switch (activeTab) {
          case "monedas":
            await deleteMoneda(id);
            setMonedas(monedas.filter((m) => m.id !== id));
            break;
          case "servicios":
            await deleteTipoServicio(id);
            setTiposServicio(tiposServicio.filter((s) => s.id !== id));
            break;
          case "sociedades":
            await deleteSociedad(id);
            setSociedades(sociedades.filter((s) => s.id !== id));
            break;
          case "ingresos":
            await deleteTipoIngreso(id);
            setTiposIngreso(tiposIngreso.filter((t) => t.id !== id));
            break;
          case "gastos":
            await deleteTipoGasto(id);
            setTiposGasto(tiposGasto.filter((t) => t.id !== id));
            break;
          case "cajas":
            await deleteCaja(id);
            setCajas(cajas.filter((c) => c.id !== id));
            break;
        }
        setDeleteConfirm(null);
      } catch (e: any) {
        setError(
          e.message?.includes("foreign key")
            ? "No se puede eliminar porque hay registros que dependen de este elemento"
            : "Error al eliminar"
        );
        console.error(e);
        setDeleteConfirm(null);
      }
    });
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) return;
    if (
      activeTab === "monedas" &&
      (!formData.codigo.trim() || !formData.simbolo.trim())
    )
      return;

    setError(null);
    startTransition(async () => {
      try {
        switch (activeTab) {
          case "monedas": {
            if (editingItem) {
              const updated = await updateMoneda(editingItem.id, {
                codigo: formData.codigo.toUpperCase(),
                nombre: formData.nombre,
                simbolo: formData.simbolo,
                tasaCambio: parseFloat(formData.tasaCambio),
                esPrincipal: formData.esPrincipal,
              });
              setMonedas(
                monedas.map((m) =>
                  m.id === editingItem.id
                    ? {
                        ...m,
                        ...updated,
                        tasaCambio: Number(updated.tasaCambio),
                      }
                    : formData.esPrincipal
                    ? { ...m, esPrincipal: false }
                    : m
                )
              );
            } else {
              const created = await createMoneda({
                codigo: formData.codigo.toUpperCase(),
                nombre: formData.nombre,
                simbolo: formData.simbolo,
                tasaCambio: parseFloat(formData.tasaCambio),
                esPrincipal: formData.esPrincipal,
              });
              const newMoneda = {
                ...created,
                tasaCambio: Number(created.tasaCambio),
              };
              if (formData.esPrincipal) {
                setMonedas([
                  ...monedas.map((m) => ({ ...m, esPrincipal: false })),
                  newMoneda,
                ]);
              } else {
                setMonedas([...monedas, newMoneda]);
              }
            }
            break;
          }
          case "servicios": {
            if (editingItem) {
              await updateTipoServicio(editingItem.id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setTiposServicio(
                tiposServicio.map((s) =>
                  s.id === editingItem.id
                    ? {
                        ...s,
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                      }
                    : s
                )
              );
            } else {
              const created = await createTipoServicio({
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setTiposServicio([
                ...tiposServicio,
                { ...created, activo: true },
              ]);
            }
            break;
          }
          case "sociedades": {
            if (editingItem) {
              await updateSociedad(editingItem.id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setSociedades(
                sociedades.map((s) =>
                  s.id === editingItem.id
                    ? {
                        ...s,
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                      }
                    : s
                )
              );
            } else {
              const created = await createSociedad({
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setSociedades([...sociedades, { ...created, activa: true }]);
            }
            break;
          }
          case "ingresos": {
            if (editingItem) {
              await updateTipoIngreso(editingItem.id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setTiposIngreso(
                tiposIngreso.map((t) =>
                  t.id === editingItem.id
                    ? {
                        ...t,
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                      }
                    : t
                )
              );
            } else {
              const created = await createTipoIngreso({
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setTiposIngreso([...tiposIngreso, { ...created, activo: true }]);
            }
            break;
          }
          case "gastos": {
            if (editingItem) {
              await updateTipoGasto(editingItem.id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setTiposGasto(
                tiposGasto.map((t) =>
                  t.id === editingItem.id
                    ? {
                        ...t,
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                      }
                    : t
                )
              );
            } else {
              const created = await createTipoGasto({
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
              });
              setTiposGasto([...tiposGasto, { ...created, activo: true }]);
            }
            break;
          }
          case "cajas": {
            if (editingItem) {
              await updateCaja(editingItem.id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
                sociedadId: formData.sociedadId || null,
                tipoIngresoId: formData.tipoIngresoId || null,
              });
              setCajas(
                cajas.map((c) =>
                  c.id === editingItem.id
                    ? {
                        ...c,
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        sociedadId: formData.sociedadId || null,
                        tipoIngresoId: formData.tipoIngresoId || null,
                        sociedad: formData.sociedadId
                          ? sociedades.find((s) => s.id === formData.sociedadId)
                            ? {
                                nombre: sociedades.find(
                                  (s) => s.id === formData.sociedadId
                                )!.nombre,
                              }
                            : null
                          : null,
                        tipoIngreso: formData.tipoIngresoId
                          ? tiposIngreso.find(
                              (t) => t.id === formData.tipoIngresoId
                            )
                            ? {
                                nombre: tiposIngreso.find(
                                  (t) => t.id === formData.tipoIngresoId
                                )!.nombre,
                              }
                            : null
                          : null,
                      }
                    : c
                )
              );
            } else {
              const created = await createCaja({
                nombre: formData.nombre,
                descripcion: formData.descripcion || undefined,
                sociedadId: formData.sociedadId || undefined,
                tipoIngresoId: formData.tipoIngresoId || undefined,
              });
              setCajas([
                ...cajas,
                {
                  ...created,
                  activa: true,
                  sociedad: formData.sociedadId
                    ? sociedades.find((s) => s.id === formData.sociedadId)
                      ? {
                          nombre: sociedades.find(
                            (s) => s.id === formData.sociedadId
                          )!.nombre,
                        }
                      : null
                    : null,
                  tipoIngreso: formData.tipoIngresoId
                    ? tiposIngreso.find((t) => t.id === formData.tipoIngresoId)
                      ? {
                          nombre: tiposIngreso.find(
                            (t) => t.id === formData.tipoIngresoId
                          )!.nombre,
                        }
                      : null
                    : null,
                },
              ]);
            }
            break;
          }
        }
        setShowModal(false);
        setFormData({
          nombre: "",
          descripcion: "",
          sociedadId: "",
          tipoIngresoId: "",
          codigo: "",
          simbolo: "",
          tasaCambio: "1",
          esPrincipal: false,
        });
      } catch (e: any) {
        setError(
          e.message?.includes("Unique constraint")
            ? "Ya existe un elemento con ese nombre o código"
            : "Error al guardar"
        );
        console.error(e);
      }
    });
  };

  // Helper para determinar si un item está activo
  const isActive = (item: any) => item.activa ?? item.activo ?? true;

  // Columnas base
  const baseColumns = [
    {
      key: "nombre",
      header: "Nombre",
      render: (item: any) => (
        <span className="font-medium text-[#203b46]">{item.nombre}</span>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      render: (item: any) => (
        <span className="text-[#73a9bf]">{item.descripcion || "-"}</span>
      ),
    },
  ];

  const cajasExtraColumns = [
    {
      key: "sociedad",
      header: "Sociedad Asignada",
      render: (item: CajaData) =>
        item.sociedad?.nombre ? (
          <Badge variant="info">{item.sociedad.nombre}</Badge>
        ) : (
          <span className="text-[#73a9bf] text-sm italic">General</span>
        ),
    },
    {
      key: "tipoIngreso",
      header: "Tipo de Ingreso",
      render: (item: CajaData) =>
        item.tipoIngreso?.nombre ? (
          <Badge variant="success">{item.tipoIngreso.nombre}</Badge>
        ) : (
          <span className="text-[#73a9bf] text-sm italic">Varios</span>
        ),
    },
  ];

  const monedasColumns = [
    {
      key: "codigo",
      header: "Código",
      render: (item: MonedaData) => (
        <span className="font-mono font-semibold text-[#203b46]">
          {item.codigo}
        </span>
      ),
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (item: MonedaData) => (
        <span className="font-medium text-[#203b46]">{item.nombre}</span>
      ),
    },
    {
      key: "simbolo",
      header: "Símbolo",
      render: (item: MonedaData) => (
        <span className="text-xl font-semibold text-[#40768c]">
          {item.simbolo}
        </span>
      ),
    },
    {
      key: "tasaCambio",
      header: "Tasa de Cambio",
      render: (item: MonedaData) => (
        <span className="text-[#73a9bf]">{item.tasaCambio.toFixed(4)}</span>
      ),
    },
    {
      key: "esPrincipal",
      header: "Principal",
      render: (item: MonedaData) =>
        item.esPrincipal ? (
          <Badge variant="warning">★ Principal</Badge>
        ) : (
          <span className="text-[#73a9bf] text-sm">-</span>
        ),
    },
  ];

  const actionColumns = [
    {
      key: "estado",
      header: "Estado",
      render: (item: any) => (
        <Badge variant={isActive(item) ? "success" : "default"}>
          {isActive(item) ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(item)}
            disabled={isPending}
            className="p-1.5 text-[#40768c] hover:bg-[#eef4f7] rounded-lg transition-colors disabled:opacity-50"
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
            disabled={isPending}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isActive(item)
                ? "text-[#b1871b] hover:bg-[#fcf6e9]"
                : "text-[#2ba193] hover:bg-[#ebfaf8]"
            }`}
            title={isActive(item) ? "Desactivar" : "Activar"}
          >
            {isActive(item) ? (
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
                disabled={isPending}
                className="p-1.5 text-white bg-[#e0451f] rounded-lg hover:bg-[#b43718] transition-colors disabled:opacity-50"
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
              disabled={isPending}
              className="p-1.5 text-[#e0451f] hover:bg-[#fcece9] rounded-lg transition-colors disabled:opacity-50"
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

  const getColumns = (): any[] => {
    if (activeTab === "cajas")
      return [...baseColumns, ...cajasExtraColumns, ...actionColumns];
    if (activeTab === "monedas") return [...monedasColumns, ...actionColumns];
    return [...baseColumns, ...actionColumns];
  };

  const getActiveCount = () => {
    const data = getCurrentData();
    return (data as any[]).filter((item) => isActive(item)).length;
  };

  return (
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
                setError(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-[#305969] text-white shadow-md"
                  : "bg-white text-[#40768c] hover:bg-[#eef4f7] border border-[#b9d4df]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-[#fcece9] border border-[#e0451f] rounded-lg text-[#b43718]">
          {error}
        </div>
      )}

      {/* Contenido de la pestaña */}
      {activeTab === "usuarios" ? (
        <UsuariosConfig />
      ) : (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#203b46]">
                {getTabLabel()}
              </h3>
              <p className="text-sm text-[#73a9bf]">
                {getActiveCount()} activos de {getCurrentData().length}{" "}
                registros
                {isPending && (
                  <span className="ml-2 text-[#dea821]">Guardando...</span>
                )}
              </p>
            </div>
            <Button onClick={handleAdd} disabled={isPending}>
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
              data={getCurrentData() as any[]}
              emptyMessage="No hay registros configurados. ¡Agrega el primero!"
            />
          </div>
        </Card>
      )}

      {/* Información adicional */}
      {activeTab !== "usuarios" && (
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
      )}

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
              {activeTab === "monedas" ? (
                <>
                  <Input
                    label="Código de Moneda"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        codigo: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="USD, GTQ, EUR"
                    required
                    maxLength={3}
                  />
                  <Input
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Dólar estadounidense, Quetzal, Euro"
                    required
                  />
                  <Input
                    label="Símbolo"
                    value={formData.simbolo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        simbolo: e.target.value,
                      }))
                    }
                    placeholder="$, Q, €"
                    required
                    maxLength={2}
                  />
                  <Input
                    label="Tasa de Cambio"
                    type="number"
                    value={formData.tasaCambio}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tasaCambio: e.target.value,
                      }))
                    }
                    placeholder="1.0000"
                    required
                    step="0.0001"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="esPrincipal"
                      checked={formData.esPrincipal}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          esPrincipal: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-[#2ba193] bg-gray-100 border-gray-300 rounded focus:ring-[#2ba193] focus:ring-2"
                    />
                    <label
                      htmlFor="esPrincipal"
                      className="text-sm font-medium text-[#305969]"
                    >
                      Establecer como moneda principal
                    </label>
                  </div>
                  <div className="p-3 bg-[#fcf6e9] rounded-lg border border-[#f2dca6]">
                    <p className="text-xs text-[#856514]">
                      <strong>Nota:</strong> La moneda principal sirve como
                      referencia para las tasas de cambio.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Input
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
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
                          determinan qué ingresos se asignan automáticamente a
                          esta caja.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.nombre.trim() || isPending}
              >
                {isPending
                  ? "Guardando..."
                  : editingItem
                  ? "Guardar Cambios"
                  : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
