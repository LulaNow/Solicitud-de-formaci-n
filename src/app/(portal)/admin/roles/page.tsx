"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { Shield, Plus, Edit2, Trash2 } from "lucide-react";

export default function AdminRolesPage() {
  const { data: roles, isLoading, refetch } = trpc.roles.list.useQuery();
  const deleteRole = trpc.roles.delete.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-sm text-gray-500">Gestión de roles y permisos</p>
        </div>
        <Link
          href="/admin/roles/new"
          className="flex items-center gap-2 rounded-sm bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo Rol
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles?.map((role) => (
            <div
              key={role.id}
              className="rounded-sm border border-border bg-white p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-500" />
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                </div>
                {role.isSystem && (
                  <span className="rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Sistema
                  </span>
                )}
              </div>
              <p className="mb-3 text-sm text-gray-500">
                {role.description || "Sin descripción"}
              </p>
              <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                <span>{role.rolePermissions.length} permisos</span>
                <span>{role._count.userRoles} usuarios</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/roles/${role.id}/edit`}
                  className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-surface-alt"
                >
                  <Edit2 className="h-3 w-3" /> Editar
                </Link>
                {!role.isSystem && (
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar este rol?"))
                        deleteRole.mutate(role.id);
                    }}
                    className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
