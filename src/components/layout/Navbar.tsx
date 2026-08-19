"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, User, LogOut, ChevronDown, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const IMPERSONATE_ROLES = ["Administrador", "Owner", "Propietario"];

function canImpersonate(roles?: string[]): boolean {
  return !!roles && roles.some((role) => IMPERSONATE_ROLES.includes(role));
}

export function Navbar() {
  const { data: session } = useSession();
  const { data: me } = trpc.users.me.useQuery();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const realRoles = ((session?.user as Record<string, unknown>)?.roles as string[] | undefined);
  const effectiveUser = me || session?.user;
  const isImpersonating = !!me?.impersonatedBy;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function startImpersonation(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al impersonar");
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  async function stopImpersonation() {
    try {
      await fetch("/api/impersonate", { method: "DELETE" });
      window.location.reload();
    } catch (err) {
      console.error("Error al detener impersonación:", err);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="rounded-sm p-1.5 text-gray-500 transition-colors hover:bg-surface-alt hover:text-gray-700">
          <Bell className="h-4 w-4" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-gray-50"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isImpersonating ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"}`}>
              <User className="h-4 w-4" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="font-medium text-gray-800">
                {effectiveUser?.name || "Usuario"}
                {isImpersonating && <span className="ml-1.5 text-xs font-normal text-amber-600">(impersonando)</span>}
              </p>
              <p className="text-xs text-gray-500">{effectiveUser?.roles?.[0] || "Sin rol"}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-1 w-56 rounded-sm border border-border bg-white py-1 shadow-lg">
              {isImpersonating ? (
                <div className="border-b border-gray-100 px-3 py-2 text-xs text-amber-600">
                  <p className="font-medium">Modo impersonación</p>
                  <p className="truncate">Como: {effectiveUser?.name}</p>
                  <p className="truncate">Por: {me?.impersonatedBy?.name}</p>
                </div>
              ) : null}

              {canImpersonate(realRoles) && !isImpersonating && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setModalOpen(true);
                    setIdentifier("");
                    setError(null);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  Impersonar usuario
                </button>
              )}

              {isImpersonating && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    stopImpersonation();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  Salir de impersonación
                </button>
              )}

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-sm border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Impersonar usuario</h3>
            <p className="mb-4 text-sm text-gray-500">Escribe el usuario o correo a impersonar.</p>

            <form onSubmit={startImpersonation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Usuario o correo</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                  className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="ejemplo@nadro.mx"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? "Cargando..." : "Impersonar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
