"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

const statusBadge: Record<string, { text: string; class: string }> = {
  ACTIVE: { text: "Activo", class: "bg-green-100 text-green-700" },
  INACTIVE: { text: "Inactivo", class: "bg-gray-100 text-gray-700" },
  SUSPENDED: { text: "Suspendido", class: "bg-red-100 text-red-700" },
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = trpc.users.list.useQuery({
    limit: 50,
    search: search || undefined,
  });
  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">
            Gestión de usuarios del portal
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 rounded-sm bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-white py-16">
          <Users className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Roles
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Último acceso
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((user) => {
                const status = statusBadge[user.status] || statusBadge.ACTIVE;
                return (
                  <tr key={user.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.username}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.userRoles.map((ur) => (
                          <span
                            key={ur.role.id}
                            className="rounded-sm bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                          >
                            {ur.role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${status.class}`}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.lastLoginAt
                        ? formatDate(user.lastLoginAt)
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-surface-alt hover:text-gray-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar este usuario?")) {
                              deleteUser.mutate(user.id);
                            }
                          }}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
