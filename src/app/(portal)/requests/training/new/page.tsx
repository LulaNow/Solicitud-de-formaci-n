"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Calendar, Loader2, Search } from "lucide-react";
import { getLocalDate, formatDateES, getDaysDifference } from "@/lib/utils/date-utils";
import { getEmpleado, getPuesto, getDepartamento, validarNumeroEmpleado } from "@/lib/api/empleados-api";
import { getAutorizador } from "@/lib/api/autorizador-api";

export default function NewTrainingRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmpleado, setIsLoadingEmpleado] = useState(false);
  const [empleadoError, setEmpleadoError] = useState<string | null>(null);
  const [tiposProgramaDisponibles, setTiposProgramaDisponibles] = useState<string[]>([
    "Curso",
    "Certificación",
    "Maestría",
    "Seminario",
    "Titulación de maestría",
    "Licenciatura",
    "Diplomado",
    "Bachillerato",
    "Titulación de licenciatura",
    "Otros"
  ]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Información de la solicitud
    fecha: getLocalDate(),
    cdr: "",
    evento: "",
    modalidad: "",
    tipo: "",
    autorizador: "",
    correoAutorizador: "", // Campo oculto para el correo
    empresa: "",

    // Datos del solicitante
    noEmpleado: "",
    nombre: "",
    clavePuesto: "", // Campo oculto
    area: "", // Campo oculto
    centro: "", // Campo oculto
    linea: "", // Campo oculto
    puesto: "",
    fechaIngreso: "",
    antiguedad: "",
    ceco: "",
    funcionesPrincipales: "",

    // Solicitud grupal
    totalParticipantes: "",
    areas: "",

    // Información del curso
    nombreCurso: "",
    institucion: "",
    fechaInicio: "",
    fechaFin: "",
    duracion: "",
    tipoPrograma: "",
    beneficio: "",

    // Información financiera
    tipoMoneda: "MXN",
    costo: "",
    tipoIVA: "",
    iva: "",
    retencionIVA: "",
    retencionISR: "",
    total: "",
  });

  // Consultar datos del empleado cuando se tienen empresa y número de empleado
  useEffect(() => {
    const consultarEmpleado = async () => {
      // Si hay número de empleado pero no hay empresa, mostrar mensaje
      if (formData.noEmpleado && !formData.empresa) {
        setEmpleadoError("Por favor, selecciona primero la empresa");
        return;
      }

      // Validar que tengamos empresa y número de empleado
      if (!formData.empresa || !formData.noEmpleado) {
        setEmpleadoError(null);
        return;
      }

      setIsLoadingEmpleado(true);
      setEmpleadoError(null);

      try {
        const response = await getEmpleado(formData.empresa, formData.noEmpleado);

        if (response.success) {
          // Actualizar campos con los datos del empleado
          setFormData(prev => ({
            ...prev,
            nombre: response.nombreCompleto || "",
            clavePuesto: response.clavePuesto || "",
            area: response.area || "",
            centro: response.centro || "",
            linea: response.linea || "",
            fechaIngreso: response.fechaIngreso || "",
            antiguedad: response.antiguedad || "",
          }));

          console.log("[Formulario] Datos del empleado cargados:", response.nombreCompleto);

          // Consultar descripción del puesto si tenemos clavePuesto
          if (response.clavePuesto) {
            const puestoResponse = await getPuesto(formData.empresa, response.clavePuesto);
            if (puestoResponse.success) {
              setFormData(prev => ({
                ...prev,
                puesto: puestoResponse.descripcionPuesto || "",
              }));
              console.log("[Formulario] Descripción del puesto cargada:", puestoResponse.descripcionPuesto);
            }
          }

          // Consultar CECO si tenemos area, centro y linea
          if (response.area && response.centro && response.linea) {
            const departamentoResponse = await getDepartamento(
              formData.empresa,
              response.area,
              response.centro,
              response.linea
            );
            if (departamentoResponse.success) {
              setFormData(prev => ({
                ...prev,
                ceco: departamentoResponse.cecoDescripcion || "",
              }));
              console.log("[Formulario] CECO cargado:", departamentoResponse.cecoDescripcion);
            }
          }

          // El autorizador se consultará en un efecto separado basado en el CDR
        } else {
          setEmpleadoError(response.error || "No se encontró el empleado");
          // Limpiar campos si no se encuentra
          setFormData(prev => ({
            ...prev,
            nombre: "",
            clavePuesto: "",
            area: "",
            centro: "",
            linea: "",
            puesto: "",
            fechaIngreso: "",
            antiguedad: "",
            ceco: "",
            autorizador: "",
            correoAutorizador: "",
          }));
        }
      } catch (error) {
        console.error("[Formulario] Error al consultar empleado:", error);
        setEmpleadoError("Error al consultar datos del empleado");
      } finally {
        setIsLoadingEmpleado(false);
      }
    };

    // Debounce: esperar 1 segundo después de que el usuario deje de escribir
    const timeoutId = setTimeout(consultarEmpleado, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.empresa, formData.noEmpleado]);

  // Consultar tipos de beca disponibles según el puesto
  useEffect(() => {
    const consultarTiposBeca = async () => {
      if (!formData.puesto) {
        // Si no hay puesto, mostrar todas las opciones
        setTiposProgramaDisponibles([
          "Curso",
          "Certificación",
          "Maestría",
          "Seminario",
          "Titulación de maestría",
          "Licenciatura",
          "Diplomado",
          "Bachillerato",
          "Titulación de licenciatura",
          "Otros"
        ]);
        return;
      }

      try {
        console.log("[Formulario] Consultando tipos de beca para puesto:", formData.puesto);

        const response = await fetch(
          `/api/tipos-beca?puesto=${encodeURIComponent(formData.puesto)}`
        );

        const data = await response.json();

        if (data.success && data.tiposBeca) {
          setTiposProgramaDisponibles(data.tiposBeca);
          console.log("[Formulario] Tipos de beca disponibles:", data.tiposBeca);

          // Si el tipo de programa actual no está en las opciones disponibles, limpiarlo
          if (formData.tipoPrograma && !data.tiposBeca.includes(formData.tipoPrograma)) {
            setFormData(prev => ({ ...prev, tipoPrograma: "" }));
          }
        }
      } catch (error) {
        console.error("[Formulario] Error al consultar tipos de beca:", error);
      }
    };

    consultarTiposBeca();
  }, [formData.puesto]);

  // Consultar autorizador basado en el CDR
  useEffect(() => {
    const consultarAutorizador = async () => {
      // Validar que tengamos empresa, número de empleado y CDR
      if (!formData.empresa || !formData.noEmpleado || !formData.cdr) {
        return;
      }

      try {
        console.log("[Formulario] Consultando autorizador para CDR:", formData.cdr);

        if (formData.cdr === "1000") {
          // CDR CORPORATIVO: Usar API de Director
          console.log("[Formulario] CDR Corporativo - Usando API Director");
          const autorizadorResponse = await getAutorizador(formData.empresa, formData.noEmpleado);

          if (autorizadorResponse.success) {
            setFormData(prev => ({
              ...prev,
              autorizador: autorizadorResponse.nombreCompleto || "",
              correoAutorizador: autorizadorResponse.correoElectronico || "",
            }));
            console.log("[Formulario] Autorizador (Director) cargado:", autorizadorResponse.nombreCompleto);
          } else {
            console.log("[Formulario] Error al cargar autorizador:", autorizadorResponse.error);
          }
        } else {
          // Otro CDR: Consultar gerente_cdr de la tabla cdrs
          console.log("[Formulario] CDR Regional - Consultando gerente CDR");
          const response = await fetch(`/api/cdr-gerente?cdr=${formData.cdr}`);
          const data = await response.json();

          if (data.success && data.gerenteCdr) {
            setFormData(prev => ({
              ...prev,
              autorizador: data.nombreGerente || data.gerenteCdr,
              correoAutorizador: data.gerenteCdr,
            }));
            console.log("[Formulario] Autorizador (Gerente CDR) cargado:", data.nombreGerente || data.gerenteCdr);
          } else {
            console.log("[Formulario] Error al cargar gerente CDR:", data.error);
          }
        }
      } catch (error) {
        console.error("[Formulario] Error al consultar autorizador:", error);
      }
    };

    consultarAutorizador();
  }, [formData.cdr, formData.empresa, formData.noEmpleado]);

  // Calcular duración entre fechas en formato años, meses o días
  useEffect(() => {
    if (formData.fechaInicio && formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);

      // Calcular diferencia en años, meses y días
      let years = fin.getFullYear() - inicio.getFullYear();
      let months = fin.getMonth() - inicio.getMonth();
      let days = fin.getDate() - inicio.getDate();

      // Ajustar si los días son negativos
      if (days < 0) {
        months--;
        const prevMonth = new Date(fin.getFullYear(), fin.getMonth(), 0);
        days += prevMonth.getDate();
      }

      // Ajustar si los meses son negativos
      if (months < 0) {
        years--;
        months += 12;
      }

      // Formatear según lo que aplique
      let duracionTexto = "";

      if (years > 0) {
        duracionTexto = `${years} año${years !== 1 ? 's' : ''}`;
        if (months > 0) {
          duracionTexto += `, ${months} mes${months !== 1 ? 'es' : ''}`;
        }
      } else if (months > 0) {
        duracionTexto = `${months} mes${months !== 1 ? 'es' : ''}`;
        if (days > 0) {
          duracionTexto += `, ${days} día${days !== 1 ? 's' : ''}`;
        }
      } else {
        duracionTexto = `${days} día${days !== 1 ? 's' : ''}`;
      }

      setFormData(prev => ({ ...prev, duracion: duracionTexto }));
    }
  }, [formData.fechaInicio, formData.fechaFin]);

  // Calcular IVA
  useEffect(() => {
    if (formData.costo && formData.tipoIVA) {
      const costo = parseFloat(formData.costo.replace(/[^0-9.-]+/g, ""));
      const porcentaje = parseFloat(formData.tipoIVA.replace('%', '')) / 100;
      const ivaCalculado = costo * porcentaje;
      setFormData(prev => ({
        ...prev,
        iva: formatCurrency(ivaCalculado.toString())
      }));
    }
  }, [formData.costo, formData.tipoIVA]);

  // Calcular Total
  useEffect(() => {
    const costo = parseFloat(formData.costo.replace(/[^0-9.-]+/g, "") || "0");
    const iva = parseFloat(formData.iva.replace(/[^0-9.-]+/g, "") || "0");
    const retencionIVA = parseFloat(formData.retencionIVA.replace(/[^0-9.-]+/g, "") || "0");
    const retencionISR = parseFloat(formData.retencionISR.replace(/[^0-9.-]+/g, "") || "0");

    const totalCalculado = costo + iva + retencionIVA + retencionISR;
    setFormData(prev => ({
      ...prev,
      total: formatCurrency(totalCalculado.toString())
    }));
  }, [formData.costo, formData.iva, formData.retencionIVA, formData.retencionISR]);

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    if (isNaN(number)) return "";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(number);
  };

  const handleCurrencyChange = (field: string, value: string) => {
    // Permitir solo números y punto decimal
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
  };

  const handleCurrencyBlur = (field: string) => {
    // Formatear a moneda cuando el usuario termina de escribir
    const currentValue = formData[field as keyof typeof formData] as string;
    if (currentValue) {
      setFormData(prev => ({ ...prev, [field]: formatCurrency(currentValue) }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obligatorios
    const requiredFields = [
      { field: 'evento', label: 'Evento' },
      { field: 'modalidad', label: 'Modalidad' },
      { field: 'tipo', label: 'Tipo' },
      { field: 'empresa', label: 'Empresa' },
      { field: 'noEmpleado', label: 'No. Empleado' },
      { field: 'funcionesPrincipales', label: 'Principales funciones' },
      { field: 'nombreCurso', label: 'Nombre del curso' },
      { field: 'institucion', label: 'Institución' },
      { field: 'tipoPrograma', label: 'Tipo de programa' },
      { field: 'costo', label: 'Costo' },
      { field: 'tipoIVA', label: 'Tipo de I.V.A' },
      { field: 'total', label: 'Total' },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`El campo "${label}" es obligatorio`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      console.log("[Formulario] Enviando solicitud a n8n...");

      // Preparar datos para n8n
      const datosFormulario = {
        fecha: formData.fecha,
        cdr: formData.cdr,
        evento: formData.evento,
        modalidad: formData.modalidad,
        tipo: formData.tipo,
        autorizador: formData.correoAutorizador || formData.autorizador, // Enviar correo en lugar de nombre
        empresa: formData.empresa,
        no_empleado: formData.noEmpleado,
        nombre: formData.nombre,
        puesto: formData.puesto,
        fecha_ingreso: formData.fechaIngreso,
        antiguedad: formData.antiguedad,
        ceco: formData.ceco,
        funciones: formData.funcionesPrincipales,
        nombre_curso: formData.nombreCurso,
        institucion: formData.institucion,
        fecha_inicio: formData.fechaInicio,
        fecha_fin: formData.fechaFin,
        duracion: formData.duracion,
        tipo_programa: formData.tipoPrograma,
        beneficio: formData.beneficio,
        tipo_moneda: formData.tipoMoneda,
        costo: formData.costo,
        tipo_iva: formData.tipoIVA,
        iva: formData.iva,
        retencion_iva: formData.retencionIVA,
        retencion_isr: formData.retencionISR,
        total: formData.total,
      };

      // Enviar a n8n
      const response = await fetch('/api/solicitudes/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datos_formulario: datosFormulario,
        }),
      });

      console.log("[Formulario] Status de respuesta:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Formulario] Error en respuesta:", errorText);
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("[Formulario] Respuesta raw:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("[Formulario] Error al parsear JSON:", parseError);
        console.error("[Formulario] Respuesta recibida:", responseText);
        throw new Error('Respuesta inválida del servidor');
      }

      console.log("[Formulario] Datos parseados:", data);

      if (!data.success) {
        throw new Error(data.error || 'Error al enviar solicitud');
      }

      console.log("[Formulario] Solicitud enviada exitosamente");
      console.log("[Formulario] Ticket:", data.numero_ticket);

      alert(`Solicitud creada exitosamente\nNúmero de ticket: ${data.numero_ticket || 'Pendiente'}`);
      router.push("/dashboard");
    } catch (error) {
      console.error("[Formulario] Error al crear solicitud:", error);
      alert(`Error al crear la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Crear Solicitud de Formación</h1>
        <p className="text-sm text-gray-500">Complete todos los campos obligatorios marcados con <span className="text-red-600">*</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información de la solicitud */}
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Información de la solicitud</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="text"
                value={formatDateES(formData.fecha)}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>

            {/* CDR */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CDR <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.cdr}
                onChange={(e) => handleChange('cdr', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="1000">1000 - CORPORATIVO</option>
                <option value="3000">3000 - BAJIO</option>
                <option value="3010">3010 - CHIHUAHUA</option>
                <option value="3020">3020 - CULIACAN</option>
                <option value="3030">3030 - GUADALAJARA</option>
                <option value="3040">3040 - LA PAZ</option>
                <option value="3050">3050 - MERIDA</option>
                <option value="3060">3060 - MEXICO NORTE</option>
                <option value="3070">3070 - MEXICO SUR</option>
                <option value="3080">3080 - MONTERREY</option>
                <option value="3090">3090 - MORELIA</option>
                <option value="3100">3100 - PUEBLA</option>
                <option value="3110">3110 - TIJUANA</option>
                <option value="3120">3120 - TUXTLA</option>
                <option value="3130">3130 - VERACRUZ</option>
              </select>
            </div>

            {/* Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Evento <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.evento}
                onChange={(e) => handleChange('evento', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="Grupal">Grupal</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Modalidad <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.modalidad}
                onChange={(e) => handleChange('modalidad', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="Beca">Beca</option>
                <option value="Individual">Individual</option>
                <option value="Técnica">Técnica</option>
              </select>
            </div>

            {/* Autorizador */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Autorizador</label>
              <input
                type="text"
                value={formData.autorizador}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">Se completa automáticamente</p>
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Empresa <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.empresa}
                onChange={(e) => handleChange('empresa', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="Nadro">Nadro</option>
                <option value="Ubictum">Ubictum</option>
                <option value="PRESTOMYC">PRESTOMYC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Datos del solicitante */}
        <div className="rounded-sm border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Datos del solicitante</h2>
            {isLoadingEmpleado && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Consultando empleado...</span>
              </div>
            )}
          </div>

          {empleadoError && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {empleadoError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* No. Empleado */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                No. Empleado <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.noEmpleado}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange('noEmpleado', value);
                  }}
                  placeholder="Ej: 147694"
                  className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
                {isLoadingEmpleado && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Solo números</p>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Se completa automáticamente</p>
            </div>

            {/* Puesto */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Puesto</label>
              <input
                type="text"
                value={formData.puesto}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Se completa automáticamente</p>
            </div>

            {/* Fecha de ingreso */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de ingreso</label>
              <input
                type="text"
                value={formData.fechaIngreso ? formatDateES(formData.fechaIngreso) : ""}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Se completa automáticamente</p>
            </div>

            {/* Antigüedad en el puesto */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Antigüedad en el puesto</label>
              <input
                type="text"
                value={formData.antiguedad}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Se calcula automáticamente</p>
            </div>

            {/* CECO */}
            <div>
              <label className="block text-sm font-medium text-gray-700">CECO</label>
              <input
                type="text"
                value={formData.ceco}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Se completa automáticamente</p>
            </div>

            {/* Principales funciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Principales funciones <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.funcionesPrincipales}
                onChange={(e) => handleChange('funcionesPrincipales', e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>
          </div>
        </div>

        {/* En caso de solicitud grupal */}
        {formData.evento === "Grupal" && (
          <div className="rounded-sm border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">En caso de solicitud grupal</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Total de participantes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Total de participantes</label>
                <input
                  type="text"
                  value={formData.totalParticipantes}
                  onChange={(e) => handleChange('totalParticipantes', e.target.value)}
                  className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Áreas */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Áreas</label>
                <input
                  type="text"
                  value={formData.areas}
                  onChange={(e) => handleChange('areas', e.target.value)}
                  placeholder="Separa las áreas con una coma Ej. Finanzas, Sistemas"
                  className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="mt-1 text-xs text-gray-500">Separa las áreas con una coma Ej. Finanzas, Sistemas</p>
              </div>
            </div>
          </div>
        )}

        {/* Información del curso */}
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Información del curso</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Nombre del curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre del curso o programa <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.nombreCurso}
                onChange={(e) => handleChange('nombreCurso', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {/* Institución */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Institución <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.institucion}
                onChange={(e) => handleChange('institucion', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {/* Fecha inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => handleChange('fechaInicio', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
              <input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => handleChange('fechaFin', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Duración</label>
              <input
                type="text"
                value={formData.duracion}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>

            {/* Tipo de programa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de programa <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tipoPrograma}
                onChange={(e) => handleChange('tipoPrograma', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                {tiposProgramaDisponibles.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {formData.puesto && (
                <p className="mt-1 text-xs text-gray-500">
                  Opciones filtradas según el puesto
                </p>
              )}
            </div>

            {/* Beneficio/Indicador de impacto */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Beneficio/Indicador de impacto</label>
              <textarea
                value={formData.beneficio}
                onChange={(e) => handleChange('beneficio', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Información financiera */}
        <div className="rounded-sm border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Información financiera</h2>

          <div className="grid grid-cols-1 gap-4">
            {/* Tipo de moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de moneda</label>
              <select
                value={formData.tipoMoneda}
                onChange={(e) => handleChange('tipoMoneda', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Costo <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.costo}
                onChange={(e) => handleCurrencyChange('costo', e.target.value)}
                onBlur={() => handleCurrencyBlur('costo')}
                placeholder="0.00"
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            {/* Tipo de I.V.A */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de I.V.A <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tipoIVA}
                onChange={(e) => handleChange('tipoIVA', e.target.value)}
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                required
              >
                <option value="">Seleccione...</option>
                <option value="0%">0% (Exento)</option>
                <option value="8%">8%</option>
                <option value="16%">16%</option>
              </select>
            </div>

            {/* I.V.A */}
            <div>
              <label className="block text-sm font-medium text-gray-700">I.V.A</label>
              <input
                type="text"
                value={formData.iva}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>

            {/* Retención I.V.A */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Retención I.V.A</label>
              <input
                type="text"
                value={formData.retencionIVA}
                onChange={(e) => handleCurrencyChange('retencionIVA', e.target.value)}
                onBlur={() => handleCurrencyBlur('retencionIVA')}
                placeholder="0.00"
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Retención I.S.R */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Retención I.S.R</label>
              <input
                type="text"
                value={formData.retencionISR}
                onChange={(e) => handleCurrencyChange('retencionISR', e.target.value)}
                onBlur={() => handleCurrencyBlur('retencionISR')}
                placeholder="0.00"
                className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.total}
                readOnly
                className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold"
                required
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
