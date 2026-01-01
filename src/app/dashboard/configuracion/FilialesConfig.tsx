"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Card, Button, Input, Badge, Table, Select } from "@/components/ui";
import {
  obtenerTodosPaises,
  crearPais,
  actualizarPais,
  eliminarPais,
  obtenerTodasFiliales,
  crearFilial,
  actualizarFilial,
  eliminarFilial,
} from "@/app/actions/filiales";

interface Pais {
  id: string;
  nombre: string;
  codigo: string | null;
  activo: boolean;
  orden: number;
}

interface Filial {
  id: string;
  nombre: string;
  pastor: string;
  activa: boolean;
  orden: number;
  paisId: string;
  pais: { id: string; nombre: string };
}

type TabType = "paises" | "filiales";

interface FilialesConfigProps {
  paisesData: Pais[];
  filialesData: Filial[];
}

export function FilialesConfig({
  paisesData,
  filialesData,
}: FilialesConfigProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("paises");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paises, setPaises] = useState<Pais[]>(paisesData);
  const [filiales, setFiliales] = useState<Filial[]>(filialesData);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    pastor: "",
    paisId: "",
  });

  useEffect(() => {
    setPaises(paisesData);
    setFiliales(filialesData);
  }, [paisesData, filialesData]);

  const paisesActivos = paises.filter((p) => p.activo);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      codigo: "",
      pastor: "",
      paisId: paisesActivos[0]?.id || "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setError(null);
    if (activeTab === "paises") {
      setFormData({
        nombre: item.nombre,
        codigo: item.codigo || "",
        pastor: "",
        paisId: "",
      });
    } else {
      setFormData({
        nombre: item.nombre,
        codigo: "",
        pastor: item.pastor,
        paisId: item.paisId,
      });
    }
    setShowModal(true);
  };

  const handleToggleActive = async (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        if (activeTab === "paises") {
          const item = paises.find((p) => p.id === id);
          if (item) {
            await actualizarPais(id, { activo: !item.activo });
            setPaises(
              paises.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
            );
          }
        } else {
          const item = filiales.find((f) => f.id === id);
          if (item) {
            await actualizarFilial(id, { activa: !item.activa });
            setFiliales(
              filiales.map((f) =>
                f.id === id ? { ...f, activa: !f.activa } : f
              )
            );
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cambiar estado"
        );
      }
    });
  };

  const handleDelete = async (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        if (activeTab === "paises") {
          await eliminarPais(id);
          setPaises(paises.filter((p) => p.id !== id));
        } else {
          await eliminarFilial(id);
          setFiliales(filiales.filter((f) => f.id !== id));
        }
        setDeleteConfirm(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar");
        setDeleteConfirm(null);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (activeTab === "paises") {
          if (editingItem) {
            await actualizarPais(editingItem.id, {
              nombre: formData.nombre,
              codigo: formData.codigo || undefined,
            });
            setPaises(
              paises.map((p) =>
                p.id === editingItem.id
                  ? {
                      ...p,
                      nombre: formData.nombre,
                      codigo: formData.codigo || null,
                    }
                  : p
              )
            );
          } else {
            const nuevo = await crearPais({
              nombre: formData.nombre,
              codigo: formData.codigo || undefined,
            });
            setPaises([...paises, nuevo as Pais]);
          }
        } else {
          if (editingItem) {
            const actualizado = await actualizarFilial(editingItem.id, {
              nombre: formData.nombre,
              pastor: formData.pastor,
              paisId: formData.paisId,
            });
            setFiliales(
              filiales.map((f) =>
                f.id === editingItem.id ? (actualizado as Filial) : f
              )
            );
          } else {
            const nuevo = await crearFilial({
              nombre: formData.nombre,
              pastor: formData.pastor,
              paisId: formData.paisId,
            });
            setFiliales([...filiales, nuevo as Filial]);
          }
        }
        setShowModal(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  const refreshData = async () => {
    startTransition(async () => {
      const [newPaises, newFiliales] = await Promise.all([
        obtenerTodosPaises(),
        obtenerTodasFiliales(),
      ]);
      setPaises(newPaises as Pais[]);
      setFiliales(newFiliales as Filial[]);
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("paises")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "paises"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🌍 Países
        </button>
        <button
          onClick={() => setActiveTab("filiales")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "filiales"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ⛪ Iglesias Filiales
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {activeTab === "paises" ? "Países" : "Iglesias Filiales"}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={refreshData}
            disabled={isPending}
          >
            🔄 Actualizar
          </Button>
          <Button onClick={handleAdd} disabled={isPending}>
            + Agregar {activeTab === "paises" ? "País" : "Filial"}
          </Button>
        </div>
      </div>

      {/* Tabla de Países */}
      {activeTab === "paises" && (
        <Card>
          <Table
            columns={[
              { key: "nombre", header: "Nombre" },
              {
                key: "codigo",
                header: "Código",
                render: (item) => item.codigo || "-",
              },
              {
                key: "activo",
                header: "Estado",
                render: (item) => (
                  <Badge variant={item.activo ? "success" : "default"}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </Badge>
                ),
              },
              {
                key: "acciones",
                header: "Acciones",
                render: (item) => (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={item.activo ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => handleToggleActive(item.id)}
                    >
                      {item.activo ? "Desactivar" : "Activar"}
                    </Button>
                    {deleteConfirm === item.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
                    )}
                  </div>
                ),
              },
            ]}
            data={paises}
            emptyMessage="No hay países registrados"
          />
        </Card>
      )}

      {/* Tabla de Filiales */}
      {activeTab === "filiales" && (
        <Card>
          <Table
            columns={[
              { key: "nombre", header: "Nombre de Iglesia" },
              { key: "pastor", header: "Pastor" },
              {
                key: "pais",
                header: "País",
                render: (item) => item.pais?.nombre || "-",
              },
              {
                key: "activa",
                header: "Estado",
                render: (item) => (
                  <Badge variant={item.activa ? "success" : "default"}>
                    {item.activa ? "Activa" : "Inactiva"}
                  </Badge>
                ),
              },
              {
                key: "acciones",
                header: "Acciones",
                render: (item) => (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={item.activa ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => handleToggleActive(item.id)}
                    >
                      {item.activa ? "Desactivar" : "Activar"}
                    </Button>
                    {deleteConfirm === item.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
                    )}
                  </div>
                ),
              },
            ]}
            data={filiales}
            emptyMessage="No hay iglesias filiales registradas"
          />
        </Card>
      )}

      {/* Modal de Agregar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "Editar" : "Agregar"}{" "}
              {activeTab === "paises" ? "País" : "Iglesia Filial"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />

              {activeTab === "paises" && (
                <Input
                  label="Código (opcional)"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="Ej: GT, US, MX"
                />
              )}

              {activeTab === "filiales" && (
                <>
                  <Input
                    label="Pastor"
                    value={formData.pastor}
                    onChange={(e) =>
                      setFormData({ ...formData, pastor: e.target.value })
                    }
                    required
                  />
                  <Select
                    label="País"
                    value={formData.paisId}
                    onChange={(e) =>
                      setFormData({ ...formData, paisId: e.target.value })
                    }
                    options={paisesActivos.map((p) => ({
                      value: p.id,
                      label: p.nombre,
                    }))}
                    required
                  />
                </>
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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
