"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import anime from "animejs";
import { LogisticsScene } from "@/components/animated/LogisticsScene";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const ssoError = searchParams.get("error");
  const ssoMessage = searchParams.get("message");

  // SSO error messages mapping
  const ssoErrorMessages: Record<string, string> = {
    sso_user_not_found: "El usuario no está registrado en este portal. Contacte al administrador.",
    sso_no_code: "No se recibió código de autorización del sistema SSO.",
    sso_no_state: "Falta parámetro de seguridad (state).",
    sso_invalid_state: "Token de seguridad inválido o expirado. Intente nuevamente.",
    sso_config: "El sistema no tiene configuradas las credenciales SSO.",
    sso_token_failed: "Error al obtener token de acceso. El código puede haber expirado.",
    sso_no_token: "No se recibió token de acceso del sistema SSO.",
    sso_userinfo_failed: "Error al obtener información del usuario.",
    sso_incomplete_user: "Datos de usuario incompletos del sistema SSO.",
    sso_init_error: "Error al iniciar el proceso de SSO.",
    sso_error: "Error inesperado durante el inicio de sesión SSO.",
  };

  // Show SSO errors on mount
  useEffect(() => {
    if (ssoError) {
      const msg = ssoMessage || ssoErrorMessages[ssoError] || "Error de SSO desconocido.";
      setError(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssoError, ssoMessage]);

  useEffect(() => {
    if (logoRef.current) {
      anime({
        targets: logoRef.current,
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 800,
        easing: "easeOutExpo",
      });
    }

    if (formRef.current) {
      anime({
        targets: formRef.current.querySelectorAll(".login-element"),
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: anime.stagger(100, { start: 300 }),
        easing: "easeOutExpo",
      });
    }
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      anime({
        targets: errorRef.current,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 400,
        easing: "easeOutExpo",
      });
    }
  }, [error]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas. Intente nuevamente.");
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setError("Error al iniciar sesión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleSSOLogin() {
    window.location.href = "/api/auth/sso/login";
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <LogisticsScene />

      <div
        ref={formRef}
        className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/20 bg-white/20 p-8 shadow-2xl backdrop-blur-md"
      >
        <div ref={logoRef} className="text-center">
          <div className="relative mx-auto mb-6 h-20 w-48">
            <Image
              src="/log.png"
              alt="NADRO"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="login-element text-2xl font-bold text-white drop-shadow-sm">
            Salud a todo México
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div
              ref={errorRef}
              className={`rounded-lg border p-3 text-sm ${
                ssoError
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {ssoError && (
                <div className="mb-1 font-semibold">
                  ⚠️ Acceso SSO Denegado
                </div>
              )}
              {error}
            </div>
          )}

          <div className="login-element space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-white/90"
              >
                Usuario / Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-white/30 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#4D8B31] focus:ring-2 focus:ring-[#4D8B31]/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/90"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-white/30 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#4D8B31] focus:ring-2 focus:ring-[#4D8B31]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-element group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#4D8B31] px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#4D8B31]/30 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="relative z-10">
              {loading ? "Ingresando..." : "Ingresar"}
            </span>
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </span>
            )}
          </button>
        </form>

        <div className="login-element relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white/20 px-4 text-white/70">O continuar con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSSOLogin}
          className="login-element group relative w-full overflow-hidden rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-white/50 hover:bg-white/20 hover:shadow-xl"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            Login con SSO
          </span>
        </button>

        <p className="login-element mt-4 text-center text-xs text-white/50">
          NADRO Portal v1.0 — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
