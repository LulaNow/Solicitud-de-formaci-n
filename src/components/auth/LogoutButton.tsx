"use client";

import { useState } from "react";

/**
 * Componente de Botón de Logout para SSO
 * 
 * CARACTERÍSTICAS:
 * - Muestra estado de carga durante el logout
 * - Maneja errores gracefully
 * - Redirige automáticamente al login
 * 
 * USO:
 * ```tsx
 * import { LogoutButton } from "@/components/auth/LogoutButton";
 * 
 * export default function Header() {
 *   return (
 *     <header>
 *       <LogoutButton />
 *     </header>
 *   );
 * }
 * ```
 */
export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    
    try {
      // Opción 1: Usar fetch para hacer POST al endpoint de logout
      await fetch("/api/auth/sso/logout", {
        method: "POST",
      });
      
      // Redirigir al login
      window.location.href = "/login?message=Sesión cerrada exitosamente";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      
      // Aún así intentar redirigir
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Cerrando sesión...
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Cerrar Sesión
        </>
      )}
    </button>
  );
}

/**
 * Variante simple del botón de logout (solo ícono)
 */
export function LogoutIconButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    window.location.href = "/api/auth/sso/logout";
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Cerrar Sesión"
      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? (
        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
      ) : (
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * Variante de link de logout (para menús dropdown)
 */
export function LogoutLink() {
  const [loading, setLoading] = useState(false);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    window.location.href = "/api/auth/sso/logout";
  }

  return (
    <a
      href="/api/auth/sso/logout"
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      )}
      <span>{loading ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
    </a>
  );
}
