"use client";

import { useState, useTransition } from "react";
import { Card, Button, Input, Badge, Table } from "@/components/ui";
import {
  obtenerLogAuditoria,
  type FiltrosAuditoria,
} from "@/app/actions/operaciones";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
}

interface LogAuditoriaItem {
  id: string;
  tabla: string;
  registroId: string;
  operacion: "CREATE" | "UPDATE" | "DELETE";
  datoAnterior: Record<string, any> | null;
  datoNuevo: Record<string, any> | null;
  descripcion: string | null;
  fechaOperacion: Date;
  usuario: Usuario;
}

interface AuditoriaViewProps {
  usuarios: any[];
}

export function AuditoriaView({ usuarios }: AuditoriaViewProps) {
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<LogAuditoriaItem[]>([]);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({
    limite: 50,
  });
  const [mostrarDetalle, setMostrarDetalle] = useState<string | null>(null);

  const cargarLogs = () => {
    startTransition(async () => {
      try {
        const datos = await obtenerLogAuditoria(filtros);
        setLogs(datos as LogAuditoriaItem[]);
      } catch (error) {
        console.error("Error al cargar auditoría:", error);
      }
    });
  };

  const obtenerColorOperacion = (operacion: string) => {
    switch (operacion) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const obtenerIconoOperacion = (operacion: string) => {
    switch (operacion) {
      case "CREATE":
        return "➕";
      case "UPDATE":
        return "✏️";
      case "DELETE":
        return "🗑️";
      default:
        return "❓";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-[#203b46] mb-4">
          Log de Auditoría
        </h2>
        <p className="text-[#73a9bf] mb-6">
          Monitorea todos los cambios realizados en la configuración del
          sistema.
        </p>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#203b46] mb-2">
              Usuario
            </label>
            <select
              value={filtros.usuarioId || ""}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  usuarioId: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-[#dceaef] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40768c]"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#203b46] mb-2">
              Tabla
            </label>
            <Input
              placeholder="Ej: Moneda, Caja..."
              value={filtros.tabla || ""}
              onChange={(e) =>
                setFiltros({ ...filtros, tabla: e.target.value || undefined })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#203b46] mb-2">
              Operación
            </label>
            <select
              value={filtros.operacion || ""}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  operacion: (e.target.value || undefined) as
                    | "CREATE"
                    | "UPDATE"
                    | "DELETE"
                    | undefined,
                })
              }
              className="w-full px-3 py-2 border border-[#dceaef] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40768c]"
            >
              <option value="">Todas</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Modificar</option>
              <option value="DELETE">Eliminar</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={cargarLogs}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Cargando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {/* Tabla de resultados */}
        {logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#203b46]">
                  <th className="px-4 py-3 text-left text-white">Fecha</th>
                  <th className="px-4 py-3 text-left text-white">Operación</th>
                  <th className="px-4 py-3 text-left text-white">Tabla</th>
                  <th className="px-4 py-3 text-left text-white">Usuario</th>
                  <th className="px-4 py-3 text-left text-white">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-center text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}
                  >
                    <td className="px-4 py-3 text-[#73a9bf]">
                      {new Date(log.fechaOperacion).toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${obtenerColorOperacion(
                          log.operacion
                        )} px-2 py-1`}
                      >
                        {obtenerIconoOperacion(log.operacion)} {log.operacion}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#203b46]">
                      {log.tabla}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#203b46]">
                        {log.usuario.nombre} {log.usuario.apellido}
                      </div>
                      <div className="text-xs text-[#73a9bf]">
                        {log.usuario.correo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#73a9bf]">
                      {log.descripcion ? (
                        <div className="max-w-xs truncate">
                          {log.descripcion}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          setMostrarDetalle(
                            mostrarDetalle === log.id ? null : log.id
                          )
                        }
                        className="text-[#40768c] hover:text-[#203b46] font-medium text-sm"
                      >
                        {mostrarDetalle === log.id ? "Ocultar" : "Ver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length === 0 && (
          <div className="text-center py-8 text-[#73a9bf]">
            {isPending ? "Cargando..." : "No hay registros de auditoría"}
          </div>
        )}
      </Card>

      {/* Detalle expandido */}
      {mostrarDetalle && (
        <Card className="p-6 border-l-4 border-l-[#40768c]">
          {logs
            .filter((log) => log.id === mostrarDetalle)
            .map((log) => (
              <div key={log.id}>
                <h3 className="text-lg font-bold text-[#203b46] mb-4">
                  Detalles del cambio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {log.datoAnterior && (
                    <div>
                      <h4 className="font-bold text-[#203b46] mb-3">
                        Dato anterior:
                      </h4>
                      <pre className="bg-[#f0f5f8] p-3 rounded text-xs overflow-auto max-h-64 text-[#203b46]">
                        {JSON.stringify(log.datoAnterior, null, 2)}
                      </pre>
                    </div>
                  )}

                  {log.datoNuevo && (
                    <div>
                      <h4 className="font-bold text-[#203b46] mb-3">
                        Dato nuevo:
                      </h4>
                      <pre className="bg-[#f0f5f8] p-3 rounded text-xs overflow-auto max-h-64 text-[#203b46]">
                        {JSON.stringify(log.datoNuevo, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}
