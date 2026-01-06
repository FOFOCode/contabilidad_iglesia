"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card } from "@/components/ui";
import { useRouter } from "next/navigation";
import {
  login,
  hayUsuariosRegistrados,
  crearPrimerAdmin,
} from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [noUsers, setNoUsers] = useState(false);

  // Verificar si hay usuarios registrados al cargar
  useEffect(() => {
    const verificar = async () => {
      const hayUsuarios = await hayUsuariosRegistrados();
      setNoUsers(!hayUsuarios);
      setCheckingUsers(false);
    };
    verificar();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validaciones
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!email.includes("@")) {
      newErrors.email = "Ingrese un correo electrónico válido";
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (password.length < 4) {
      newErrors.password = "La contraseña debe tener al menos 4 caracteres";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrors({ general: result.error || "Error al iniciar sesión" });
      }
    } catch {
      setErrors({ general: "Error de conexión. Intente nuevamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const correo = formData.get("correo") as string;
    const contrasena = formData.get("contrasena") as string;
    const confirmarContrasena = formData.get("confirmarContrasena") as string;

    // Validaciones
    const newErrors: { [key: string]: string } = {};

    if (!nombre) newErrors.nombre = "El nombre es obligatorio";
    if (!apellido) newErrors.apellido = "El apellido es obligatorio";
    if (!correo) {
      newErrors.correo = "El correo es obligatorio";
    } else if (!correo.includes("@")) {
      newErrors.correo = "Ingrese un correo válido";
    }
    if (!contrasena) {
      newErrors.contrasena = "La contraseña es obligatoria";
    } else if (contrasena.length < 6) {
      newErrors.contrasena = "La contraseña debe tener al menos 6 caracteres";
    }
    if (contrasena !== confirmarContrasena) {
      newErrors.confirmarContrasena = "Las contraseñas no coinciden";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await crearPrimerAdmin({
        nombre,
        apellido,
        correo,
        contrasena,
      });

      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrors({ general: result.error || "Error al crear el usuario" });
      }
    } catch {
      setErrors({ general: "Error de conexión. Intente nuevamente." });
    } finally {
      setIsLoading(false);
    }
  };

  // Pantalla de carga mientras verifica
  if (checkingUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#eef4f7] to-[#d9e8ef] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#203b46] border-t-transparent rounded-full"></div>
          <p className="mt-4 text-[#40768c]">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4f7] to-[#d9e8ef] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#203b46] rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">⛪</span>
          </div>
          <h1 className="text-2xl font-bold text-[#203b46]">
            Sistema Contable
          </h1>
          <p className="text-[#40768c] mt-1">
            Iglesia - Administración Interna
          </p>
        </div>

        {/* Formulario según el estado */}
        {noUsers ? (
          // Formulario para crear el primer administrador
          <Card className="shadow-xl">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">
                <strong>¡Bienvenido!</strong> No hay usuarios registrados. Cree
                el primer usuario administrador para comenzar.
              </div>
            </div>

            <form onSubmit={handleCrearAdmin} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nombre"
                  name="nombre"
                  placeholder="Juan"
                  error={errors.nombre}
                  required
                />
                <Input
                  label="Apellido"
                  name="apellido"
                  placeholder="Pérez"
                  error={errors.apellido}
                  required
                />
              </div>

              <Input
                label="Correo electrónico"
                name="correo"
                type="email"
                placeholder="admin@iglesia.com"
                error={errors.correo}
                required
              />

              <Input
                label="Contraseña"
                name="contrasena"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                error={errors.contrasena}
                required
              />

              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  name="confirmarContrasena"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita la contraseña"
                  error={errors.confirmarContrasena}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Crear administrador
              </Button>
            </form>
          </Card>
        ) : (
          // Formulario de login normal
          <Card className="shadow-xl">
            <form onSubmit={handleLogin} className="space-y-5">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}

              <div>
                <Input
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  placeholder="usuario@iglesia.com"
                  error={errors.email}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Contraseña"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    error={errors.password}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-[#73a9bf] mt-6">
          Sistema de uso exclusivo para administradores autorizados
        </p>
      </div>
    </div>
  );
}
