"use client";

import { trpc } from "@/lib/trpc/client";
import { Key } from "lucide-react";

export default function AdminPermissionsPage() {
  const { data: roles, isLoading } = trpc.roles.list.useQuery();

  const allPermissions = roles
    ?.flatMap((r) => r.rolePermissions.map((rp) => rp.permission))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name)) ?? [];

  const grouped = allPermissions.reduce<Record<string, typeof allPermissions>>((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permisos</h1>
        <p className="text-sm text-gray-500">Vista de permisos del sistema por módulo</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="rounded-sm border border-border bg-white">
              <div className="flex items-center gap-2 border-b border-border bg-surface-alt px-4 py-3">
                <Key className="h-4 w-4 text-brand-500" />
                <h2 className="text-sm font-semibold capitalize text-gray-700">{module}</h2>
                <span className="ml-auto text-xs text-gray-400">{perms.length} permisos</span>
              </div>
              <div className="divide-y divide-border">
                {perms.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{perm.name}</p>
                      <p className="text-xs font-mono text-gray-400">{perm.key}</p>
                    </div>
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{perm.action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
