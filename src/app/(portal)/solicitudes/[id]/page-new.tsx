"use client";

import { trpc } from "@/lib/trpc/client";
import { use } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CheckCircle, Clock, Circle } from "lucide-react";
import Link from "next/link";

export default function SolicitudDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: solicitud, isLoading } = trpc.requests.getSolicitudDetail.useQuery(id);

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

  // Definir las etapas del flujo
  const etapasDelFlujo = [
    { numero: 1, nombre: "Revisión de datos" },
    { numero: 2, nombre: "Aprobación Director/CDR" },
    { numero: 3, nombre: "Carga de premisas" },
    { numero: 4, nombre: "Aprobación Gerencia" },
  ];

  // Función para determinar el estado de cada etapa
  const getEstadoEtapa = (etapa: typeof etapasDelFlujo[0]) => {
    const tareaCorrespondiente = solicitud.tareasFlujo?.find((tarea: any) => {
      const nombreTarea = tarea.nombreTarea?.toLowerCase() || "";
      const nombreEtapa = etapa.nombre.toLowerCase();

      if (nombreEtapa.includes("revisión")) {
        return nombreTarea.includes("revisión") || nombreTarea.includes("revisa");
      }
      if (nombreEtapa.includes("director") || nombreEtapa.includes("cdr")) {
        return nombreTarea.includes("director") || nombreTarea.includes("cdr");
      }
      if (nombreEtapa.includes("carga") && nombreEtapa.includes("premisas")) {
        return nombreTarea.includes("carga") && nombreTarea.includes("premisas");
      }
      if (nombreEtapa.includes("gerencia")) {
        return nombreTarea.includes("gerencia") && nombreTarea.includes("formación");
      }
      return false;
    });

    if (!tareaCorrespondiente) {
      return "pendiente";
    }

    const estadoTarea = tareaCorrespondiente.estadoTarea;
    
    if (estadoTarea === "Completada" || estadoTarea === "Aprobado" || estadoTarea === "Cerrado completo") {
      return "completada";
    }
    if (estadoTarea === "Activa" || estadoTarea === "Solicitado" || estadoTarea === "Pendiente") {
      return "en-proceso";
    }

    return "pendiente";
  };

  // Determinar etapa actual
  const etapaActualIndex = etapasDelFlujo.findIndex(etapa => getEstadoEtapa(etapa) === "en-proceso");
  const etapaActual = etapaActualIndex >= 0 ? etapaActualIndex : etapasDelFlujo.length - 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href="/solicitudes"
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-white transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Solicitud de Formación</h1>
          <p className="text-sm text-gray-500">{solicitud.numeroTicket}</p>
        </div>
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
              const estado = getEstadoEtapa(etapa);
              const isCompleted = estado === "completada";
              const isCurrent = estado === "en-proceso";

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
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Texto */}
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {etapa.nombre}
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
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Información de la solicitud</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {format(new Date(solicitud.createdAt), "dd MMM yyyy", { locale: es })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CDR</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.cdr || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Evento</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.evento || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Modalidad</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.modalidad || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.tipo || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Autorizador</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.autorizador || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Empresa</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.empresa || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Datos del solicitante */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Datos del solicitante</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">No. Empleado</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.no_empleado || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.nombre_empleado || datosEntrada?.nombre || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Puesto</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.puesto || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de ingreso</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.fecha_ingreso ? format(new Date(datosEntrada.fecha_ingreso), "dd MMM yyyy", { locale: es }) : "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Antigüedad en el puesto</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.antiguedad || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">CECO</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.ceco || "-"}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Principales funciones</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.funciones_principales || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* En caso de solicitud grupal */}
      {datosEntrada?.evento === "Grupal" && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">En caso de solicitud grupal</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total de participantes</label>
              <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                {datosEntrada?.total_participantes || "-"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Áreas</label>
              <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                {datosEntrada?.areas || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información del curso */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Información del curso</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del curso o programa</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.nombre_curso || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Institución</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.institucion || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.fecha_inicio || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.fecha_fin || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Duración</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.duracion || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de programa</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.tipo_programa || "-"}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Beneficio/Indicador de impacto</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.beneficio || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Información financiera */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Información financiera</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de moneda</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.tipo_moneda || "MXN"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Costo</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.costo || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de I.V.A</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.tipo_iva || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">I.V.A</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.iva || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Retención I.V.A</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.retencion_iva || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Retención I.S.R</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {datosEntrada?.retencion_isr || "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total</label>
            <p className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold">
              {datosEntrada?.total || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
