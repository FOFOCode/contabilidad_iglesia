"use client";

import { useState, useEffect } from "react";
import {
  obtenerRoles,
  obtenerPermisos,
  obtenerRolConPermisos,
  crearRol,
  actualizarRol,
  actualizarPermisosRol,
  eliminarRol,
  type Rol,
  type Permiso,
  type RolConPermisos,
} from "@/app/actions/roles";
import { Button, Input, Card, Badge } from "@/components/ui";

type PermisoConfig = {
  permisoId: string;
  nombre: string;
  modulo: string;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
};

export default function RolesConfig() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolConPermisos | null>(
    null
  );
  const [modoEdicion, setModoEdicion] = useState<
    "lista" | "nuevo" | "editar" | "permisos"
  >("lista");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Form states
  const [nombreRol, setNombreRol] = useState("");
  const [descripcionRol, setDescripcionRol] = useState("");
  const [permisosConfig, setPermisosConfig] = useState<PermisoConfig[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [rolesData, permisosData] = await Promise.all([
        obtenerRoles(),
        obtenerPermisos(),
      ]);
      setRoles(rolesData);
      setPermisos(permisosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleNuevoRol = () => {
    setNombreRol("");
    setDescripcionRol("");
    setModoEdicion("nuevo");
  };

  const handleEditarRol = async (rol: Rol) => {
    const rolCompleto = await obtenerRolConPermisos(rol.id);
    if (rolCompleto) {
      setRolSeleccionado(rolCompleto);
      setNombreRol(rolCompleto.nombre);
      setDescripcionRol(rolCompleto.descripcion || "");
      setModoEdicion("editar");
    }
  };

  const handleConfigurarPermisos = async (rol: Rol) => {
    const rolCompleto = await obtenerRolConPermisos(rol.id);
    if (rolCompleto) {
      setRolSeleccionado(rolCompleto);

      // Crear configuración de permisos
      const config: PermisoConfig[] = permisos.map((permiso) => {
        const permisoExistente = rolCompleto.permisos.find(
          (rp) => rp.permisoId === permiso.id
        );

        return {
          permisoId: permiso.id,
          nombre: permiso.nombre,
          modulo: permiso.modulo,
          puedeVer: permisoExistente?.puedeVer || false,
          puedeCrear: permisoExistente?.puedeCrear || false,
          puedeEditar: permisoExistente?.puedeEditar || false,
          puedeEliminar: permisoExistente?.puedeEliminar || false,
        };
      });

      setPermisosConfig(config);
      setModoEdicion("permisos");
    }
  };

  const handleGuardarRol = async () => {
    if (!nombreRol.trim()) {
      alert("El nombre del rol es requerido");
      return;
    }

    setGuardando(true);
    try {
      if (modoEdicion === "nuevo") {
        const resultado = await crearRol({
          nombre: nombreRol,
          descripcion: descripcionRol,
        });

        if (resultado.success) {
          await cargarDatos();
          setModoEdicion("lista");
        } else {
          alert(resultado.error || "Error al crear el rol");
        }
      } else if (modoEdicion === "editar" && rolSeleccionado) {
        const resultado = await actualizarRol(rolSeleccionado.id, {
          nombre: nombreRol,
          descripcion: descripcionRol,
        });

        if (resultado.success) {
          await cargarDatos();
          setModoEdicion("lista");
        } else {
          alert(resultado.error || "Error al actualizar el rol");
        }
      }
    } catch (error) {
      alert("Error al guardar el rol");
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarPermisos = async () => {
    if (!rolSeleccionado) return;

    // Solo enviar permisos donde al menos una opción esté habilitada
    const permisosActivos = permisosConfig.filter(
      (p) => p.puedeVer || p.puedeCrear || p.puedeEditar || p.puedeEliminar
    );

    setGuardando(true);
    try {
      const resultado = await actualizarPermisosRol(
        rolSeleccionado.id,
        permisosActivos
      );

      if (resultado.success) {
        await cargarDatos();
        setModoEdicion("lista");
      } else {
        alert(resultado.error || "Error al guardar permisos");
      }
    } catch (error) {
      alert("Error al guardar permisos");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarRol = async (rolId: string) => {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;

    setGuardando(true);
    try {
      const resultado = await eliminarRol(rolId);

      if (resultado.success) {
        await cargarDatos();
      } else {
        alert(resultado.error || "Error al eliminar el rol");
      }
    } catch (error) {
      alert("Error al eliminar el rol");
    } finally {
      setGuardando(false);
    }
  };

  const togglePermisoCompleto = (permisoId: string, valor: boolean) => {
    setPermisosConfig((prev) =>
      prev.map((p) =>
        p.permisoId === permisoId
          ? {
              ...p,
              puedeVer: valor,
              puedeCrear: valor,
              puedeEditar: valor,
              puedeEliminar: valor,
            }
          : p
      )
    );
  };

  const updatePermiso = (
    permisoId: string,
    campo: keyof PermisoConfig,
    valor: boolean
  ) => {
    setPermisosConfig((prev) =>
      prev.map((p) =>
        p.permisoId === permisoId ? { ...p, [campo]: valor } : p
      )
    );
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando roles...</div>
      </div>
    );
  }

  // Vista de lista de roles
  if (modoEdicion === "lista") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Roles del Sistema
            </h3>
            <p className="text-sm text-gray-600">
              Gestiona los roles y sus permisos de acceso
            </p>
          </div>
          <Button onClick={handleNuevoRol}>+ Nuevo Rol</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((rol) => (
            <Card key={rol.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">
                      {rol.nombre}
                    </h4>
                    {rol.esAdmin && (
                      <Badge variant="success" size="sm">
                        Admin
                      </Badge>
                    )}
                    {!rol.activo && (
                      <Badge variant="danger" size="sm">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  {rol.descripcion && (
                    <p className="text-sm text-gray-600">{rol.descripcion}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{rol._count?.usuarios || 0} usuarios</span>
                <span>{rol._count?.permisos || 0} permisos</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleConfigurarPermisos(rol)}
                  disabled={rol.esAdmin}
                  className="flex-1"
                >
                  Permisos
                </Button>
                {!rol.esAdmin && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditarRol(rol)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleEliminarRol(rol.id)}
                      disabled={guardando}
                    >
                      ×
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Vista de crear/editar rol
  if (modoEdicion === "nuevo" || modoEdicion === "editar") {
    return (
      <div className="max-w-2xl">
        <div className="mb-4">
          <Button
            variant="secondary"
            onClick={() => setModoEdicion("lista")}
            className="mb-4"
          >
            ← Volver
          </Button>
          <h3 className="text-lg font-semibold text-gray-800">
            {modoEdicion === "nuevo" ? "Nuevo Rol" : "Editar Rol"}
          </h3>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Rol *
              </label>
              <Input
                value={nombreRol}
                onChange={(e) => setNombreRol(e.target.value)}
                placeholder="Ej: Tesorero, Capturista"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <Input
                value={descripcionRol}
                onChange={(e) => setDescripcionRol(e.target.value)}
                placeholder="Describe las funciones de este rol"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleGuardarRol} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar Rol"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setModoEdicion("lista")}
                disabled={guardando}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Vista de configurar permisos
  if (modoEdicion === "permisos" && rolSeleccionado) {
    return (
      <div>
        <div className="mb-4">
          <Button
            variant="secondary"
            onClick={() => setModoEdicion("lista")}
            className="mb-4"
          >
            ← Volver
          </Button>
          <h3 className="text-lg font-semibold text-gray-800">
            Permisos de: {rolSeleccionado.nombre}
          </h3>
          <p className="text-sm text-gray-600">
            Selecciona qué puede hacer este rol en cada módulo
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 pb-2 border-b text-sm font-medium text-gray-700">
              <div>Módulo</div>
              <div className="text-center">Ver</div>
              <div className="text-center">Crear</div>
              <div className="text-center">Editar</div>
              <div className="text-center">Eliminar</div>
            </div>

            {permisosConfig.map((permiso) => {
              const tieneAlgunPermiso =
                permiso.puedeVer ||
                permiso.puedeCrear ||
                permiso.puedeEditar ||
                permiso.puedeEliminar;

              return (
                <div
                  key={permiso.permisoId}
                  className="grid grid-cols-5 gap-4 items-center py-2 hover:bg-gray-50 rounded"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tieneAlgunPermiso}
                        onChange={(e) =>
                          togglePermisoCompleto(
                            permiso.permisoId,
                            e.target.checked
                          )
                        }
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-800">
                          {permiso.nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {permiso.modulo}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <input
                      type="checkbox"
                      checked={permiso.puedeVer}
                      onChange={(e) =>
                        updatePermiso(
                          permiso.permisoId,
                          "puedeVer",
                          e.target.checked
                        )
                      }
                      className="rounded"
                    />
                  </div>

                  <div className="text-center">
                    <input
                      type="checkbox"
                      checked={permiso.puedeCrear}
                      onChange={(e) =>
                        updatePermiso(
                          permiso.permisoId,
                          "puedeCrear",
                          e.target.checked
                        )
                      }
                      className="rounded"
                      disabled={!permiso.puedeVer}
                    />
                  </div>

                  <div className="text-center">
                    <input
                      type="checkbox"
                      checked={permiso.puedeEditar}
                      onChange={(e) =>
                        updatePermiso(
                          permiso.permisoId,
                          "puedeEditar",
                          e.target.checked
                        )
                      }
                      className="rounded"
                      disabled={!permiso.puedeVer}
                    />
                  </div>

                  <div className="text-center">
                    <input
                      type="checkbox"
                      checked={permiso.puedeEliminar}
                      onChange={(e) =>
                        updatePermiso(
                          permiso.permisoId,
                          "puedeEliminar",
                          e.target.checked
                        )
                      }
                      className="rounded"
                      disabled={!permiso.puedeVer}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-6 border-t mt-6">
            <Button onClick={handleGuardarPermisos} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Permisos"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModoEdicion("lista")}
              disabled={guardando}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
