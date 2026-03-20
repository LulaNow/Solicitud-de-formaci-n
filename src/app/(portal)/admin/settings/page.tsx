"use client";

import { trpc } from "@/lib/trpc/client";
import { useState, useEffect } from "react";
import {
  Settings,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  TreePine,
  Shuffle,
  Gauge,
  Save,
  Check,
} from "lucide-react";

const SCENE_MODES = [
  { value: "random", label: "Aleatorio", desc: "Escena aleatoria en cada visita", icon: Shuffle },
  { value: "auto", label: "Automático", desc: "Se adapta al horario y clima real del usuario", icon: Gauge },
  { value: "night", label: "Noche", desc: "Ciudad nocturna con estrellas y luna", icon: Moon },
  { value: "storm", label: "Tormenta", desc: "Lluvia, relámpagos y cielo oscuro", icon: CloudRain },
  { value: "sunny", label: "Día soleado", desc: "Cielo azul, sol brillante y nubes blancas", icon: Sun },
  { value: "snow", label: "Nieve", desc: "Cielo nublado con nevada y techos blancos", icon: Snowflake },
  { value: "christmas", label: "Navidad NADRO", desc: "Noche navideña con luces, árbol, nieve y detalles festivos", icon: TreePine },
] as const;

export default function AdminSettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.appearance.getSettings.useQuery();
  const updateSetting = trpc.appearance.updateSetting.useMutation({
    onSuccess: () => refetch(),
  });

  const [sceneMode, setSceneMode] = useState("random");
  const [christmasEnabled, setChristmasEnabled] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setSceneMode(settings["appearance.scene_mode"] || "random");
    setChristmasEnabled(settings["appearance.christmas_enabled"] === "true");
    setSnowEnabled(settings["appearance.snow_enabled"] === "true");
  }, [settings]);

  async function handleSave() {
    await Promise.all([
      updateSetting.mutateAsync({ key: "appearance.scene_mode", value: sceneMode }),
      updateSetting.mutateAsync({ key: "appearance.christmas_enabled", value: String(christmasEnabled) }),
      updateSetting.mutateAsync({ key: "appearance.snow_enabled", value: String(snowEnabled) }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Portal</h1>
        <p className="text-sm text-gray-500">
          Controla la apariencia del fondo animado en la página de login
        </p>
      </div>

      {/* Scene Mode */}
      <div className="mb-8 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">Modo de Escena</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Selecciona qué fondo animado verán los usuarios en la página de login.
          El modo <strong>Automático</strong> detecta la hora local y el clima real
          del usuario usando Open-Meteo (sin API key).
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {SCENE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = sceneMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setSceneMode(mode.value)}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-border bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    isSelected ? "text-brand-600" : "text-gray-400"
                  }`}
                />
                <div>
                  <div
                    className={`text-sm font-medium ${
                      isSelected ? "text-brand-700" : "text-gray-900"
                    }`}
                  >
                    {mode.label}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlays */}
      <div className="mb-8 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Efectos Especiales</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Estos toggles agregan efectos encima de cualquier escena base.
          Activar <strong>Navidad</strong> fuerza el modo navideño con luces, árbol y nieve.
        </p>

        <div className="space-y-4">
          {/* Christmas toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <TreePine className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Modo Navidad NADRO 🎄
                </div>
                <div className="text-xs text-gray-500">
                  Activa la escena navideña con luces, árbol de navidad, nieve y
                  ventanas cálidas
                </div>
              </div>
            </div>
            <button
              onClick={() => setChristmasEnabled(!christmasEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                christmasEnabled ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  christmasEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Snow toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Snowflake className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Efecto Nieve ❄️
                </div>
                <div className="text-xs text-gray-500">
                  Agrega copos de nieve cayendo sobre cualquier escena (no aplica
                  si ya es Navidad o Nieve)
                </div>
              </div>
            </div>
            <button
              onClick={() => setSnowEnabled(!snowEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                snowEnabled ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  snowEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Auto mode info */}
      {sceneMode === "auto" && (
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-1 text-sm font-medium text-blue-800">
            Modo Automático — Cómo funciona
          </h3>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>
              • <strong>Hora local:</strong> 6am-7pm = día soleado, 7pm-6am = noche
            </li>
            <li>
              • <strong>Clima real:</strong> Usa la API de Open-Meteo (gratuita, sin
              API key) con la geolocalización del navegador
            </li>
            <li>
              • <strong>Códigos meteorológicos:</strong> Lluvia → Tormenta, Nieve →
              Nieve, Tormenta eléctrica → Tormenta
            </li>
            <li>
              • <strong>Fallback:</strong> Si el usuario no permite geolocalización,
              se usa solo la hora
            </li>
          </ul>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateSetting.isPending}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-600 disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Guardado
            </>
          ) : updateSetting.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}
