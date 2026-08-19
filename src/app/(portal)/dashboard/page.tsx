"use client";

import { trpc } from "@/lib/trpc/client";
import { useSession } from "next-auth/react";
import {
  FileText,
  Inbox,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ClipboardPen,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: stats, refetch: refetchStats } = trpc.requests.stats.useQuery();
  const [filtroEstado, setFiltroEstado] = useState<string>("activa");
  const [filtroEstadoAprobacion, setFiltroEstadoAprobacion] = useState<string>("solicitado");
  const { data: tareas, isLoading: isLoadingTareas, refetch: refetchTareas } = trpc.requests.assignedTasks.useQuery();
  const cardsRef = useRef<HTMLDivElement>(null);

  // Refrescar datos cuando el componente se monta
  useEffect(() => {
    refetchStats();
    refetchTareas();
  }, [refetchStats, refetchTareas]);

  useEffect(() => {
    import("animejs").then((mod) => {
      if (cardsRef.current) {
        mod.default({
          targets: cardsRef.current.children,
          opacity: [0, 1],
          translateY: [20, 0],
          delay: ((_el: Element, i: number) => i * 100) as unknown as number,
          duration: 600,
          easing: "easeOutCubic",
        });
      }
    });
  }, [stats]);

  const user = session?.user;
  const roles = (user as Record<string, unknown>)?.roles as
    | string[]
    | undefined;

  const baseCards = [
    {
      label: "Total Peticiones",
      value: stats?.total ?? 0,
      icon: Inbox,
      color: "text-brand-600 bg-brand-50",
      href: "/solicitudes?estado=todas",
    },
    {
      label: "Pendientes",
      value: stats?.pending ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
      href: "/solicitudes?estado=pendiente",
    },
    {
      label: "En Proceso",
      value: stats?.inProgress ?? 0,
      icon: AlertCircle,
      color: "text-blue-600 bg-blue-50",
      href: "/solicitudes?estado=en-proceso",
    },
    {
      label: "Aprobadas",
      value: stats?.approved ?? 0,
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
      href: "/solicitudes?estado=aprobada",
    },
    {
      label: "Rechazadas",
      value: stats?.rejected ?? 0,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
      href: "/solicitudes?estado=rechazada",
    },
  ];

  const cards = (stats?.assignedTasks ?? 0) > 0
    ? [
        ...baseCards,
        {
          label: "Tareas asignadas",
          value: stats?.assignedTasks ?? 0,
          icon: ClipboardPen,
          color: "text-purple-600 bg-purple-50",
        },
      ]
    : baseCards;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name || "Usuario"}
        </h1>
        <p className="text-sm text-gray-500">
          {roles?.[0] || "Sin rol"} — Panel de control
        </p>
      </div>

      <div
        ref={cardsRef}
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          cards.length > 5 ? "lg:grid-cols-6" : "lg:grid-cols-5"
        }`}
      >
        {cards.map((card) => {
          const isTaskCard = card.label === "Tareas asignadas";
          const hasHref = 'href' in card;
          const CardWrapper = (hasHref || isTaskCard) ? Link : "div";
          const cardProps = isTaskCard
            ? { href: "/tareas-asignadas" }
            : hasHref
            ? { href: card.href }
            : {};

          return (
            <CardWrapper
              key={card.label}
              {...cardProps}
              className={`flex items-center gap-4 rounded-sm border border-border bg-white p-4 opacity-0 ${
                (hasHref || isTaskCard) ? "cursor-pointer transition-all hover:border-brand-300 hover:shadow-md" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-sm ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Sección de Mis tareas pendientes */}
      {(stats?.assignedTasks ?? 0) > 0 && (
        <div className="mt-8 rounded-sm border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Mis tareas pendientes (Atención requerida)
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="filtro-estado" className="text-sm text-gray-600">
                Filtrar por estado:
              </label>
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="activa">Activas</option>
                <option value="cerrado_completo">Cerradas completas</option>
                <option value="cerrado_incompleto">Cerradas incompletas</option>
              </select>
            </div>
          </div>

          {isLoadingTareas ? (
            <div className="py-8 text-center text-gray-500">Cargando tareas...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ticket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tarea
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo de Proceso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fecha Creación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tareas
                    ?.filter((tarea) => {
                      // Excluir tareas de tipo "Aprobación" (se muestran en otra sección)
                      if (tarea.tipoTarea === "Aprobación") return false;

                      const estadoLower = tarea.estadoTarea.toLowerCase();
                      if (filtroEstado === "activa") return estadoLower === "activa";
                      if (filtroEstado === "cerrado_completo") return estadoLower === "cerrado completo";
                      if (filtroEstado === "cerrado_incompleto") return estadoLower === "cerrado incompleto";
                      return false;
                    })
                    .map((tarea) => (
                      <tr
                        key={tarea.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {tarea.numeroTicket || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tarea.nombreTarea || "Sin nombre"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {tarea.nombreSolicitud || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              tarea.estadoTarea.toLowerCase() === "activa"
                                ? "bg-blue-100 text-blue-800"
                                : tarea.estadoTarea.toLowerCase() === "cerrado completo"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tarea.estadoTarea}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {format(new Date(tarea.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: es,
                          })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Link
                            href={`/tareas-asignadas/${tarea.id}`}
                            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  {tareas?.filter((tarea) => {
                    if (tarea.tipoTarea === "Aprobación") return false;
                    const estadoLower = tarea.estadoTarea.toLowerCase();
                    if (filtroEstado === "activa") return estadoLower === "activa";
                    if (filtroEstado === "cerrado_completo") return estadoLower === "cerrado completo";
                    if (filtroEstado === "cerrado_incompleto") return estadoLower === "cerrado incompleto";
                    return false;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No hay tareas {filtroEstado === "activa" ? "activas" : filtroEstado === "cerrado_completo" ? "cerradas completas" : "cerradas incompletas"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sección de Solicitudes de aprobación */}
      {(stats?.assignedTasks ?? 0) > 0 && tareas?.some((t) => t.tipoTarea === "Aprobación") && (
        <div className="mt-8 rounded-sm border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Solicitudes de aprobación
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="filtro-estado-aprobacion" className="text-sm text-gray-600">
                Filtrar por estado:
              </label>
              <select
                id="filtro-estado-aprobacion"
                value={filtroEstadoAprobacion}
                onChange={(e) => setFiltroEstadoAprobacion(e.target.value)}
                className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="solicitado">Solicitado</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          {isLoadingTareas ? (
            <div className="py-8 text-center text-gray-500">Cargando solicitudes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ticket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tarea
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo de Proceso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fecha Creación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tareas
                    ?.filter((tarea) => {
                      // Solo mostrar tareas de tipo "Aprobación"
                      if (tarea.tipoTarea !== "Aprobación") return false;

                      const estadoLower = tarea.estadoTarea.toLowerCase();
                      if (filtroEstadoAprobacion === "solicitado") return estadoLower === "solicitado";
                      if (filtroEstadoAprobacion === "aprobado") return estadoLower === "aprobado";
                      if (filtroEstadoAprobacion === "rechazado") return estadoLower === "rechazado";
                      return false;
                    })
                    .map((tarea) => (
                      <tr
                        key={tarea.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {tarea.numeroTicket || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tarea.nombreTarea || "Sin nombre"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {tarea.nombreSolicitud || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              tarea.estadoTarea.toLowerCase() === "activa"
                                ? "bg-blue-100 text-blue-800"
                                : tarea.estadoTarea.toLowerCase() === "cerrado completo"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tarea.estadoTarea}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {format(new Date(tarea.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: es,
                          })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Link
                            href={`/tareas-asignadas/${tarea.id}`}
                            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  {tareas?.filter((tarea) => {
                    if (tarea.tipoTarea !== "Aprobación") return false;
                    const estadoLower = tarea.estadoTarea.toLowerCase();
                    if (filtroEstadoAprobacion === "solicitado") return estadoLower === "solicitado";
                    if (filtroEstadoAprobacion === "aprobado") return estadoLower === "aprobado";
                    if (filtroEstadoAprobacion === "rechazado") return estadoLower === "rechazado";
                    return false;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No hay solicitudes de aprobación {
                          filtroEstadoAprobacion === "solicitado" ? "solicitadas" :
                          filtroEstadoAprobacion === "aprobado" ? "aprobadas" :
                          "rechazadas"
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/forms/new"
              className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <FileText className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium">Nuevo Formulario</span>
            </Link>
            <Link
              href="/requests"
              className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <Inbox className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium">Ver Peticiones</span>
            </Link>
            {roles?.includes("Administrador") && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <Users className="h-5 w-5 text-brand-500" />
                <span className="text-sm font-medium">Gestionar Usuarios</span>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Información del Sistema
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Versión</dt>
              <dd className="font-medium">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ambiente</dt>
              <dd className="font-medium">Desarrollo</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Seguridad</dt>
              <dd className="font-medium text-green-600">
                AES-256-GCM + Custom Base85
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Base de Datos</dt>
              <dd className="font-medium text-green-600">PostgreSQL ✓</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
