"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function ServicePortalAdminPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: config, isLoading, refetch } = trpc.servicePortal.getPortalConfig.useQuery();
  const updateConfig = trpc.servicePortal.updatePortalConfig.useMutation();

  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    config?.maintenanceMessage ?? ""
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateConfig.mutateAsync({
        enabled,
        maintenanceMessage,
      });

      setSaveSuccess(true);
      refetch();

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración del Portal de Servicios
          </h1>
          <p className="text-gray-600">
            Controla la disponibilidad y configuración del portal público
          </p>
        </div>

        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span>Configuración guardada correctamente</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Enable/Disable Portal */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Estado del Portal
                </h2>
                <p className="text-sm text-gray-600">
                  Habilita o deshabilita el acceso público al portal de servicios
                </p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
                  enabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${
                    enabled ? "translate-x-12" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${
                enabled
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{enabled ? "✅" : "🚫"}</span>
                <div>
                  <p className="font-semibold text-gray-900">
                    {enabled ? "Portal Habilitado" : "Portal Deshabilitado"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {enabled
                      ? "Los usuarios pueden acceder al portal en /portal"
                      : "Los usuarios verán un mensaje de mantenimiento"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-semibold text-gray-900">
                Mensaje de Mantenimiento
              </span>
              <span className="text-sm text-gray-500 ml-2">
                (Opcional - se muestra cuando el portal está deshabilitado)
              </span>
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="El portal de servicios está temporalmente deshabilitado. Por favor, intenta más tarde o contacta al administrador."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Este mensaje se mostrará a los usuarios cuando intenten acceder al portal
              mientras está deshabilitado.
            </p>
          </div>

          {/* Portal URL */}
          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-2">URL del Portal Público</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-4 py-2 rounded border border-indigo-300 font-mono text-sm">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/portal`
                  : "/portal"}
              </code>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(`${window.location.origin}/portal`);
                  }
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
              >
                📋 Copiar
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Items Publicados</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-3xl mb-2">📁</div>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Categorías Activas</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Solicitudes Totales</div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={() => {
                setEnabled(config?.enabled ?? true);
                setMaintenanceMessage(config?.maintenanceMessage ?? "");
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <a
            href="/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">🌐</div>
              <div>
                <h3 className="font-bold text-gray-900">Ver Portal Público</h3>
                <p className="text-sm text-gray-600">Abre el portal en una nueva pestaña</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/service-portal/catalog"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📦</div>
              <div>
                <h3 className="font-bold text-gray-900">Gestionar Catálogo</h3>
                <p className="text-sm text-gray-600">Administra items y categorías</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
