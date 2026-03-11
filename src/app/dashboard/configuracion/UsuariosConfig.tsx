"use client";

import { useState, useEffect } from "react";
import { Card, Button, Input, Badge, Table, Select } from "@/components/ui";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "@/app/actions/configuraciones";
import { obtenerRoles, type Rol } from "@/app/actions/roles";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  activo: boolean;
  creadoEn: Date;
  rolId: string | null;
  rol?: {
    id: string;
    nombre: string;
  } | null;
}

export function UsuariosConfig() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    rolId: "",
  });

  // Cargar usuarios y roles al montar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, rolesData] = await Promise.all([
        getUsuarios(),
        obtenerRoles(),
      ]);
      setUsuarios(usuariosData);
      setRoles(rolesData.filter((r) => r.activo));
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      contrasena: "",
      confirmarContrasena: "",
      rolId: "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingItem(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      contrasena: "",
      confirmarContrasena: "",
      rolId: usuario.rolId || "",
    });
    setError(null);
    setShowModal(true);
  };

  const handleToggleActive = async (id: string) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    try {
      await updateUsuario(id, { activo: !usuario.activo });
      setUsuarios(
        usuarios.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
      );
    } catch (err) {
      console.error("Error actualizando usuario:", err);
      setError("Error al actualizar usuario");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUsuario(id);
      setUsuarios(usuarios.filter((u) => u.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      setError(
        "No se puede eliminar el usuario (puede tener movimientos asociados)"
      );
      setDeleteConfirm(null);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.correo.trim()
    ) {
      setError("Nombre, apellido y correo son obligatorios");
      return;
    }

    if (!formData.correo.includes("@")) {
      setError("El correo electrónico no es válido");
      return;
    }

    if (!editingItem && !formData.contrasena) {
      setError("La contraseña es obligatoria para nuevos usuarios");
      return;
    }

    if (
      formData.contrasena &&
      formData.contrasena !== formData.confirmarContrasena
    ) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.contrasena && formData.contrasena.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingItem) {
        // Actualizar
        const updateData: {
          nombre?: string;
          apellido?: string;
          correo?: string;
          contrasena?: string;
          rolId?: string | null;
        } = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          rolId: formData.rolId || null,
        };
        if (formData.contrasena) {
          updateData.contrasena = formData.contrasena;
        }
        await updateUsuario(editingItem.id, updateData);
        await loadData();
      } else {
        // Crear nuevo
        await createUsuario({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          contrasena: formData.contrasena,
          rolId: formData.rolId || undefined,
        });
        await loadData();
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error guardando usuario:", err);
      setError("Error al guardar. El correo puede estar en uso.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8 text-[#73a9bf]">
          Cargando usuarios...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#203b46]">
            👤 Usuarios del Sistema
          </h3>
          <p className="text-sm text-[#73a9bf]">
            Administra los usuarios que pueden acceder al sistema
          </p>
        </div>
        <Button onClick={handleAdd}>+ Agregar Usuario</Button>
      </div>

      {/* Error general */}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabla de usuarios */}
      <Card>
        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-[#73a9bf]">
            <p className="text-4xl mb-4">👤</p>
            <p>No hay usuarios registrados</p>
            <p className="text-sm mt-2">
              Agrega el primer usuario para poder acceder al sistema
            </p>
          </div>
        ) : (
          <Table
            columns={[
              {
                key: "nombre",
                header: "Nombre",
                render: (u: Usuario) => (
                  <span className="font-medium">
                    {u.nombre} {u.apellido}
                  </span>
                ),
              },
              {
                key: "correo",
                header: "Correo",
                render: (u: Usuario) => u.correo,
              },
              {
                key: "rol",
                header: "Rol",
                render: (u: Usuario) =>
                  u.rol ? (
                    <Badge variant="info" size="sm">
                      {u.rol.nombre}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">Sin rol</span>
                  ),
              },
              {
                key: "estado",
                header: "Estado",
                render: (u: Usuario) => (
                  <Badge variant={u.activo ? "success" : "danger"}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </Badge>
                ),
              },
              {
                key: "acciones",
                header: "Acciones",
                render: (u: Usuario) => (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleActive(u.id)}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(u)}
                    >
                      Editar
                    </Button>
                    {deleteConfirm === u.id ? (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(u.id)}
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
                      </>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirm(u.id)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={usuarios}
          />
        )}
      </Card>

      {/* Modal para agregar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-[#203b46] mb-4">
              {editingItem ? "Editar Usuario" : "Nuevo Usuario"}
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Juan"
                  required
                />
                <Input
                  label="Apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                  placeholder="Pérez"
                  required
                />
              </div>

              <Input
                label="Correo electrónico"
                type="email"
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
                placeholder="juan@iglesia.com"
                required
              />

              <Select
                label="Rol"
                value={formData.rolId}
                onChange={(e) =>
                  setFormData({ ...formData, rolId: e.target.value })
                }
                options={[
                  { value: "", label: "Sin rol asignado" },
                  ...roles.map((rol) => ({
                    value: rol.id,
                    label: `${rol.nombre}${
                      rol.esAdmin ? " (Acceso total)" : ""
                    }`,
                  })),
                ]}
              />

              <Input
                label={
                  editingItem ? "Nueva contraseña (opcional)" : "Contraseña"
                }
                type="password"
                value={formData.contrasena}
                onChange={(e) =>
                  setFormData({ ...formData, contrasena: e.target.value })
                }
                placeholder="••••••••"
                required={!editingItem}
              />

              {formData.contrasena && (
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  value={formData.confirmarContrasena}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmarContrasena: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  required
                />
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                isLoading={saving}
                className="flex-1"
              >
                {editingItem ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
