"use client";

import { trpc } from "@/lib/trpc/client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";

export default function SolicitudesPage() {
  const searchParams = useSearchParams();
  const estadoInicial = searchParams.get("estado") || "todas";
  const [filtroEstado, setFiltroEstado] = useState<string>(estadoInicial);
  const { data: solicitudes, isLoading } = trpc.requests.mySolicitudes.useQuery();

  useEffect(() => {
    const estado = searchParams.get("estado");
    if (estado) {
      setFiltroEstado(estado);
    }
  }, [searchParams]);

  const solicitudesFiltradas = solicitudes?.filter((solicitud) => {
    if (filtroEstado === "todas") return true;

    const estadoMap: Record<string, string[]> = {
      "pendiente": ["Pendiente"],
      "en-proceso": ["abierto", "Activa"],
      "aprobada": ["Completado"],
      "rechazada": ["Rechazado"],
    };

    return estadoMap[filtroEstado]?.includes(solicitud.estado);
  });

  const getEtapaActual = (tareasFlujo: any[]) => {
    if (!tareasFlujo || tareasFlujo.length === 0) {
      return "Iniciada";
    }

    // Ordenar tareas por fecha de creación
    const tareasOrdenadas = [...tareasFlujo].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Buscar la última tarea activa o la última completada
    let ultimaTarea = tareasOrdenadas[tareasOrdenadas.length - 1];

    // Si hay una tarea activa, usarla
    const tareaActiva = tareasOrdenadas.find(t =>
      t.estadoTarea === "Activa" || t.estadoTarea === "Solicitado" || t.estadoTarea === "Pendiente"
    );

    if (tareaActiva) {
      ultimaTarea = tareaActiva;
    }

    const nombreTarea = ultimaTarea.nombreTarea?.toLowerCase() || "";

    // Determinar etapa según el nombre de la tarea
    if (nombreTarea.includes("revisión") && nombreTarea.includes("datos")) {
      return "1. Revisión de datos";
    }
    if (nombreTarea.includes("aprobación") && (nombreTarea.includes("director") || nombreTarea.includes("cdr"))) {
      return "2. Aprobación Director/CDR";
    }
    if (nombreTarea.includes("carga") && nombreTarea.includes("premisas")) {
      return "3. Carga de premisas";
    }
    if (nombreTarea.includes("aprobación") && nombreTarea.includes("formación")) {
      return "4. Aprobación Gerencia";
    }
    if (nombreTarea.includes("completad") || ultimaTarea.estadoTarea === "Completada") {
      return "Completada";
    }

    return ultimaTarea.nombreTarea || "En proceso";
  };

  const getEstadoBadge = (estado: string) => {
    // Pendiente
    if (estado === "Pendiente") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        Pendiente
      </span>;
    }
    // En Proceso: abierto o Activa
    if (estado === "abierto" || estado === "Activa") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
        <AlertCircle className="h-3 w-3" />
        En Proceso
      </span>;
    }
    // Aprobada: Completado
    if (estado === "Completado") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        Aprobada
      </span>;
    }
    // Rechazada: Rechazado
    if (estado === "Rechazado") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
        <XCircle className="h-3 w-3" />
        Rechazada
      </span>;
    }
    return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      {estado}
    </span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h1>
        <p className="text-sm text-gray-500">Historial de solicitudes de formación</p>
      </div>

      <div className="rounded-sm border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filtrar por estado</h2>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="en-proceso">En Proceso</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Cargando solicitudes...
          </div>
        ) : solicitudesFiltradas && solicitudesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Etapa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {solicitudesFiltradas.map((solicitud) => (
                  <tr key={solicitud.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {solicitud.numeroTicket || solicitud.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {solicitud.tipoProceso || "Solicitud de Formación"}
                    </td>
                    <td className="px-4 py-3">
                      {getEstadoBadge(solicitud.estado)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getEtapaActual(solicitud.tareasFlujo || [])}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {format(new Date(solicitud.createdAt), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/solicitudes/${solicitud.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No hay solicitudes {filtroEstado !== "todas" ? `con estado "${filtroEstado}"` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
