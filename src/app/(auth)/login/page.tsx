"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import Image from "next/image";
import anime from "animejs";
import { LogisticsScene } from "@/components/animated/LogisticsScene";

export default function LoginPage() {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <LogisticsScene />

      <div
        ref={formRef}
        className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
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
          <h2 className="login-element text-2xl font-bold text-gray-900">
            Salud a todo México
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div
              ref={errorRef}
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <div className="login-element space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-[#4D8B31] focus:ring-2 focus:ring-[#4D8B31]/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-[#4D8B31] focus:ring-2 focus:ring-[#4D8B31]/20"
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

        <p className="login-element mt-4 text-center text-xs text-gray-500">
          NADRO Portal v1.0 — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
