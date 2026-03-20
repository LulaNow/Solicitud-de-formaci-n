"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const { data: role, isLoading: loadingRole } = trpc.roles.getById.useQuery(roleId);
  const { data: permissions, isLoading: loadingPerms } = trpc.permissions.list.useQuery();
  const updateRole = trpc.roles.update.useMutation({
    onSuccess: () => router.push("/admin/roles"),
    onError: (err) => setError(err.message),
  });

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      setIsActive(role.isActive);
      setSelectedPermissions(role.rolePermissions.map((rp) => rp.permission.id));
    }
  }, [role]);

  const grouped = permissions?.reduce<Record<string, typeof permissions>>((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {}) ?? {};

  function togglePermission(id: string) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleModule(modulePerms: { id: string }[]) {
    const ids = modulePerms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !ids.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...ids])]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    updateRole.mutate({ id: roleId, name, description, isActive, permissionIds: selectedPermissions });
  }

  if (loadingRole) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/roles" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Rol</h1>
          <p className="text-sm text-gray-500">{role?.name}{role?.isSystem && " (Sistema)"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Información del Rol</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role?.isSystem}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/20" />
              </label>
              <span className="text-sm text-gray-700">Rol activo</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Permisos
            <span className="ml-2 text-sm font-normal text-gray-400">({selectedPermissions.length} seleccionados)</span>
          </h2>

          {loadingPerms ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([module, perms]) => {
                const allSelected = perms.every((p) => selectedPermissions.includes(p.id));
                const someSelected = perms.some((p) => selectedPermissions.includes(p.id));
                return (
                  <div key={module} className="rounded-lg border border-gray-100 bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => toggleModule(perms)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        readOnly
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm font-semibold capitalize text-gray-700">{module}</span>
                      <span className="ml-auto text-xs text-gray-400">{perms.length}</span>
                    </button>
                    <div className="border-t border-gray-100 px-4 py-2">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <div>
                            <span className="text-sm text-gray-700">{perm.name}</span>
                            <span className="ml-2 font-mono text-xs text-gray-400">{perm.key}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/roles" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={updateRole.isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateRole.isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
