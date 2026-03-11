import { Sidebar } from "@/components/layout";
import { getUsuarioActual } from "@/app/actions/auth";
import { redirect } from "next/navigation";

// Marcar este layout como dinámico
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar sesión del lado del servidor
  const usuario = await getUsuarioActual();

  if (!usuario) {
    // Redirigir al endpoint de logout que borrará la cookie y redirigirá a login
    redirect("/api/auth/logout");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar usuario={usuario} />
      <main className="flex-1 overflow-auto lg:ml-0 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
