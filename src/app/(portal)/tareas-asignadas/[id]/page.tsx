"use client";

import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, CheckCircle, XCircle, User, Calendar, FileText, Plus, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TareaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: tarea, isLoading } = trpc.requests.getTaskDetail.useQuery(id);
  const closeTaskMutation = trpc.requests.closeTask.useMutation();
  const saveParametrosMutation = trpc.requests.saveParametros.useMutation();
  const { data: parametrosExistentes } = trpc.requests.getParametros.useQuery(
    tarea?.numeroTicket || "",
    { enabled: !!tarea?.numeroTicket }
  );

  const [comments, setComments] = useState("");
  const [autorizador, setAutorizador] = useState("");
  const [autorizadorNombre, setAutorizadorNombre] = useState("");
  const [autorizadorCorreo, setAutorizadorCorreo] = useState("");
  const [showCommentsError, setShowCommentsError] = useState(false);
  const [showAutorizadorError, setShowAutorizadorError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Estado para parámetros (tabla dinámica)
  interface Parametro {
    id: string;
    nombre: string;
    porcentajeAsignado: string;
    cumple: boolean;
    noCumple: boolean;
  }
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSavingParametros, setIsSavingParametros] = useState(false);

  // Función para convertir correo a nombre legible
  const correoANombre = (correo: string): string => {
    if (!correo.includes('@')) return correo;

    // Extraer la parte antes del @
    const parteNombre = correo.split('@')[0];

    // Reemplazar guiones bajos y puntos por espacios
    const palabras = parteNombre.replace(/[._]/g, ' ').split(' ');

    // Capitalizar cada palabra
    const nombreFormateado = palabras
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
      .join(' ');

    return nombreFormateado;
  };

  // Inicializar autorizador cuando se carguen los datos
  useEffect(() => {
    if (tarea?.datosEntrada?.autorizador) {
      const autorizadorValue = tarea.datosEntrada.autorizador as string;
      setAutorizador(autorizadorValue);
      setAutorizadorCorreo(autorizadorValue);
      setAutorizadorNombre(correoANombre(autorizadorValue));
    }
  }, [tarea]);

  // Cargar parámetros existentes
  useEffect(() => {
    if (parametrosExistentes?.jsonParametros) {
      const params = parametrosExistentes.jsonParametros as any[];
      const parametrosConId = params.map((p, index) => ({
        id: `${Date.now()}-${index}`,
        nombre: p.nombre,
        porcentajeAsignado: p.porcentaje_asignado?.toString() || p.porcentajeAsignado || "",
        cumple: p.cumple || false,
        noCumple: p.no_cumple || p.noCumple || false,
      }));
      setParametros(parametrosConId);
    }
  }, [parametrosExistentes]);

  // Calcular porcentaje total
  const calcularPorcentajeTotal = () => {
    return parametros.reduce((sum, param) => {
      const porcentaje = parseFloat(param.porcentajeAsignado) || 0;
      return sum + porcentaje;
    }, 0);
  };

  // Calcular monto de beca
  const calcularMontoBeca = () => {
    const datosEntrada = tarea?.datosEntrada as Record<string, any>;
    const total = parseFloat(datosEntrada?.total?.replace(/[^0-9.-]+/g, "") || "0");
    const porcentajeTotal = calcularPorcentajeTotal();
    return (total * porcentajeTotal) / 100;
  };

  // Guardar parámetros
  const handleSaveParametros = async () => {
    if (!tarea?.numeroTicket) {
      alert("No se puede guardar: falta número de ticket");
      return;
    }

    if (parametros.length === 0) {
      alert("Debe agregar al menos un parámetro");
      return;
    }

    // Validar que todos los parámetros tengan nombre
    const parametrosInvalidos = parametros.filter(p => !p.nombre);
    if (parametrosInvalidos.length > 0) {
      alert("Todos los parámetros deben tener un nombre seleccionado");
      return;
    }

    setIsSavingParametros(true);
    try {
      const datosEntrada = tarea.datosEntrada as Record<string, any>;
      const total = parseFloat(datosEntrada?.total?.replace(/[^0-9.-]+/g, "") || "0");

      const result = await saveParametrosMutation.mutateAsync({
        numeroTicket: tarea.numeroTicket,
        parametros: parametros.map(p => ({
          nombre: p.nombre,
          porcentajeAsignado: p.porcentajeAsignado,
          cumple: p.cumple,
          noCumple: p.noCumple,
        })),
        totalCosto: total,
      });

      alert(`Parámetros guardados exitosamente\n\nPorcentaje Total: ${result.porcentajeTotal}%\nMonto de Beca: $${result.montoBeca.toFixed(2)}`);
    } catch (error) {
      console.error("Error al guardar parámetros:", error);
      alert("Error al guardar los parámetros");
    } finally {
      setIsSavingParametros(false);
    }
  };

  const handleClose = async (status: "completo" | "incompleto") => {
    // Validar autorizador (obligatorio siempre)
    if (!autorizadorCorreo.trim()) {
      setShowAutorizadorError(true);
      return;
    }

    // Validar comentarios (obligatorio solo para incompleto)
    if (status === "incompleto" && !comments.trim()) {
      setShowCommentsError(true);
      return;
    }

    setShowAutorizadorError(false);
    setShowCommentsError(false);

    setIsClosing(true);
    try {
      // Si es "Carga de premisas" y hay parámetros sin guardar, guardarlos primero
      const esCargaPremisas = tarea?.nombreTarea?.toLowerCase().includes("carga") &&
                              tarea?.nombreTarea?.toLowerCase().includes("premisas");

      let parametrosParaWebhook = null;

      if (esCargaPremisas && status === "completo" && parametros.length > 0 && tarea?.numeroTicket) {
        try {
          console.log('[Cierre Tarea] Guardando parámetros automáticamente antes de cerrar...');

          // Validar que todos los parámetros tengan nombre
          const parametrosInvalidos = parametros.filter(p => !p.nombre);
          if (parametrosInvalidos.length > 0) {
            alert("Todos los parámetros deben tener un nombre seleccionado antes de cerrar la tarea");
            setIsClosing(false);
            return;
          }

          const datosEntrada = tarea.datosEntrada as Record<string, any>;
          const total = parseFloat(datosEntrada?.total?.replace(/[^0-9.-]+/g, "") || "0");

          // Guardar parámetros
          await saveParametrosMutation.mutateAsync({
            numeroTicket: tarea.numeroTicket,
            parametros: parametros.map(p => ({
              nombre: p.nombre,
              porcentajeAsignado: p.porcentajeAsignado,
              cumple: p.cumple,
              noCumple: p.noCumple,
            })),
            totalCosto: total,
          });

          // Preparar parámetros para el webhook
          parametrosParaWebhook = parametros.map(p => ({
            nombre: p.nombre,
            porcentaje_asignado: p.porcentajeAsignado,
            cumple: p.cumple,
            no_cumple: p.noCumple,
          }));

          console.log('[Cierre Tarea] Parámetros guardados exitosamente');
        } catch (paramError) {
          console.error('[Cierre Tarea] Error al guardar parámetros:', paramError);
          alert("Error al guardar los parámetros. Por favor, guárdelos manualmente antes de cerrar la tarea.");
          setIsClosing(false);
          return;
        }
      }

      // Actualizar la tarea en la base de datos
      await closeTaskMutation.mutateAsync({
        taskId: id,
        status,
        comments: comments.trim() || undefined,
      });

      // Llamar al webhook de n8n si existe (usando proxy para evitar CORS)
      if (tarea?.webhookResumeUrl) {
        try {
          // Determinar el estado según el tipo de tarea
          let estadoTarea = "";
          if (tarea.tipoTarea === "Aprobación") {
            estadoTarea = status === "completo" ? "Aprobado" : "Rechazado";
          } else {
            estadoTarea = status === "completo" ? "Cerrado completo" : "Cerrado incompleto";
          }

          // Preparar datos del webhook
          const webhookData: Record<string, any> = {
            webhookUrl: tarea.webhookResumeUrl,
            comentarios: comments.trim() || "",
            estado_tarea: estadoTarea,
            autorizador: autorizadorCorreo.trim(),
          };

          // Si es "Carga de premisas" y tenemos parámetros, incluirlos
          if (esCargaPremisas && parametrosParaWebhook) {
            webhookData.json_parametros = parametrosParaWebhook;
            console.log('[Webhook] Parámetros incluidos:', webhookData.json_parametros);
          }

          console.log('[Webhook] Llamando al webhook mediante proxy');
          console.log('[Webhook] URL destino:', tarea.webhookResumeUrl);
          console.log('[Webhook] Datos completos:', webhookData);

          const webhookResponse = await fetch('/api/webhook/resume', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData),
          });

          console.log('[Webhook] Status del proxy:', webhookResponse.status);

          if (webhookResponse.ok) {
            const responseData = await webhookResponse.json();
            console.log('[Webhook] Respuesta exitosa:', responseData);
          } else {
            const errorData = await webhookResponse.json();
            console.error('[Webhook] Error:', errorData);
          }
        } catch (webhookError) {
          console.error('[Webhook] Error al llamar:', webhookError);
          // No bloqueamos el flujo si falla el webhook
        }
      } else {
        console.log('[Webhook] No hay webhook_resume_url configurado');
      }

      // Mensaje de confirmación según el tipo de tarea
      if (tarea.tipoTarea === "Aprobación") {
        alert(`Solicitud ${status === "completo" ? "aprobada" : "rechazada"} exitosamente`);
      } else {
        alert(`Tarea cerrada como ${status === "completo" ? "completa" : "incompleta"} exitosamente`);
      }

      // Redirigir al dashboard y forzar recarga
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      alert("Error al cerrar la tarea");
      console.error(error);
    } finally {
      setIsClosing(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === "pendiente") return "bg-amber-100 text-amber-800";
    if (estadoLower === "activa" || estadoLower === "abierto") return "bg-blue-100 text-blue-800";
    if (estadoLower === "completada") return "bg-green-100 text-green-800";
    if (estadoLower === "incompleta") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!tarea) {
    return (
      <div className="rounded-sm border border-border bg-white p-8 text-center">
        <p className="text-gray-500">Tarea no encontrada</p>
      </div>
    );
  }

  const datosEntrada = tarea.datosEntrada as Record<string, any>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tareas-asignadas"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-white transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tarea.tipoTarea === "Aprobación" ? "Detalle de la Solicitud de Aprobación" : "Detalle de Tarea"}
            </h1>
            <p className="text-sm text-gray-500">{tarea.nombreTarea}</p>
          </div>
        </div>
      </div>

      {/* Apartado 1: Información General */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Información General</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Número de Solicitud</label>
            <p className="mt-1 text-sm font-semibold text-gray-900">{tarea.numeroTicket}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Usuario Creador</label>
            <div className="mt-1 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{tarea.usuarioCreador}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Fecha de Creación</label>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">
                {format(new Date(tarea.solicitudCreatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Estado de Solicitud</label>
            <div className="mt-1">
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadgeColor(tarea.estadoSolicitud)}`}>
                {tarea.estadoSolicitud}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Estado de Tarea</label>
            <div className="mt-1">
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEstadoBadgeColor(tarea.estadoTarea)}`}>
                {tarea.estadoTarea}
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Tipo de Proceso</label>
            <p className="mt-1 text-sm text-gray-900">{tarea.nombreSolicitud}</p>
          </div>
        </div>
      </div>

      {/* Apartado 2: Datos del Formulario (Solo Lectura) - Replica exacta del formulario original */}
      <div className="space-y-6">
        {/* Información de la solicitud */}
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Información de la solicitud</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.fecha || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CDR</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.cdr ? `${datosEntrada.cdr} - ${tarea.cdrDescripcion || ""}` : "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Evento</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.evento || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Modalidad</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.modalidad || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.tipo || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Autorizador <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={autorizadorNombre}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
              <input
                type="hidden"
                value={autorizadorCorreo}
              />
              {showAutorizadorError && (
                <p className="mt-1 text-xs text-red-600">El autorizador es obligatorio</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Se completa automáticamente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Empresa</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.empresa || "N/A"}
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
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.no_empleado || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.nombre || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Puesto</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.puesto || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de ingreso</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.fecha_ingreso || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Antigüedad en el puesto</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.antiguedad || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CECO</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.ceco || "N/A"}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Principales funciones</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 whitespace-pre-wrap">
                {datosEntrada?.funciones || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Información del curso */}
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Información del curso</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del curso o programa</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.nombre_curso || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Institución</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.institucion || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.fecha_inicio || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.fecha_fin || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duración</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.duracion || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de programa</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.tipo_programa || "N/A"}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Beneficio/Indicador de impacto</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 whitespace-pre-wrap">
                {datosEntrada?.beneficio || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Información financiera */}
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Información financiera</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de moneda</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.tipo_moneda || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.costo || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de I.V.A</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.tipo_iva || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">I.V.A</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.iva || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Retención I.V.A</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.retencion_iva || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Retención I.S.R</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                {datosEntrada?.retencion_isr || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total</label>
              <p className="mt-1 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                {datosEntrada?.total || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apartado de Parámetros (solo para tarea "Carga de premisas" o "Carga premisas") */}
      {(tarea.nombreTarea?.toLowerCase().includes("carga") && tarea.nombreTarea?.toLowerCase().includes("premisas")) && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Parámetros</h2>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                const nuevoParametro: Parametro = {
                  id: Date.now().toString(),
                  nombre: "",
                  porcentajeAsignado: "",
                  cumple: false,
                  noCumple: false,
                };
                setParametros([...parametros, nuevoParametro]);
                setEditingId(nuevoParametro.id);
              }}
              disabled={
                tarea.estadoTarea === "Cerrado completo" ||
                tarea.estadoTarea === "Cerrado incompleto" ||
                tarea.estadoTarea === "Completada" ||
                tarea.estadoTarea === "Incompleta" ||
                tarea.estadoTarea === "Aprobado" ||
                tarea.estadoTarea === "Rechazado"
              }
              className="flex items-center gap-2 rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </button>
            <button
              onClick={() => setParametros([])}
              disabled={
                tarea.estadoTarea === "Cerrado completo" ||
                tarea.estadoTarea === "Cerrado incompleto" ||
                tarea.estadoTarea === "Completada" ||
                tarea.estadoTarea === "Incompleta" ||
                tarea.estadoTarea === "Aprobado" ||
                tarea.estadoTarea === "Rechazado"
              }
              className="flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Eliminar todo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    % Asignado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cumple
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    No cumple
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {parametros.map((parametro) => {
                  const isEditing = editingId === parametro.id;
                  const isSpecialNombre = [
                    "Carta impacto y contribución",
                    "Programa registrado en PID",
                    "Alto potencial"
                  ].includes(parametro.nombre);

                  return (
                    <tr key={parametro.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={
                                tarea.estadoTarea === "Cerrado completo" ||
                                tarea.estadoTarea === "Cerrado incompleto" ||
                                tarea.estadoTarea === "Completada" ||
                                tarea.estadoTarea === "Incompleta" ||
                                tarea.estadoTarea === "Aprobado" ||
                                tarea.estadoTarea === "Rechazado"
                              }
                              className="text-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Guardar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingId(parametro.id)}
                              disabled={
                                tarea.estadoTarea === "Cerrado completo" ||
                                tarea.estadoTarea === "Cerrado incompleto" ||
                                tarea.estadoTarea === "Completada" ||
                                tarea.estadoTarea === "Incompleta" ||
                                tarea.estadoTarea === "Aprobado" ||
                                tarea.estadoTarea === "Rechazado"
                              }
                              className="text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setParametros(parametros.filter(p => p.id !== parametro.id))}
                            disabled={
                              tarea.estadoTarea === "Cerrado completo" ||
                              tarea.estadoTarea === "Cerrado incompleto" ||
                              tarea.estadoTarea === "Completada" ||
                              tarea.estadoTarea === "Incompleta" ||
                              tarea.estadoTarea === "Aprobado" ||
                              tarea.estadoTarea === "Rechazado"
                            }
                            className="text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={parametro.nombre}
                            onChange={(e) => {
                              const newNombre = e.target.value;
                              const isSpecial = [
                                "Carta impacto y contribución",
                                "Programa registrado en PID",
                                "Alto potencial"
                              ].includes(newNombre);

                              setParametros(parametros.map(p =>
                                p.id === parametro.id
                                  ? {
                                      ...p,
                                      nombre: newNombre,
                                      porcentajeAsignado: isSpecial ? "5" : p.porcentajeAsignado,
                                      cumple: isSpecial ? true : p.cumple,
                                      noCumple: isSpecial ? false : p.noCumple,
                                    }
                                  : p
                              ));
                            }}
                            className="w-full rounded-sm border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="">Seleccione...</option>
                            <option value="Antigüedad">Antigüedad</option>
                            <option value="Evaluación del desempeño">Evaluación del desempeño</option>
                            <option value="Carta impacto y contribución">Carta impacto y contribución</option>
                            <option value="Programa registrado en PID">Programa registrado en PID</option>
                            <option value="Documentación completa por convocatoria">Documentación completa por convocatoria</option>
                            <option value="Feche de entrega de información en tiempo">Feche de entrega de información en tiempo</option>
                            <option value="Curso y/o brigada PAC">Curso y/o brigada PAC</option>
                            <option value="Curso PID">Curso PID</option>
                            <option value="Curso técnico">Curso técnico</option>
                            <option value="Alto potencial">Alto potencial</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{parametro.nombre || "Sin nombre"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing && !isSpecialNombre ? (
                          <input
                            type="text"
                            value={parametro.porcentajeAsignado}
                            onChange={(e) => {
                              setParametros(parametros.map(p =>
                                p.id === parametro.id ? { ...p, porcentajeAsignado: e.target.value } : p
                              ));
                            }}
                            className="w-20 rounded-sm border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            placeholder="%"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{parametro.porcentajeAsignado || "0"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={parametro.cumple}
                          onChange={(e) => {
                            if (!isSpecialNombre) {
                              setParametros(parametros.map(p =>
                                p.id === parametro.id ? { ...p, cumple: e.target.checked, noCumple: false } : p
                              ));
                            }
                          }}
                          disabled={isSpecialNombre}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={parametro.noCumple}
                          onChange={(e) => {
                            if (!isSpecialNombre) {
                              setParametros(parametros.map(p =>
                                p.id === parametro.id ? { ...p, noCumple: e.target.checked, cumple: false } : p
                              ));
                            }
                          }}
                          disabled={isSpecialNombre}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
                {parametros.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                      No hay parámetros agregados. Haga clic en "Añadir" para agregar uno.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen de totales */}
          {parametros.length > 0 && (
            <div className="mt-6 rounded-sm border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Resumen</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-500">Total del Curso</label>
                  <p className="text-lg font-semibold text-gray-900">
                    ${parseFloat((tarea?.datosEntrada as Record<string, any>)?.total?.replace(/[^0-9.-]+/g, "") || "0").toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Porcentaje Total Asignado</label>
                  <p className="text-lg font-semibold text-blue-600">
                    {calcularPorcentajeTotal().toFixed(2)}%
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Monto de Beca</label>
                  <p className="text-lg font-semibold text-green-600">
                    ${calcularMontoBeca().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón de guardar */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveParametros}
              disabled={
                isSavingParametros ||
                parametros.length === 0 ||
                tarea.estadoTarea === "Cerrado completo" ||
                tarea.estadoTarea === "Cerrado incompleto" ||
                tarea.estadoTarea === "Completada" ||
                tarea.estadoTarea === "Incompleta" ||
                tarea.estadoTarea === "Aprobado" ||
                tarea.estadoTarea === "Rechazado"
              }
              className="flex items-center gap-2 rounded-sm bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {isSavingParametros ? "Guardando..." : "Guardar Parámetros"}
            </button>
          </div>
        </div>
      )}

      {/* Apartado de Parámetros Guardados (solo lectura para todas las tareas excepto Carga de premisas) */}
      {parametrosExistentes && !(tarea.nombreTarea?.toLowerCase().includes("carga") && tarea.nombreTarea?.toLowerCase().includes("premisas")) && (
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Parámetros de Beca</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    % Asignado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cumple
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    No cumple
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(parametrosExistentes.jsonParametros as any[]).map((parametro, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{parametro.nombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{parametro.porcentajeAsignado || parametro.porcentaje_asignado}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={parametro.cumple}
                        disabled
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={parametro.noCumple || parametro.no_cumple}
                        disabled
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                      />
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
                <label className="text-xs text-gray-500">Total del Curso</label>
                <p className="text-lg font-semibold text-gray-900">
                  ${parseFloat((tarea?.datosEntrada as Record<string, any>)?.total?.replace(/[^0-9.-]+/g, "") || "0").toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Porcentaje Total Asignado</label>
                <p className="text-lg font-semibold text-blue-600">
                  {parseFloat(parametrosExistentes.porcentajeAsignado.toString()).toFixed(2)}%
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto de Beca</label>
                <p className="text-lg font-semibold text-green-600">
                  ${parseFloat(parametrosExistentes.montoBeca.toString()).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apartado 3: Comentarios y Acciones */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {tarea.tipoTarea === "Aprobación" ? "Cierre de Solicitud de Aprobación" : "Cierre de Tarea"}
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Comentarios {showCommentsError && <span className="text-red-600">*</span>}
          </label>
          <textarea
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              setShowCommentsError(false);
            }}
            disabled={
              tarea.estadoTarea === "Cerrado completo" ||
              tarea.estadoTarea === "Cerrado incompleto" ||
              tarea.estadoTarea === "Completada" ||
              tarea.estadoTarea === "Incompleta" ||
              tarea.estadoTarea === "Aprobado" ||
              tarea.estadoTarea === "Rechazado"
            }
            rows={4}
            className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Ingrese sus comentarios aquí..."
          />
          {showCommentsError && (
            <p className="mt-1 text-xs text-red-600">
              Los comentarios son obligatorios para cerrar como incompleto
            </p>
          )}
        </div>

        <div className="flex gap-3">
          {tarea.tipoTarea === "Aprobación" ? (
            <>
              <button
                onClick={() => handleClose("completo")}
                disabled={
                  isClosing ||
                  tarea.estadoTarea === "Aprobado" ||
                  tarea.estadoTarea === "Rechazado" ||
                  tarea.estadoTarea === "Cerrado completo" ||
                  tarea.estadoTarea === "Cerrado incompleto" ||
                  tarea.estadoTarea === "Completada" ||
                  tarea.estadoTarea === "Incompleta"
                }
                className="flex items-center gap-2 rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {isClosing ? "Aprobando..." : "Aprobar"}
              </button>
              <button
                onClick={() => handleClose("incompleto")}
                disabled={
                  isClosing ||
                  tarea.estadoTarea === "Aprobado" ||
                  tarea.estadoTarea === "Rechazado" ||
                  tarea.estadoTarea === "Cerrado completo" ||
                  tarea.estadoTarea === "Cerrado incompleto" ||
                  tarea.estadoTarea === "Completada" ||
                  tarea.estadoTarea === "Incompleta"
                }
                className="flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {isClosing ? "Rechazando..." : "Rechazar"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleClose("completo")}
                disabled={
                  isClosing ||
                  tarea.estadoTarea === "Completada" ||
                  tarea.estadoTarea === "Incompleta" ||
                  tarea.estadoTarea === "Cerrado completo" ||
                  tarea.estadoTarea === "Cerrado incompleto" ||
                  tarea.estadoTarea === "Aprobado" ||
                  tarea.estadoTarea === "Rechazado"
                }
                className="flex items-center gap-2 rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {isClosing ? "Cerrando..." : "Cerrado Completo"}
              </button>
              <button
                onClick={() => handleClose("incompleto")}
                disabled={
                  isClosing ||
                  tarea.estadoTarea === "Completada" ||
                  tarea.estadoTarea === "Incompleta" ||
                  tarea.estadoTarea === "Cerrado completo" ||
                  tarea.estadoTarea === "Cerrado incompleto" ||
                  tarea.estadoTarea === "Aprobado" ||
                  tarea.estadoTarea === "Rechazado"
                }
                className="flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {isClosing ? "Cerrando..." : "Cerrado Incompleto"}
              </button>
            </>
          )}
        </div>

        {(tarea.estadoTarea === "Completada" || tarea.estadoTarea === "Incompleta") && (
          <div className="mt-4 rounded-sm bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Esta tarea ya ha sido cerrada como <strong>{tarea.estadoTarea}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
