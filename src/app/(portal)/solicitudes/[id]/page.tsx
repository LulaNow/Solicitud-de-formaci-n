"use client";

import { trpc } from "@/lib/trpc/client";
import { use } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CheckCircle, Clock, XCircle, Circle, User, CreditCard } from "lucide-react";
import Link from "next/link";
import ArchivosAdjuntos from "@/components/solicitudes/ArchivosAdjuntos";

export default function SolicitudDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { data: solicitud, isLoading } = trpc.requests.getSolicitudDetail.useQuery(id);
  const { data: parametrosData } = trpc.requests.getParametros.useQuery(
    solicitud?.numeroTicket || "",
    { enabled: !!solicitud?.numeroTicket }
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Cargando solicitud...</div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="rounded-sm border border-border bg-white p-8 text-center">
        <p className="text-gray-500">Solicitud no encontrada</p>
      </div>
    );
  }

  const datosEntrada = solicitud.datosEntrada as Record<string, any>;

  // El botón de pagos se muestra al creador de la solicitud y a administradores
  const rolesUsuario = ((session?.user as { roles?: string[] })?.roles || []) as string[];
  const esCreador = (session?.user as { id?: string })?.id === solicitud.usuarioId;
  const puedeVerPagos = esCreador || rolesUsuario.includes("Administrador");

  // Función para obtener descripción del CDR
  const getCDRDescripcion = (cdr: string) => {
    const cdrMap: Record<string, string> = {
      "1000": "1000 - CORPORATIVO",
      "3000": "3000 - BAJIO",
      "3010": "3010 - CHIHUAHUA",
      "3020": "3020 - CULIACAN",
      "3030": "3030 - GUADALAJARA",
      "3040": "3040 - LA PAZ",
      "3050": "3050 - MERIDA",
      "3060": "3060 - MEXICO NORTE",
      "3070": "3070 - MEXICO SUR",
      "3080": "3080 - MONTERREY",
      "3090": "3090 - MORELIA",
      "3100": "3100 - PUEBLA",
      "3110": "3110 - TIJUANA",
      "3120": "3120 - TUXTLA",
      "3130": "3130 - VERACRUZ",
    };
    return cdrMap[cdr] || cdr;
  };

  // Función para limpiar y formatear montos
  const formatMonto = (monto: string | number) => {
    if (!monto) return "-";
    // Convertir a string y eliminar todos los signos de pesos
    const montoStr = String(monto).replace(/\$/g, "");
    return montoStr.trim();
  };

  // Definir las etapas del flujo
  const etapasDelFlujo = [
    { numero: 1, nombre: "Revisión de datos de la solicitud", tipo: "Tarea" },
    { numero: 2, nombre: "Solicitud de aprobación Director de área o Gerente de CDR", tipo: "Aprobación" },
    { numero: 3, nombre: "Carga de premisas", tipo: "Tarea" },
    { numero: 4, nombre: "Solicitud de aprobación Gerencia Formación", tipo: "Aprobación" },
  ];

  // Función para determinar el estado de cada etapa
  const getEstadoEtapa = (etapa: typeof etapasDelFlujo[0]) => {
    const tareaCorrespondiente = solicitud.tareasFlujo?.find((tarea: any) => {
      const nombreTarea = tarea.nombreTarea?.toLowerCase() || "";
      const nombreEtapa = etapa.nombre.toLowerCase();

      if (nombreEtapa.includes("revisión") && nombreEtapa.includes("datos")) {
        return nombreTarea.includes("revisión") || nombreTarea.includes("revisa");
      }
      if (nombreEtapa.includes("director") || nombreEtapa.includes("cdr")) {
        return nombreTarea.includes("director") || nombreTarea.includes("cdr");
      }
      if (nombreEtapa.includes("carga") && nombreEtapa.includes("premisas")) {
        return nombreTarea.includes("carga") && nombreTarea.includes("premisas");
      }
      if (nombreEtapa.includes("gerencia") && nombreEtapa.includes("formación")) {
        return nombreTarea.includes("gerencia") && nombreTarea.includes("formación");
      }
      return false;
    });

    if (!tareaCorrespondiente) {
      return { estado: "pendiente", tarea: null };
    }

    const estadoTarea = tareaCorrespondiente.estadoTarea;

    if (estadoTarea === "Completada" || estadoTarea === "Aprobado" || estadoTarea === "Cerrado completo") {
      return { estado: "completada", tarea: tareaCorrespondiente };
    }
    if (estadoTarea === "Activa" || estadoTarea === "Solicitado" || estadoTarea === "Pendiente") {
      return { estado: "en-proceso", tarea: tareaCorrespondiente };
    }
    if (estadoTarea === "Rechazado" || estadoTarea === "Cerrado incompleto") {
      return { estado: "rechazada", tarea: tareaCorrespondiente };
    }

    return { estado: "pendiente", tarea: tareaCorrespondiente };
  };

  const getIconoEstado = (estado: string) => {
    switch (estado) {
      case "completada":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "en-proceso":
        return <Clock className="h-6 w-6 text-blue-600" />;
      case "rechazada":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getColorLinea = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-600";
      case "en-proceso":
        return "bg-blue-600";
      case "rechazada":
        return "bg-red-600";
      default:
        return "bg-gray-300";
    }
  };

  // Determinar etapa actual
  const etapaActualIndex = etapasDelFlujo.findIndex(etapa => {
    const { estado } = getEstadoEtapa(etapa);
    return estado === "en-proceso";
  });

  const etapaActual = etapaActualIndex >= 0 ? etapaActualIndex : etapasDelFlujo.length - 1;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/solicitudes"
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-white transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Solicitud</h1>
          <p className="text-sm text-gray-500">{solicitud.numeroTicket}</p>
        </div>
        {/* Botón Tabla de pagos: solo para solicitudes Completadas,
            visible para el creador de la solicitud y administradores */}
        {solicitud.estado === "Completado" && puedeVerPagos && (
          <Link
            href={`/solicitudes/${id}/pagos`}
            className="ml-auto flex items-center gap-2 rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <CreditCard className="h-4 w-4" />
            Tabla de pagos
          </Link>
        )}
      </div>

      {/* Progreso Horizontal Compacto */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Progreso de la Solicitud</h2>

        <div className="relative">
          {/* Línea de progreso */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200" />
          <div
            className="absolute left-0 top-5 h-0.5 bg-green-600 transition-all duration-500"
            style={{ width: `${(etapaActual / (etapasDelFlujo.length - 1)) * 100}%` }}
          />

          {/* Etapas */}
          <div className="relative flex justify-between">
            {etapasDelFlujo.map((etapa, index) => {
              const { estado } = getEstadoEtapa(etapa);
              const isCompleted = estado === "completada";
              const isCurrent = estado === "en-proceso";
              const isPending = estado === "pendiente";

              return (
                <div key={etapa.numero} className="flex flex-col items-center" style={{ width: `${100 / etapasDelFlujo.length}%` }}>
                  {/* Círculo */}
                  <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-green-600 bg-green-600"
                      : isCurrent
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300 bg-white"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-sm font-medium text-gray-400">{etapa.numero}</span>
                    )}
                  </div>

                  {/* Texto */}
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {etapa.nombre.length > 30 ? etapa.nombre.substring(0, 30) + "..." : etapa.nombre}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Información de la solicitud */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Información de la Solicitud</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Número de Ticket</label>
            <p className="mt-1 text-sm text-gray-900">{solicitud.numeroTicket}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Estado</label>
            <p className="mt-1 text-sm text-gray-900">{solicitud.estado}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Fecha de Solicitud</label>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(solicitud.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
            </p>
          </div>
          {datosEntrada?.tipo_proceso && (
            <div>
              <label className="text-xs font-medium text-gray-500">Tipo de Proceso</label>
              <p className="mt-1 text-sm text-gray-900">{datosEntrada.tipo_proceso}</p>
            </div>
          )}
        </div>
      </div>

      {/* Datos del solicitante */}
      {datosEntrada && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Datos del Solicitante</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {datosEntrada.nombre_empleado && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Nombre del Empleado</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.nombre_empleado}</p>
                </div>
              )}
              {datosEntrada.cdr && (
                <div>
                  <label className="text-xs font-medium text-gray-500">CDR</label>
                  <p className="mt-1 text-sm text-gray-900">{getCDRDescripcion(datosEntrada.cdr)}</p>
                </div>
              )}
              {datosEntrada.puesto && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Puesto</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.puesto}</p>
                </div>
              )}
              {datosEntrada.area && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Área</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.area}</p>
                </div>
              )}
              {datosEntrada.antiguedad && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Antigüedad</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.antiguedad}</p>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Información del curso */}
      {datosEntrada && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Información del Curso</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {datosEntrada.nombre_curso && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Nombre del Curso</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.nombre_curso}</p>
                </div>
              )}
              {datosEntrada.institucion && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Institución</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.institucion}</p>
                </div>
              )}
              {datosEntrada.fecha_inicio && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Fecha de Inicio</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.fecha_inicio}</p>
                </div>
              )}
              {datosEntrada.fecha_fin && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Fecha de Fin</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.fecha_fin}</p>
                </div>
              )}
              {datosEntrada.duracion && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Duración</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.duracion}</p>
                </div>
              )}
              {datosEntrada.tipo_programa && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Tipo de Programa</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.tipo_programa}</p>
                </div>
              )}
              {datosEntrada.beneficio && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Beneficio</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.beneficio}</p>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Información financiera */}
      {datosEntrada && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Información Financiera</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {datosEntrada.tipo_moneda && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Tipo de Moneda</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.tipo_moneda}</p>
                </div>
              )}
              {datosEntrada.costo && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Costo</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">${formatMonto(datosEntrada.costo)}</p>
                </div>
              )}
              {datosEntrada.tipo_iva && (
                <div>
                  <label className="text-xs font-medium text-gray-500">IVA</label>
                  <p className="mt-1 text-sm text-gray-900">{datosEntrada.tipo_iva}</p>
                </div>
              )}
              {datosEntrada.iva && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Monto IVA</label>
                  <p className="mt-1 text-sm text-gray-900">${formatMonto(datosEntrada.iva)}</p>
                </div>
              )}
              {datosEntrada.retencion_iva && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Retención IVA</label>
                  <p className="mt-1 text-sm text-gray-900">${formatMonto(datosEntrada.retencion_iva)}</p>
                </div>
              )}
              {datosEntrada.retencion_isr && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Retención ISR</label>
                  <p className="mt-1 text-sm text-gray-900">${formatMonto(datosEntrada.retencion_isr)}</p>
                </div>
              )}
              {datosEntrada.total && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Total</label>
                  <p className="mt-1 text-sm font-bold text-green-600">${formatMonto(datosEntrada.total)}</p>
                </div>
              )}
            </div>
        </div>
      )}

      {/* Premisas (si existen) */}
      {parametrosData && Array.isArray(parametrosData.jsonParametros) && parametrosData.jsonParametros.length > 0 && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Premisas</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    % Asignado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cumple
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    No Cumple
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(parametrosData.jsonParametros as any[]).map((parametro, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {parametro.nombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {parametro.porcentaje_asignado || parametro.porcentajeAsignado}%
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {parametro.cumple ? (
                        <CheckCircle className="mx-auto h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {parametro.no_cumple || parametro.noCumple ? (
                        <XCircle className="mx-auto h-5 w-5 text-red-600" />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen de totales */}
          <div className="mt-6 rounded-sm border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Resumen</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Porcentaje Total Asignado</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {(parametrosData.jsonParametros as any[]).reduce((sum, p) => {
                    const porcentaje = parseFloat(p.porcentaje_asignado || p.porcentajeAsignado || "0");
                    return sum + porcentaje;
                  }, 0)}%
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Total de Premisas</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {(parametrosData.jsonParametros as any[]).length}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Monto Total</label>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  ${(() => {
                    // Calcular porcentaje total
                    const porcentajeTotal = (parametrosData.jsonParametros as any[]).reduce((sum, p) => {
                      const porcentaje = parseFloat(p.porcentaje_asignado || p.porcentajeAsignado || "0");
                      return sum + porcentaje;
                    }, 0);

                    // Obtener el total de la solicitud y limpiar formato
                    const totalSolicitud = parseFloat(
                      formatMonto(datosEntrada?.total || "0").replace(/,/g, "")
                    );

                    // Calcular monto basado en porcentaje
                    const montoCalculado = (totalSolicitud * porcentajeTotal) / 100;

                    // Formatear con comas y 2 decimales
                    return montoCalculado.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archivos adjuntos */}
      <ArchivosAdjuntos solicitudId={id} />
    </div>
  );
}
