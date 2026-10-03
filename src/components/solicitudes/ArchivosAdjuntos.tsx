"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Trash2, Loader2, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Archivo {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  hash: string;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ArchivosAdjuntos({ solicitudId }: { solicitudId: string }) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarArchivos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/solicitudes/archivos?solicitudId=${solicitudId}`);
      const data = await res.json();
      if (data.success) {
        setArchivos(data.archivos);
      }
    } catch (e) {
      console.error("Error al cargar archivos:", e);
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    cargarArchivos();
  }, [cargarArchivos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("solicitudId", solicitudId);

      const res = await fetch("/api/solicitudes/archivos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al subir archivo");
      } else {
        await cargarArchivos();
      }
    } catch (err) {
      setError("Error al subir el archivo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (archivoId: string) => {
    if (!confirm("¿Eliminar este archivo?")) return;

    try {
      await fetch("/api/solicitudes/archivos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivoId }),
      });
      await cargarArchivos();
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Paperclip className="h-5 w-5 text-gray-500" />
          Archivos Adjuntos
        </h3>
        <label className="flex cursor-pointer items-center gap-2 rounded-sm bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Subiendo..." : "Adjuntar archivo"}
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : archivos.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">
          No hay archivos adjuntos
        </div>
      ) : (
        <div className="space-y-2">
          {archivos.map((archivo) => (
            <div
              key={archivo.id}
              className="flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{archivo.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {formatSize(archivo.sizeBytes)} •{" "}
                    {format(new Date(archivo.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/solicitudes/archivos?archivoId=${archivo.id}&download=true`}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(archivo.id)}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
