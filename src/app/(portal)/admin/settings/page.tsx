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
  Calendar,
  Heart,
  Skull,
  Flag,
  Star,
  Ghost,
} from "lucide-react";

const SCENE_MODES = [
  {
    value: "random",
    label: "Aleatorio",
    desc: "Escena aleatoria en cada visita",
    icon: Shuffle,
  },
  {
    value: "auto",
    label: "Automático",
    desc: "Se adapta al horario y clima real del usuario",
    icon: Gauge,
  },
  {
    value: "night",
    label: "Noche",
    desc: "Ciudad nocturna con estrellas y luna",
    icon: Moon,
  },
  {
    value: "storm",
    label: "Tormenta",
    desc: "Lluvia, relámpagos y cielo oscuro",
    icon: CloudRain,
  },
  {
    value: "sunny",
    label: "Día soleado",
    desc: "Cielo azul, sol brillante y nubes blancas",
    icon: Sun,
  },
  {
    value: "snow",
    label: "Nieve",
    desc: "Cielo nublado con nevada y techos blancos",
    icon: Snowflake,
  },
  {
    value: "christmas",
    label: "Navidad NADRO",
    desc: "Luces, árbol, nieve y detalles festivos",
    icon: TreePine,
  },
  {
    value: "halloween",
    label: "Halloween",
    desc: "Cielo naranja/púrpura, murciélagos y calabaza",
    icon: Ghost,
  },
  {
    value: "muertos",
    label: "Día de Muertos",
    desc: "Cempasúchil, papel picado y calaveras",
    icon: Skull,
  },
  {
    value: "patrias",
    label: "Fiestas Patrias",
    desc: "Fuegos artificiales tricolor verde/blanco/rojo",
    icon: Flag,
  },
  {
    value: "valentine",
    label: "San Valentín",
    desc: "Cielo rosa, corazones cayendo",
    icon: Heart,
  },
  {
    value: "reyes",
    label: "Día de Reyes",
    desc: "Noche estrellada con la Estrella de Belén",
    icon: Star,
  },
] as const;

const CALENDAR_EVENTS = [
  {
    key: "event_reyes",
    label: "Día de Reyes",
    emoji: "👑",
    dates: "5-6 Enero",
    icon: Star,
    color: "text-yellow-500",
  },
  {
    key: "event_valentine",
    label: "San Valentín",
    emoji: "💝",
    dates: "13-14 Febrero",
    icon: Heart,
    color: "text-pink-500",
  },
  {
    key: "event_patrias",
    label: "Fiestas Patrias",
    emoji: "🇲🇽",
    dates: "13-16 Septiembre",
    icon: Flag,
    color: "text-green-600",
  },
  {
    key: "event_halloween",
    label: "Halloween",
    emoji: "🎃",
    dates: "25-31 Octubre",
    icon: Ghost,
    color: "text-orange-500",
  },
  {
    key: "event_muertos",
    label: "Día de Muertos",
    emoji: "💀",
    dates: "1-2 Noviembre",
    icon: Skull,
    color: "text-purple-500",
  },
  {
    key: "event_christmas",
    label: "Navidad NADRO",
    emoji: "🎄",
    dates: "15-25 Diciembre",
    icon: TreePine,
    color: "text-green-600",
  },
];

function Toggle({
  enabled,
  onChange,
  activeColor = "bg-brand-500",
}: {
  enabled: boolean;
  onChange: () => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? activeColor : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const {
    data: settings,
    isLoading,
    refetch,
  } = trpc.appearance.getSettings.useQuery();
  const updateSetting = trpc.appearance.updateSetting.useMutation({
    onSuccess: () => refetch(),
  });

  const [sceneMode, setSceneMode] = useState("random");
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [calendarAuto, setCalendarAuto] = useState(false);
  const [events, setEvents] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setSceneMode(settings["appearance.scene_mode"] || "random");
    setSnowEnabled(settings["appearance.snow_enabled"] === "true");
    setCalendarAuto(settings["appearance.calendar_auto"] === "true");
    const ev: Record<string, boolean> = {};
    for (const ce of CALENDAR_EVENTS) {
      ev[ce.key] = settings[`appearance.${ce.key}`] === "true";
    }
    setEvents(ev);
  }, [settings]);

  function toggleEvent(key: string) {
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    const mutations = [
      updateSetting.mutateAsync({
        key: "appearance.scene_mode",
        value: sceneMode,
      }),
      updateSetting.mutateAsync({
        key: "appearance.snow_enabled",
        value: String(snowEnabled),
      }),
      updateSetting.mutateAsync({
        key: "appearance.calendar_auto",
        value: String(calendarAuto),
      }),
    ];
    for (const ce of CALENDAR_EVENTS) {
      mutations.push(
        updateSetting.mutateAsync({
          key: `appearance.${ce.key}`,
          value: String(events[ce.key] ?? false),
        }),
      );
    }
    await Promise.all(mutations);
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
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Configuración del Portal
        </h1>
        <p className="text-sm text-gray-500">
          Controla la apariencia del fondo animado en la página de login
        </p>
      </div>

      {/* Scene Mode */}
      <div className="mb-8 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Modo de Escena
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Selecciona qué fondo animado verán los usuarios en la página de login.
          El modo <strong>Automático</strong> detecta la hora local y el clima
          real del usuario usando Open-Meteo (sin API key).
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCENE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = sceneMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => setSceneMode(mode.value)}
                className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-border bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
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
                  <div className="mt-0.5 text-xs text-gray-500">
                    {mode.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Events */}
      <div className="mb-8 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Calendario Mexicano
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Activa eventos del calendario para que el fondo cambie automáticamente
          en las fechas indicadas. El calendario tiene{" "}
          <strong>prioridad</strong> sobre el modo de escena cuando está
          habilitado.
        </p>

        {/* Calendar auto toggle */}
        <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-dashed border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Modo Calendario Automático
              </div>
              <div className="text-xs text-gray-500">
                Cambia el fondo automáticamente según las fechas del calendario
                mexicano
              </div>
            </div>
          </div>
          <Toggle
            enabled={calendarAuto}
            onChange={() => setCalendarAuto(!calendarAuto)}
            activeColor="bg-orange-500"
          />
        </div>

        {/* Per-event toggles */}
        <div className="space-y-3">
          {CALENDAR_EVENTS.map((ev) => {
            const Icon = ev.icon;
            return (
              <div
                key={ev.key}
                className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                  calendarAuto ? "border-border" : "border-border opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${ev.color}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {ev.emoji} {ev.label}
                    </div>
                    <div className="text-xs text-gray-400">{ev.dates}</div>
                  </div>
                </div>
                <Toggle
                  enabled={events[ev.key] ?? false}
                  onChange={() => toggleEvent(ev.key)}
                  activeColor="bg-orange-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlays */}
      <div className="mb-8 rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Efectos Especiales
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Efecto de nieve que se superpone sobre cualquier escena base.
        </p>
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
          <Toggle
            enabled={snowEnabled}
            onChange={() => setSnowEnabled(!snowEnabled)}
            activeColor="bg-blue-500"
          />
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
              • <strong>Hora local:</strong> 6am-7pm = día soleado, 7pm-6am =
              noche
            </li>
            <li>
              • <strong>Clima real:</strong> API de Open-Meteo (gratuita, sin
              API key) + geolocalización
            </li>
            <li>
              • <strong>Códigos meteorológicos:</strong> Lluvia → Tormenta,
              Nieve → Nieve
            </li>
            <li>
              • <strong>Fallback:</strong> Si el usuario no permite
              geolocalización, se usa solo la hora
            </li>
          </ul>
        </div>
      )}

      {/* Calendar info */}
      {calendarAuto && (
        <div className="mb-8 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-1 text-sm font-medium text-orange-800">
            Calendario Automático — Prioridad
          </h3>
          <ul className="space-y-1 text-xs text-orange-700">
            <li>
              • El calendario tiene <strong>prioridad</strong> sobre el modo de
              escena seleccionado
            </li>
            <li>
              • Si hoy es una fecha de evento habilitado, se mostrará esa escena
            </li>
            <li>
              • Si no hay evento activo, se usa el modo de escena normal
              (Aleatorio, Auto, etc.)
            </li>
            <li>• Puedes activar/desactivar cada evento individualmente</li>
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
