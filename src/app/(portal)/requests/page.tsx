"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Inbox, Eye } from "lucide-react";

const statusConfig: Record<string, { text: string; class: string }> = {
  PENDING: { text: "Pendiente", class: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { text: "En Proceso", class: "bg-blue-100 text-blue-700" },
  APPROVED: { text: "Aprobada", class: "bg-green-100 text-green-700" },
  REJECTED: { text: "Rechazada", class: "bg-red-100 text-red-700" },
  CANCELLED: { text: "Cancelada", class: "bg-gray-100 text-gray-700" },
};

export default function RequestsPage() {
  const { data, isLoading } = trpc.requests.list.useQuery({ limit: 50 });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Peticiones</h1>
        <p className="text-sm text-gray-500">Peticiones recibidas de formularios</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-white py-16">
          <Inbox className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No hay peticiones aún</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Formulario</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Enviado por</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((req) => {
                const status = statusConfig[req.status] || statusConfig.PENDING;
                return (
                  <tr key={req.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{req.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 font-medium">{req.form.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {req.submittedBy?.name || req.submitterName || req.submitterEmail || "Anónimo"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(req.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/requests/${req.id}`} className="rounded-sm p-1.5 text-gray-400 hover:text-brand-600">
                        <Eye className="inline h-4 w-4" />
                      </Link>
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
