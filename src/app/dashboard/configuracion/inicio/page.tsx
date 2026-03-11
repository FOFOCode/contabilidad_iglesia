import { verificarConfiguracionInicial } from "@/app/actions/sistema";
import { getUsuarioActual } from "@/app/actions/auth";
import { AsistenteClient } from "./AsistenteClient";

export default async function AsistenteConfiguracionPage() {
  const [status, usuario] = await Promise.all([
    verificarConfiguracionInicial(),
    getUsuarioActual(),
  ]);

  return (
    <AsistenteClient statusInicial={status} usuarioId={usuario?.id || null} />
  );
}
