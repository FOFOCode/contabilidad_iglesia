import { verificarConfiguracionInicial } from "@/app/actions/sistema";
import { AsistenteClient } from "./AsistenteClient";

export default async function AsistenteConfiguracionPage() {
  const status = await verificarConfiguracionInicial();

  return <AsistenteClient statusInicial={status} />;
}
