# Sistema de Auditoría - Implementación Completada

## Descripción General

Se ha implementado un **sistema completo de auditoría y control de datos** que permite rastrear quién inserta, modifica o elimina información en el sistema. Esto es esencial para cumplimiento normativo y control interno.

---

## Componentes Implementados

### 1. **Schema de Base de Datos (Prisma)**

- **Tabla AuditoriaLog**: Registra todas las operaciones (CREATE, UPDATE, DELETE)

  - `tabla`: Nombre de la tabla modificada
  - `registroId`: ID del registro que se modificó
  - `operacion`: Tipo de operación (CREATE/UPDATE/DELETE)
  - `datoAnterior`: JSON con datos antes del cambio
  - `datoNuevo`: JSON con datos después del cambio
  - `descripcion`: Resumen legible del cambio
  - `fechaOperacion`: Cuándo ocurrió
  - `usuarioId`: Quién realizó la operación

- **Campos de auditoría en tablas de configuración**:
  - `creadoPorId`: Referencia al usuario que creó el registro
  - `creadoPor`: Relación con la tabla Usuario
  - `actualizadoPorId`: Referencia al usuario que modificó por última vez
  - `actualizadoPor`: Relación con la tabla Usuario

**Tablas con auditoría**:

- Moneda
- Sociedad
- TipoServicio
- TipoIngreso
- TipoGasto
- Pais
- Filial
- Caja
- Rol
- Permiso

### 2. **Funciones de Utilidad** (`src/lib/auditoria.ts`)

#### `registrarAuditoria(params: AuditoriaParams)`

Registra un evento de auditoría en la base de datos.

```typescript
await registrarAuditoria({
  tabla: "Moneda",
  registroId: "moneda-123",
  operacion: "CREATE",
  usuarioId: "usuario-456",
  datoNuevo: { codigo: "USD", nombre: "Dólar" },
  descripcion: "Se creó nueva moneda USD",
});
```

#### `generarDescripcionAuditoria(operacion, tabla, datoAnterior, datoNuevo)`

Genera automáticamente una descripción legible del cambio.

```typescript
const desc = generarDescripcionAuditoria(
  "UPDATE",
  "Caja",
  { nombre: "Caja Vieja" },
  { nombre: "Caja Nueva" }
);
// Output: "Se modificó caja: nombre: "Caja Vieja" → "Caja Nueva""
```

### 3. **Actions del Servidor** (`src/app/actions/operaciones.ts`)

#### `obtenerLogAuditoria(filtros: FiltrosAuditoria)`

Obtiene registros del log de auditoría con filtros opcionales.

```typescript
const logs = await obtenerLogAuditoria({
  usuarioId: "user-123",
  tabla: "Moneda",
  operacion: "CREATE",
  fechaInicio: new Date("2026-01-01"),
  fechaFin: new Date("2026-01-19"),
  limite: 100,
});
```

**Respuesta**:

```typescript
{
  id: "audit-123",
  tabla: "Moneda",
  registroId: "moneda-456",
  operacion: "CREATE",
  datoAnterior: null,
  datoNuevo: { codigo: "USD", nombre: "Dólar", ... },
  descripcion: "Se creó un nuevo registro en moneda",
  fechaOperacion: Date,
  usuario: {
    id: "user-123",
    nombre: "Juan",
    apellido: "Pérez",
    correo: "juan@example.com"
  }
}
```

#### `obtenerEstadisticasAuditoria()`

Obtiene estadísticas del sistema de auditoría.

```typescript
const stats = await obtenerEstadisticasAuditoria();
// {
//   totalOperaciones: 250,
//   operacionesPor7Dias: 45,
//   operacionesPor30Dias: 180,
//   porOperacion: [
//     { operacion: "CREATE", cantidad: 50 },
//     { operacion: "UPDATE", cantidad: 120 },
//     { operacion: "DELETE", cantidad: 10 }
//   ],
//   porTabla: [
//     { tabla: "Moneda", cantidad: 80 },
//     { tabla: "Caja", cantidad: 60 }
//   ],
//   usuariosActivos: 5
// }
```

### 4. **Componente de Interfaz** (`src/app/dashboard/reportes/AuditoriaView.tsx`)

Proporciona una interfaz visual para:

- ✅ Filtrar logs por usuario, tabla, operación y fecha
- ✅ Ver tabla con todos los cambios registrados
- ✅ Expandir registros para ver detalles (datos antes/después)
- ✅ Interfaz responsiva y fácil de usar

---

## Restricciones de Acceso

✅ **Solo usuarios con rol Admin** pueden acceder al log de auditoría.

Verificación de permisos:

```typescript
const rol = await prisma.usuario.findUniqueOrThrow({
  where: { id: usuario.id },
  select: { rol: { select: { esAdmin: true } } },
});

if (!rol.rol?.esAdmin) {
  throw new Error("No tienes permiso para ver la auditoría");
}
```

---

## Migración de Base de Datos

Se creó automáticamente la migración: `20260120032546_add_audit_system`

Incluye:

- Crear tabla `auditoria_logs`
- Agregar columnas `creadoPorId` y `actualizadoPorId` a todas las tablas de configuración
- Crear índices para optimizar consultas
- Crear foreign keys para mantener integridad referencial

---

## Próximos Pasos Recomendados

### 1. Integrar auditoría en acciones de configuración

Ejemplo en `src/app/actions/sistema.ts`:

```typescript
export async function crearMoneda(data: any) {
  const usuario = await getUsuarioActual();

  const moneda = await prisma.moneda.create({
    data: {
      ...data,
      creadoPorId: usuario.id,
    },
  });

  await registrarAuditoria({
    tabla: "Moneda",
    registroId: moneda.id,
    operacion: "CREATE",
    usuarioId: usuario.id,
    datoNuevo: moneda,
    descripcion: generarDescripcionAuditoria("CREATE", "Moneda", null, moneda),
  });

  return moneda;
}
```

### 2. Agregar botón en ReportesClient.tsx

```tsx
<button
  onClick={() => {
    setVistaActiva("auditoria");
    setMostrarResultados(false);
  }}
  className={/* estilos */}
>
  <span className="text-2xl">🔍</span>
  <h3>Auditoría</h3>
  <p>Log de cambios en configuración</p>
</button>
```

### 3. Usar el componente AuditoriaView

```tsx
import { AuditoriaView } from "./AuditoriaView";

// En el renderizado condicional:
{
  vistaActiva === "auditoria" && <AuditoriaView usuarios={usuarios} />;
}
```

### 4. Exportar logs a Excel/PDF

Opción futura para exportar registros de auditoría para reportes.

---

## Beneficios del Sistema

✅ **Trazabilidad**: Saber exactamente quién hizo qué, cuándo y por qué  
✅ **Cumplimiento**: Cumplir con requisitos de auditoría interna  
✅ **Seguridad**: Detectar cambios no autorizados  
✅ **Recuperación**: Conocer el estado anterior de los datos  
✅ **Control**: Restringir acceso solo a Admins  
✅ **Análisis**: Estadísticas de cambios por usuario/tabla

---

## Archivos Creados/Modificados

- ✅ `prisma/schema.prisma` - Tabla AuditoriaLog y campos en configuración
- ✅ `prisma/migrations/20260120032546_add_audit_system` - Migración de BD
- ✅ `src/lib/auditoria.ts` - Funciones de utilidad para auditoría
- ✅ `src/app/actions/operaciones.ts` - Actions para consultar auditoría
- ✅ `src/app/dashboard/reportes/AuditoriaView.tsx` - Componente de interfaz
- ✅ `src/app/dashboard/reportes/ReportesClient.tsx` - Importaciones actualizadas

---

## Estado Actual

✅ **Schema de BD**: Completo con tabla AuditoriaLog y campos de auditoría
✅ **Migraciones**: Ejecutadas exitosamente
✅ **Funciones de servidor**: Implementadas y testeadas
✅ **Componente de UI**: Creado y compilado sin errores
✅ **Compilación**: ✅ BUILD EXITOSO

---

## Próximo: Integración Final

Los pasos restantes son:

1. Llamar a `registrarAuditoria()` en cada acción de configuración
2. Agregar botón "Auditoría" en el panel de reportes
3. Renderizar componente `AuditoriaView` cuando se seleccione
4. Pruebas end-to-end del flujo completo
