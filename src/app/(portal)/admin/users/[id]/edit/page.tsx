"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";

const statusOptions = [
  { value: "ACTIVE", label: "Activo", color: "bg-green-100 text-green-700" },
  { value: "INACTIVE", label: "Inactivo", color: "bg-gray-100 text-gray-700" },
  { value: "SUSPENDED", label: "Suspendido", color: "bg-red-100 text-red-700" },
] as const;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState("");

  const { data: user, isLoading: loadingUser } = trpc.users.getById.useQuery(userId);
  const { data: roles } = trpc.roles.list.useQuery();
  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => router.push("/admin/users"),
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStatus(user.status);
      setSelectedRoles(user.userRoles.map((ur) => ur.role.id));
    }
  }, [user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const data: {
      id: string;
      name: string;
      email: string;
      status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
      roleIds: string[];
      password?: string;
    } = {
      id: userId,
      name,
      email,
      status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED",
      roleIds: selectedRoles,
    };
    if (password.trim()) data.password = password;
    updateUser.mutate(data);
  }

  if (loadingUser) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
          <p className="text-sm text-gray-500">{user?.name} ({user?.username})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Información Personal</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo *</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Usuario</label>
              <input
                type="text"
                disabled
                value={user?.username || ""}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Dejar vacío para no cambiar"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Roles
            <span className="ml-2 text-sm font-normal text-gray-400">({selectedRoles.length} seleccionados)</span>
          </h2>
          <div className="space-y-2">
            {roles?.filter((r) => r.isActive).map((role) => (
              <label key={role.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRoles((prev) => [...prev, role.id]);
                    else setSelectedRoles((prev) => prev.filter((id) => id !== role.id));
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{role.name}</span>
                  {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                </div>
                <span className="ml-auto text-xs text-gray-400">{role.rolePermissions.length} permisos</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/users" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={updateUser.isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateUser.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
