"use client";

import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { Plus, FileText, Eye, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const statusLabel: Record<string, { text: string; class: string }> = {
  DRAFT: { text: "Borrador", class: "bg-gray-100 text-gray-700" },
  PUBLISHED: { text: "Publicado", class: "bg-green-100 text-green-700" },
  ARCHIVED: { text: "Archivado", class: "bg-red-100 text-red-700" },
};

export default function FormsPage() {
  const { data, isLoading } = trpc.forms.list.useQuery({ limit: 50 });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formularios</h1>
          <p className="text-sm text-gray-500">Gestiona tus formularios dinámicos</p>
        </div>
        <Link
          href="/forms/new"
          className="flex items-center gap-2 rounded-sm bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo Formulario
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-white py-16">
          <FileText className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No hay formularios aún</p>
          <Link href="/forms/new" className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Campos</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Envíos</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Creado</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((form) => {
                const status = statusLabel[form.status] || statusLabel.DRAFT;
                return (
                  <tr key={form.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{form.name}</td>
                    <td className="px-4 py-3 text-gray-500">/f/{form.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{form._count.fields}</td>
                    <td className="px-4 py-3 text-gray-500">{form._count.registries}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(form.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {form.status === 'PUBLISHED' && (
                          <Link
                            href={`/f/${form.slug}`}
                            target="_blank"
                            className="rounded-sm p-1.5 text-gray-400 hover:bg-surface-alt hover:text-gray-600"
                            title="Ver formulario público"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/forms/${form.id}/edit`}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-surface-alt hover:text-gray-600"
                          title="Editar formulario"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
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
