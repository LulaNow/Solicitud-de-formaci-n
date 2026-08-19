"use client";

import { trpc } from "@/lib/trpc/client";
import { ClipboardPen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TareasAsignadasPage() {
  const { data: tareas, isLoading } = trpc.requests.assignedTasks.useQuery();

  const getEstadoBadgeColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === "pendiente") return "bg-amber-100 text-amber-800";
    if (estadoLower === "activa") return "bg-blue-100 text-blue-800";
    if (estadoLower === "completada") return "bg-green-100 text-green-800";
    if (estadoLower === "cancelada") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-purple-50">
              <ClipboardPen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tareas Asignadas
              </h1>
              <p className="text-sm text-gray-500">
                Gestiona las tareas que te han sido asignadas
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-sm border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-sm border border-border bg-white p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Cargando tareas...</p>
        </div>
      ) : tareas && tareas.length > 0 ? (
        <div className="overflow-hidden rounded-sm border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Usuario Creador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre Tarea
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha Creación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tareas.map((tarea) => (
                  <tr
                    key={tarea.id}
                    onClick={() => window.location.href = `/tareas-asignadas/${tarea.id}`}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {tarea.nombreSolicitud}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {tarea.usuarioCreador}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {tarea.nombreTarea}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadgeColor(
                          tarea.estadoTarea
                        )}`}
                      >
                        {tarea.estadoTarea}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(tarea.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-white p-8 text-center">
          <ClipboardPen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No tienes tareas asignadas
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Cuando se te asignen tareas, aparecerán aquí.
          </p>
        </div>
      )}

      {tareas && tareas.length > 0 && (
        <div className="mt-4 rounded-sm border border-border bg-white px-6 py-3">
          <p className="text-sm text-gray-600">
            Total de tareas asignadas:{" "}
            <span className="font-semibold">{tareas.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}
