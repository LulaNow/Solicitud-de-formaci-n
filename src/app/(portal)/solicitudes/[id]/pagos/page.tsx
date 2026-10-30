"use client";

import { trpc } from "@/lib/trpc/client";
import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Paperclip,
  Download,
  X,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface PagoRow {
  tempId: string;
  id?: string;
  numeroPago: number;
  fechaProgramada: string;
  programa: string;
  pagoBeca: string;
  pagoEmpleado: string;
  estatusPago: string;
  pagare: string;
  factura: string;
  montoFactura: string;
  observaciones: string;
  calificaciones: string;
  fileName: string | null;
  archivoNuevo: File | null;
}

const nuevaFila = (numeroPago: number): PagoRow => ({
  tempId: `tmp-${Date.now()}-${numeroPago}`,
  numeroPago,
  fechaProgramada: "",
  programa: "",
  pagoBeca: "",
  pagoEmpleado: "",
  estatusPago: "",
  pagare: "",
  factura: "",
  montoFactura: "",
  observaciones: "",
  calificaciones: "",
  fileName: null,
  archivoNuevo: null,
});

const parseNumero = (valor: string): number | null => {
  const limpio = valor.replace(/[$,]/g, "").trim();
  if (!limpio) return null;
  const n = parseFloat(limpio);
  return isNaN(n) ? null : n;
};

// Trunca a 2 decimales (sin redondear) y formatea como moneda MXN: $1,234.56
const formatMoneyInput = (valor: string): string => {
  const limpio = valor.replace(/[$,\s]/g, "").trim();
  if (!limpio) return "";
  const n = parseFloat(limpio);
  if (isNaN(n)) return valor;
  const truncado = Math.trunc(n * 100) / 100;
  return `$${truncado.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatMoneda = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === "") return "-";
  const n = parseFloat(String(valor).replace(/[$,]/g, ""));
  if (isNaN(n)) return String(valor);
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function TablaPagosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = trpc.requests.getPagosData.useQuery(id);
  const savePagosMutation = trpc.requests.savePagos.useMutation();

  const [filas, setFilas] = useState<PagoRow[]>([]);
  const [reembolsoNadro, setReembolsoNadro] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Cargar pagos existentes en la tabla editable
  useEffect(() => {
    if (data?.pagos) {
      setFilas(
        data.pagos.map((p) => ({
          tempId: p.id,
          id: p.id,
          numeroPago: p.numeroPago,
          fechaProgramada: p.fechaProgramada ? new Date(p.fechaProgramada).toISOString().slice(0, 10) : "",
          programa: p.programa !== null ? formatMoneyInput(String(p.programa)) : "",
          pagoBeca: p.pagoBeca !== null ? formatMoneyInput(String(p.pagoBeca)) : "",
          pagoEmpleado: p.pagoEmpleado !== null ? formatMoneyInput(String(p.pagoEmpleado)) : "",
          estatusPago: p.estatusPago || "",
          pagare: p.pagare || "",
          factura: p.factura || "",
          montoFactura: p.montoFactura !== null ? formatMoneyInput(String(p.montoFactura)) : "",
          observaciones: p.observaciones || "",
          calificaciones: p.calificaciones || "",
          fileName: p.fileName,
          archivoNuevo: null,
        }))
      );
    }
  }, [data?.pagos]);

  // Cargar el reembolso Nadro guardado en la solicitud
  useEffect(() => {
    const r = data?.solicitud?.reembolsoNadro;
    if (r !== null && r !== undefined) {
      setReembolsoNadro(formatMoneyInput(String(r)));
    }
  }, [data?.solicitud]);

  // Totales calculados en vivo a partir de las filas de la tabla
  const totalesTabla = useMemo(() => {
    const sumar = (campo: "programa" | "pagoBeca") =>
      filas.reduce((acc, f) => acc + (parseNumero(f[campo]) ?? 0), 0);
    const programa = sumar("programa");
    const realizado = sumar("pagoBeca");
    const programado = programa - realizado;
    const reembolso = parseNumero(reembolsoNadro) ?? 0;
    const totalPagos = realizado + programado - reembolso;
    const porcentaje = programa > 0 ? Math.round((totalPagos / programa) * 100) : 0;
    return { programa, realizado, programado, totalPagos, porcentaje };
  }, [filas, reembolsoNadro]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Cargando tabla de pagos...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-sm border border-border bg-white p-8 text-center">
        <p className="text-gray-500">
          {error?.message || "No se pudo cargar la información de pagos"}
        </p>
        <Link href="/solicitudes" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Volver a solicitudes
        </Link>
      </div>
    );
  }

  const { solicitud, parametro } = data;
  const datosEntrada = (solicitud.datosEntrada as Record<string, any>) || {};
  const esCompletado = solicitud.estado === "Completado";

  const actualizarFila = (tempId: string, campo: keyof PagoRow, valor: string) => {
    setFilas((prev) =>
      prev.map((f) => (f.tempId === tempId ? { ...f, [campo]: valor } : f))
    );
  };

  const agregarFila = () => {
    const siguiente = filas.reduce((max, f) => Math.max(max, f.numeroPago), 0);
    setFilas((prev) => [...prev, nuevaFila(siguiente + 1)]);
  };

  const eliminarFila = (tempId: string) => {
    setFilas((prev) => prev.filter((f) => f.tempId !== tempId));
  };

  const seleccionarArchivo = (tempId: string, file: File | null) => {
    setFilas((prev) =>
      prev.map((f) => (f.tempId === tempId ? { ...f, archivoNuevo: file } : f))
    );
  };

  const eliminarDocumento = async (fila: PagoRow) => {
    if (!fila.id) return;
    try {
      const res = await fetch("/api/solicitudes/pagos/documento", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagoId: fila.id }),
      });
      if (res.ok) {
        setFilas((prev) =>
          prev.map((f) => (f.tempId === fila.tempId ? { ...f, fileName: null } : f))
        );
      }
    } catch (e) {
      console.error("Error al eliminar documento:", e);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      // 1. Guardar datos de las filas
      const payload = filas.map((f) => ({
        id: f.id,
        tempId: f.tempId,
        numeroPago: f.numeroPago,
        fechaProgramada: f.fechaProgramada || undefined,
        programa: parseNumero(f.programa),
        pagoBeca: parseNumero(f.pagoBeca),
        pagoEmpleado: parseNumero(f.pagoEmpleado),
        estatusPago: f.estatusPago || undefined,
        pagare: f.pagare || undefined,
        factura: f.factura || undefined,
        montoFactura: parseNumero(f.montoFactura),
        observaciones: f.observaciones || undefined,
        calificaciones: f.calificaciones || undefined,
      }));

      const resultado = await savePagosMutation.mutateAsync({
        solicitudId: id,
        reembolsoNadro: parseNumero(reembolsoNadro),
        pagos: payload,
      });

      // 2. Subir documentos pendientes (requiere el id real del pago)
      for (const fila of filas) {
        if (fila.archivoNuevo) {
          const pagoId = fila.id || resultado.mapaIds[fila.tempId];
          if (!pagoId) continue;
          const formData = new FormData();
          formData.append("file", fila.archivoNuevo);
          formData.append("pagoId", pagoId);
          const res = await fetch("/api/solicitudes/pagos/documento", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || `Error al subir ${fila.archivoNuevo.name}`);
          }
        }
      }

      setMensaje({ tipo: "ok", texto: "Pagos guardados correctamente" });
      await refetch();
    } catch (e) {
      console.error("Error al guardar pagos:", e);
      setMensaje({
        tipo: "error",
        texto: e instanceof Error ? e.message : "Error al guardar los pagos",
      });
    } finally {
      setGuardando(false);
    }
  };

  const inputClass =
    "w-full rounded-sm border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link
          href={`/solicitudes/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-white transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabla de Pagos</h1>
          <p className="text-sm text-gray-500">{solicitud.numeroTicket}</p>
        </div>
      </div>

      {/* Apartado 1: Resumen de la solicitud */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumen de la Solicitud</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna 1: datos del evento */}
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Convocatoria</td>
                <td className="py-2 align-top text-sm text-gray-900">{solicitud.convocatoria || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">CDR</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.cdr_descripcion || datosEntrada.cdr || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Evento</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.evento || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Modalidad</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.modalidad || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Tipo</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.tipo || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">CECO</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.ceco || "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* Columna 2: datos del empleado */}
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Empleado</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.no_empleado || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Nombre</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.nombre_empleado || datosEntrada.nombre || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Fecha de ingreso</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.fecha_ingreso || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Puesto</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.puesto || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Antigüedad en el puesto</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.antiguedad || "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* Columna 3: datos del curso */}
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Nombre del curso o programa</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.nombre_curso || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Institución</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.institucion || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Duración</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.duracion || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Tipo de programa</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.tipo_programa || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Fecha inicio</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.fecha_inicio || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Fecha fin</td>
                <td className="py-2 align-top text-sm text-gray-900">{datosEntrada.fecha_fin || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Apartado 2: Resumen financiero */}
      <div className="rounded-sm border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumen Financiero</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bloque 1: datos financieros de la solicitud */}
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Tipo de moneda</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{datosEntrada.tipo_moneda || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Costo</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{formatMoneda(datosEntrada.costo)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Tipo de IVA</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{datosEntrada.tipo_iva || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">IVA</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{datosEntrada.iva || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">IEPS</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{datosEntrada.ieps || "No aplica"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Retención IVA</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{datosEntrada.retencion_iva || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Retención ISR</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{datosEntrada.retencion_isr || "-"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Total</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{formatMoneda(datosEntrada.total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Bloque 2: beca autorizada */}
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Monto Solicitud</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{formatMoneda(datosEntrada.total)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Beca autorizada en $</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">
                  {parametro ? formatMoneda(parametro.montoBeca) : "-"}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Porcentaje asignado</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">
                  {parametro ? `${parametro.porcentajeAsignado}%` : "-"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bloque 3: totales calculados de la tabla de pagos */}
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Programa</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{formatMoneda(totalesTabla.programa)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Pago beca realizado</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{formatMoneda(totalesTabla.realizado)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Pago beca programado</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{formatMoneda(totalesTabla.programado)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Total pagos beca</td>
                <td className="py-2 align-top text-right text-sm font-semibold text-gray-900">{formatMoneda(totalesTabla.totalPagos)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Reembolso Nadro</td>
                <td className="py-1 align-top text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={reembolsoNadro}
                    disabled={!esCompletado}
                    onChange={(e) => setReembolsoNadro(e.target.value)}
                    onBlur={(e) => setReembolsoNadro(formatMoneyInput(e.target.value))}
                    placeholder="$0.00"
                    className="w-32 rounded-sm border border-border px-2 py-1 text-right text-sm disabled:bg-gray-100"
                  />
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-2 align-top text-xs font-medium text-gray-500">Porcentaje Tabla</td>
                <td className="py-2 align-top text-right text-sm text-gray-900">{totalesTabla.porcentaje}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Apartado 3: Tabla de pagos */}
      <div className="rounded-sm border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pagos</h2>
          {esCompletado && (
            <button
              onClick={agregarFila}
              className="flex items-center gap-2 rounded-sm bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Agregar pago
            </button>
          )}
        </div>

        {!esCompletado && (
          <div className="mb-4 rounded-sm bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              La tabla de pagos solo está disponible para solicitudes en estado <strong>Completado</strong>.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No. pago</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha programada</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Programa</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pago beca</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pago empleado</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estatus pago</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pagaré</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Factura</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Monto factura</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Observaciones</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Calificaciones</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Documento</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay pagos registrados. Usa &quot;Agregar pago&quot; para comenzar.
                  </td>
                </tr>
              ) : (
                filas.map((fila) => (
                  <tr key={fila.tempId}>
                    <td className="px-3 py-2" style={{ minWidth: 70 }}>
                      <span className="block px-2 py-1.5 text-sm text-gray-900">
                        {fila.numeroPago}
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 140 }}>
                      <input
                        type="date"
                        value={fila.fechaProgramada}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "fechaProgramada", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 130 }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fila.programa}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "programa", e.target.value)}
                        onBlur={(e) => actualizarFila(fila.tempId, "programa", formatMoneyInput(e.target.value))}
                        placeholder="$0.00"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 130 }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fila.pagoBeca}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "pagoBeca", e.target.value)}
                        onBlur={(e) => actualizarFila(fila.tempId, "pagoBeca", formatMoneyInput(e.target.value))}
                        placeholder="$0.00"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 130 }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fila.pagoEmpleado}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "pagoEmpleado", e.target.value)}
                        onBlur={(e) => actualizarFila(fila.tempId, "pagoEmpleado", formatMoneyInput(e.target.value))}
                        placeholder="$0.00"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 120 }}>
                      <input
                        type="text"
                        value={fila.estatusPago}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "estatusPago", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 110 }}>
                      <input
                        type="text"
                        value={fila.pagare}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "pagare", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 110 }}>
                      <input
                        type="text"
                        value={fila.factura}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "factura", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 130 }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fila.montoFactura}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "montoFactura", e.target.value)}
                        onBlur={(e) => actualizarFila(fila.tempId, "montoFactura", formatMoneyInput(e.target.value))}
                        placeholder="$0.00"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 160 }}>
                      <input
                        type="text"
                        value={fila.observaciones}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "observaciones", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 160 }}>
                      <input
                        type="text"
                        value={fila.calificaciones}
                        disabled={!esCompletado}
                        onChange={(e) => actualizarFila(fila.tempId, "calificaciones", e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: 170 }}>
                      {/* Documento existente en BD */}
                      {fila.fileName && !fila.archivoNuevo && fila.id ? (
                        <div className="flex items-center gap-1">
                          <a
                            href={`/api/solicitudes/pagos/documento?pagoId=${fila.id}&download=true`}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                            title={fila.fileName}
                          >
                            <Download className="h-3.5 w-3.5 shrink-0" />
                            <span className="max-w-[110px] truncate">{fila.fileName}</span>
                          </a>
                          {esCompletado && (
                            <button
                              onClick={() => eliminarDocumento(fila)}
                              className="text-gray-400 hover:text-red-600"
                              title="Eliminar documento"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            ref={(el) => {
                              fileInputsRef.current[fila.tempId] = el;
                            }}
                            className="hidden"
                            disabled={!esCompletado}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              e.target.value = "";
                              if (file) seleccionarArchivo(fila.tempId, file);
                            }}
                          />
                          {fila.archivoNuevo ? (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3.5 w-3.5 shrink-0 text-green-600" />
                              <span className="max-w-[110px] truncate text-xs text-gray-700" title={fila.archivoNuevo.name}>
                                {fila.archivoNuevo.name}
                              </span>
                              {esCompletado && (
                                <button
                                  onClick={() => seleccionarArchivo(fila.tempId, null)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => fileInputsRef.current[fila.tempId]?.click()}
                              disabled={!esCompletado}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              Adjuntar
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {esCompletado && (
                        <button
                          onClick={() => eliminarFila(fila.tempId)}
                          className="text-gray-400 transition-colors hover:text-red-600"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Botón guardar + mensajes */}
        {esCompletado && (
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-2 rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <CreditCard className="h-4 w-4 animate-pulse" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar pagos
                </>
              )}
            </button>
            {mensaje && (
              <p className={`text-sm ${mensaje.tipo === "ok" ? "text-green-600" : "text-red-600"}`}>
                {mensaje.texto}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
