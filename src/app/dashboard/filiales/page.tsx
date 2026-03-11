import { Header } from "@/components/layout";
import { FilialesClient } from "./FilialesClient";
import {
  obtenerResumenFiliales,
  obtenerDiezmosFiliales,
  obtenerEgresosFiliales,
} from "@/app/actions/filiales";
import { getUsuarioActual } from "@/app/actions/auth";
import { obtenerMisPermisos } from "@/app/actions/permisos";
import { redirect } from "next/navigation";

export default async function FilialesPage() {
  // All fetches in one parallel round-trip
  const [usuario, { permisos }, resumen, diezmos, egresos] = await Promise.all([
    getUsuarioActual(),
    obtenerMisPermisos(),
    obtenerResumenFiliales(),
    obtenerDiezmosFiliales(),
    obtenerEgresosFiliales(),
  ]);

  if (!usuario) {
    redirect("/login");
  }

  // Validar permiso de ver filiales
  const permisosFiliales = permisos.filiales || {
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  };

  if (!permisosFiliales.puedeVer) {
    redirect("/dashboard");
  }

  // Serializar Decimals
  const diezmosSerializados = diezmos.map((d) => ({
    ...d,
    monto: Number(d.monto),
  }));

  const egresosSerializados = egresos.map((e) => ({
    ...e,
    monto: Number(e.monto),
  }));

  return (
    <div className="min-h-screen">
      <Header
        title="⛪ Diezmos Filiales"
        subtitle="Control de diezmos de iglesias filiales"
      />
      <FilialesClient
        resumen={resumen}
        diezmos={diezmosSerializados}
        egresos={egresosSerializados}
        usuarioId={usuario.id}
        permisos={permisosFiliales}
      />
    </div>
  );
}
