"use client";

import { trpc } from "@/lib/trpc/client";
import { FileDown, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useMemo } from "react";

type SortField = keyof NonNullable<ReturnType<typeof trpc.requests.reporteSolicitudes.useQuery>['data']>[number] | null;
type SortDirection = 'asc' | 'desc' | null;

export default function ReporteSolicitudesFormacionPage() {
  const { data: reporte, isLoading } = trpc.requests.reporteSolicitudes.useQuery();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cambiar dirección: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedReporte = useMemo(() => {
    if (!reporte || !sortField || !sortDirection) return reporte;

    return [...reporte].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Manejar valores nulos o vacíos
      if (!aValue && !bValue) return 0;
      if (!aValue) return sortDirection === 'asc' ? 1 : -1;
      if (!bValue) return sortDirection === 'asc' ? -1 : 1;

      // Comparar valores
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Comparación numérica
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      return 0;
    });
  }, [reporte, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-brand-600" />
      : <ArrowDown className="ml-1 h-3 w-3 text-brand-600" />;
  };

  const exportarExcel = () => {
    if (!reporte || reporte.length === 0) return;

    const headers = [
      "Solicitud",
      "Convocatoria",
      "CDR",
      "Evento",
      "Modalidad",
      "Tipo",
      "Empleado",
      "Nombre",
      "Fecha ingreso",
      "Puesto",
      "Antigüedad en el puesto",
      "CECO",
      "Principales funciones",
      "Total de participantes",
      "Áreas",
      "Nombre del curso o programa",
      "Institución",
      "Duración",
      "Tipo de programa",
      "Fecha inicio",
      "Fecha fin",
      "Beneficio/Indicador de impacto",
      "Tipo de moneda",
      "Costo",
      "Tipo de IVA",
      "IVA",
      "Retención IVA",
      "Retención ISR",
      "Total",
      "Porcentaje asignado",
      "Monto beca",
      "Autorizador",
      "Estatus",
      "Fecha de creación",
    ];

    const rows = reporte.map(r => [
      r.numeroTicket,
      r.convocatoria,
      r.cdr,
      r.evento,
      r.modalidad,
      r.tipo,
      r.noEmpleado,
      r.nombre,
      r.fechaIngreso,
      r.puesto,
      r.antiguedad,
      r.ceco,
      r.funciones,
      r.participantes,
      r.areas,
      r.nombreCurso,
      r.institucion,
      r.duracion,
      r.tipoPrograma,
      r.fechaInicio,
      r.fechaFin,
      r.beneficio,
      r.tipoMoneda,
      r.costo,
      r.tipoIva,
      r.iva,
      r.retencionIva,
      r.retencionIsr,
      r.total,
      r.porcentajeAsignado,
      r.montoBeca,
      r.autorizador,
      r.estado,
      format(new Date(r.createdAt), "dd/MM/yyyy HH:mm", { locale: es }),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_solicitudes_formacion_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte Solicitud de Formación</h1>
          <p className="mt-1 text-sm text-gray-500">
            Listado completo de solicitudes con todos los detalles
          </p>
        </div>
        <button
          onClick={exportarExcel}
          disabled={!reporte || reporte.length === 0}
          className="flex items-center gap-2 rounded-sm bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          Exportar a Excel
        </button>
      </div>

      <div className="rounded-sm border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('numeroTicket')}
                  className="sticky left-0 z-10 cursor-pointer bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Solicitud
                    <SortIcon field="numeroTicket" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('convocatoria')}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Convocatoria
                    <SortIcon field="convocatoria" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cdr')}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    CDR
                    <SortIcon field="cdr" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('evento')}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Evento
                    <SortIcon field="evento" />
                  </div>
                </th>
                <th onClick={() => handleSort('modalidad')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Modalidad<SortIcon field="modalidad" /></div>
                </th>
                <th onClick={() => handleSort('tipo')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Tipo<SortIcon field="tipo" /></div>
                </th>
                <th onClick={() => handleSort('noEmpleado')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Empleado<SortIcon field="noEmpleado" /></div>
                </th>
                <th onClick={() => handleSort('nombre')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Nombre<SortIcon field="nombre" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha Ingreso
                </th>
                <th onClick={() => handleSort('puesto')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Puesto<SortIcon field="puesto" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Antigüedad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  CECO
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Funciones
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Participantes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Áreas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre Curso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Institución
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Duración
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo Programa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha Inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha Fin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Beneficio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo Moneda
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Costo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo IVA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  IVA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ret. IVA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ret. ISR
                </th>
                <th onClick={() => handleSort('total')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Total<SortIcon field="total" /></div>
                </th>
                <th onClick={() => handleSort('porcentajeAsignado')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">% Asignado<SortIcon field="porcentajeAsignado" /></div>
                </th>
                <th onClick={() => handleSort('montoBeca')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Monto Beca<SortIcon field="montoBeca" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Autorizador
                </th>
                <th onClick={() => handleSort('estado')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Estatus<SortIcon field="estado" /></div>
                </th>
                <th onClick={() => handleSort('createdAt')} className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100">
                  <div className="flex items-center">Fecha Creación<SortIcon field="createdAt" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedReporte && sortedReporte.length > 0 ? (
                sortedReporte.map((solicitud, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {solicitud.numeroTicket}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.convocatoria}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.cdr}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.evento}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.modalidad}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.tipo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.noEmpleado}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.nombre}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.fechaIngreso}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.puesto}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.antiguedad}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.ceco}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700" title={solicitud.funciones}>
                      {solicitud.funciones}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.participantes}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.areas}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700" title={solicitud.nombreCurso}>
                      {solicitud.nombreCurso}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.institucion}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.duracion}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.tipoPrograma}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.fechaInicio}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.fechaFin}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700" title={solicitud.beneficio}>
                      {solicitud.beneficio}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.tipoMoneda}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.costo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.tipoIva}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.iva}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.retencionIva}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.retencionIsr}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{solicitud.total}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.porcentajeAsignado}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-green-700">{solicitud.montoBeca}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{solicitud.autorizador}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        solicitud.estado === 'abierto' ? 'bg-blue-100 text-blue-800' :
                        solicitud.estado === 'cerrado' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {solicitud.estado}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {format(new Date(solicitud.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={34} className="py-12 text-center text-sm text-gray-500">
                    No hay solicitudes para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sortedReporte && sortedReporte.length > 0 && (
        <div className="text-sm text-gray-500">
          Total de registros: <span className="font-semibold">{sortedReporte.length}</span>
          {sortField && sortDirection && (
            <span className="ml-4 text-xs text-gray-400">
              Ordenado por: <span className="font-medium">{String(sortField)}</span> ({sortDirection === 'asc' ? 'Ascendente' : 'Descendente'})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
