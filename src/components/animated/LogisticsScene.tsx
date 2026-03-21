"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import "./logistics-scene.css";
import "./holiday-scenes.css";
import { SceneSelectorPopup } from "./SceneSelectorPopup";

type Scene =
  | "night"
  | "storm"
  | "sunny"
  | "snow"
  | "christmas"
  | "halloween"
  | "muertos"
  | "patrias"
  | "valentine"
  | "reyes"
  | "constitucion"
  | "bandera"
  | "juarez"
  | "cincodemayo"
  | "revolucion"
  | "newyear"
  | "laborday"
  | "guadalupe"
  | "holyweek";

const ALL_SCENES: Scene[] = [
  "night",
  "storm",
  "sunny",
  "snow",
  "christmas",
  "halloween",
  "muertos",
  "patrias",
  "valentine",
  "reyes",
  "constitucion",
  "bandera",
  "juarez",
  "cincodemayo",
  "revolucion",
  "newyear",
  "laborday",
  "guadalupe",
  "holyweek",
];
const RANDOM_BASE: Scene[] = ["night", "storm", "sunny"];

interface CalendarEvent {
  key: string;
  scene: Scene;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    key: "event_newyear",
    scene: "newyear",
    startMonth: 1,
    startDay: 1,
    endMonth: 1,
    endDay: 1,
  },
  {
    key: "event_reyes",
    scene: "reyes",
    startMonth: 1,
    startDay: 5,
    endMonth: 1,
    endDay: 6,
  },
  {
    key: "event_constitucion",
    scene: "constitucion",
    startMonth: 2,
    startDay: 4,
    endMonth: 2,
    endDay: 5,
  },
  {
    key: "event_valentine",
    scene: "valentine",
    startMonth: 2,
    startDay: 13,
    endMonth: 2,
    endDay: 14,
  },
  {
    key: "event_bandera",
    scene: "bandera",
    startMonth: 2,
    startDay: 23,
    endMonth: 2,
    endDay: 24,
  },
  {
    key: "event_juarez",
    scene: "juarez",
    startMonth: 3,
    startDay: 20,
    endMonth: 3,
    endDay: 21,
  },
  {
    key: "event_holyweek",
    scene: "holyweek",
    startMonth: 3,
    startDay: 25,
    endMonth: 4,
    endDay: 5,
  },
  {
    key: "event_laborday",
    scene: "laborday",
    startMonth: 5,
    startDay: 1,
    endMonth: 5,
    endDay: 1,
  },
  {
    key: "event_cincodemayo",
    scene: "cincodemayo",
    startMonth: 5,
    startDay: 4,
    endMonth: 5,
    endDay: 5,
  },
  {
    key: "event_patrias",
    scene: "patrias",
    startMonth: 9,
    startDay: 13,
    endMonth: 9,
    endDay: 16,
  },
  {
    key: "event_halloween",
    scene: "halloween",
    startMonth: 10,
    startDay: 25,
    endMonth: 10,
    endDay: 31,
  },
  {
    key: "event_muertos",
    scene: "muertos",
    startMonth: 11,
    startDay: 1,
    endMonth: 11,
    endDay: 2,
  },
  {
    key: "event_revolucion",
    scene: "revolucion",
    startMonth: 11,
    startDay: 19,
    endMonth: 11,
    endDay: 20,
  },
  {
    key: "event_guadalupe",
    scene: "guadalupe",
    startMonth: 12,
    startDay: 11,
    endMonth: 12,
    endDay: 12,
  },
  {
    key: "event_christmas",
    scene: "christmas",
    startMonth: 12,
    startDay: 15,
    endMonth: 12,
    endDay: 25,
  },
];

function getCalendarScene(
  enabledEvents: Record<string, boolean>,
): Scene | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  for (const ev of CALENDAR_EVENTS) {
    if (!enabledEvents[ev.key]) continue;
    const afterStart =
      m > ev.startMonth || (m === ev.startMonth && d >= ev.startDay);
    const beforeEnd = m < ev.endMonth || (m === ev.endMonth && d <= ev.endDay);
    if (afterStart && beforeEnd) return ev.scene;
  }
  return null;
}

async function getAutoWeather(): Promise<Scene> {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 19;

  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }),
    );
    const { latitude, longitude } = pos.coords;
    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
    );
    if (resp.ok) {
      const data = await resp.json();
      const code: number = data.current_weather?.weathercode ?? 0;
      if (code >= 71 && code <= 77) return "snow";
      if (code >= 85 && code <= 86) return "snow";
      if (code >= 95) return "storm";
      if (code >= 51 && code <= 67) return "storm";
      if (code >= 80 && code <= 82) return "storm";
    }
  } catch {
    /* geolocation/fetch failed — fall back to time-based */
  }

  return isDay ? "sunny" : "night";
}

export function LogisticsScene() {
  const [mounted, setMounted] = useState(false);
  const [weather, setWeather] = useState<Scene>("night");
  const [manualOverride, setManualOverride] = useState<Scene | null>(null);
  const { data: config } = trpc.appearance.getSceneConfig.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => setMounted(true), []);

  // Handle manual scene selection from popup
  const handleSceneChange = (scene: Scene) => {
    setManualOverride(scene);
    setWeather(scene);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("manual_scene_override", scene);
    }
  };

  // Check for manual override on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("manual_scene_override");
      if (stored && ALL_SCENES.includes(stored as Scene)) {
        setManualOverride(stored as Scene);
        setWeather(stored as Scene);
      }
    }
  }, []);

  useEffect(() => {
    // If manual override is active, don't auto-change
    if (manualOverride) return;

    if (!config) return;
    const mode = config.sceneMode;

    // 1. Calendar auto-detection (highest priority when enabled)
    if (config.calendarAuto) {
      const calScene = getCalendarScene(config.calendarEvents);
      if (calScene) {
        setWeather(calScene);
        return;
      }
    }

    // 2. Explicit mode selection
    if (mode === "random") {
      setWeather(RANDOM_BASE[Math.floor(Math.random() * RANDOM_BASE.length)]);
    } else if (mode === "auto") {
      getAutoWeather().then(setWeather);
    } else if (ALL_SCENES.includes(mode as Scene)) {
      setWeather(mode as Scene);
    } else {
      setWeather(RANDOM_BASE[Math.floor(Math.random() * RANDOM_BASE.length)]);
    }
  }, [config]);

  if (!mounted) return <div className="absolute inset-0 bg-[#0b1120]" />;

  const showSnowOverlay =
    config?.snowEnabled && weather !== "snow" && weather !== "christmas";

  return (
    <div
      className={`ls-${weather} absolute inset-0 overflow-hidden select-none`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 ls-sky" />

      {/* Night / Christmas: stars + moon */}
      <div className="ls-stars" />
      <div className="ls-moon" />

      {/* Sunny: sun + bright clouds */}
      <div className="ls-sun" />
      <div className="ls-sunny-cloud ls-sunny-cloud--1" />
      <div className="ls-sunny-cloud ls-sunny-cloud--2" />

      {/* Storm: rain + lightning + dark clouds */}
      <div className="ls-rain" />
      <div className="ls-lightning" />
      <div className="ls-storm-cloud ls-storm-cloud--1" />
      <div className="ls-storm-cloud ls-storm-cloud--2" />
      <div className="ls-storm-cloud ls-storm-cloud--3" />

      {/* Snow / Christmas: snowfall */}
      <div className="ls-snowfall" />

      {/* Christmas: lights + tree + star + CSS Santa Sleigh */}
      <div className="ls-xmas-lights" />
      <div className="ls-xmas-tree" />
      <div className="ls-xmas-star" />
      <div className="ls-santa">
        <div className="ls-santa__sleigh" />
        <div className="ls-santa__figure" />
        <div className="ls-santa__bag" />
        <div className="ls-santa__reindeer" />
        <div className="ls-santa__legs" />
        <div className="ls-santa__nose" />
      </div>

      {/* New Year: banner + confetti */}
      <div className="ls-newyear-banner">
        <span className="ls-newyear-banner__greeting">¡Feliz Año Nuevo!</span>
        <span className="ls-newyear-banner__year">{new Date().getFullYear() + 1}</span>
      </div>
      <div className="ls-confetti" />

      {/* Halloween: bats + pumpkin + skulls + spider + fog */}
      <div className="ls-bats" />
      <div className="ls-pumpkin">🎃</div>
      <div className="ls-halloween-skulls" />
      <div className="ls-spider-web" />
      <div className="ls-halloween-fog" />

      {/* Día de Muertos: cempasúchil + papel picado + calavera */}
      <div className="ls-cempasuchil" />
      <div className="ls-papel-picado" />
      <div className="ls-calavera">💀</div>

      {/* Fiestas Patrias: fireworks + tricolor + bell */}
      <div className="ls-fireworks" />
      <div className="ls-tricolor" />
      <div className="ls-patrias-bell" />

      {/* San Valentín: hearts + extras + cupid */}
      <div className="ls-hearts" />
      <div className="ls-valentine-extras" />
      <div className="ls-cupid" />

      {/* Virgen de Guadalupe: rays + candles + roses */}
      <div className="ls-guadalupe-rays" />
      <div className="ls-guadalupe-candles" />
      <div className="ls-roses" />

      {/* Semana Santa: cross + dove */}
      <div className="ls-holyweek-cross" />
      <div className="ls-holyweek-dove" />

      {/* Constitución: scroll */}
      <div className="ls-constitucion-scroll" />

      {/* Bandera: flag */}
      <div className="ls-bandera-flag" />

      {/* Juárez: banner */}
      <div className="ls-juarez-banner" />

      {/* Reyes: camels + gifts */}
      <div className="ls-reyes-camels" />
      <div className="ls-reyes-gifts" />

      {/* Día de Reyes: Star of Bethlehem */}
      <div className="ls-star-belen" />

      {/* Snow overlay (admin toggle — adds snow on any base scene) */}
      {showSnowOverlay && <div className="ls-snowfall" style={{ zIndex: 8 }} />}

      {/* Shared clouds (styled per weather via CSS) */}
      <div className="ls-cloud ls-cloud--1" />
      <div className="ls-cloud ls-cloud--2" />

      <div className="ls-city">
        {/* Far silhouettes */}
        <div
          className="ls-bldg"
          style={{ left: "1%", width: 42, height: 110, background: "#0e1a2d" }}
        />
        <div
          className="ls-bldg"
          style={{ left: "5%", width: 34, height: 80, background: "#101e30" }}
        />
        <div
          className="ls-bldg"
          style={{ left: "9%", width: 28, height: 130, background: "#0c1726" }}
        />
        <div
          className="ls-bldg"
          style={{ left: "14%", width: 50, height: 95, background: "#101e30" }}
        />
        <div
          className="ls-bldg"
          style={{ left: "20%", width: 36, height: 70, background: "#0e1a2d" }}
        />
        <div
          className="ls-bldg"
          style={{ right: "1%", width: 44, height: 100, background: "#0e1a2d" }}
        />
        <div
          className="ls-bldg"
          style={{ right: "6%", width: 30, height: 125, background: "#0c1726" }}
        />
        <div
          className="ls-bldg"
          style={{ right: "10%", width: 48, height: 85, background: "#101e30" }}
        />
        <div
          className="ls-bldg"
          style={{
            right: "16%",
            width: 32,
            height: 145,
            background: "#0e1a2d",
          }}
        />

        {/* Mid buildings */}
        <div
          className="ls-bldg ls-bldg--win-a"
          style={{ left: "24%", width: 52, height: 100, background: "#14253e" }}
        />
        <div
          className="ls-bldg ls-bldg--win-b"
          style={{ left: "30%", width: 38, height: 68, background: "#162a44" }}
        />
        <div
          className="ls-bldg ls-bldg--win-a"
          style={{ left: "53%", width: 40, height: 115, background: "#14253e" }}
        />
        <div
          className="ls-bldg ls-bldg--win-b"
          style={{ left: "59%", width: 46, height: 60, background: "#152842" }}
        />

        {/* HOSPITAL */}
        <div
          className="ls-bldg ls-hospital"
          style={{ right: "22%", width: 90, height: 160 }}
        >
          <div className="ls-wingrid ls-wingrid--warm" />
          <div className="ls-cross ls-cross--red" />
          <div className="ls-label">HOSPITAL</div>
          <div className="ls-rooftop" />
          <div className="ls-door ls-door--hospital" />
        </div>

        {/* PHARMACY */}
        <div
          className="ls-bldg ls-pharmacy"
          style={{ left: "35%", width: 62, height: 90 }}
        >
          <div className="ls-wingrid ls-wingrid--green" />
          <div className="ls-cross ls-cross--green" />
          <div className="ls-label ls-label--green">FARMACIA</div>
          <div className="ls-awning" />
          <div className="ls-door ls-door--pharmacy" />
        </div>

        {/* Road */}
        <div className="ls-sidewalk-top" />
        <div className="ls-road" />
        <div className="ls-road-lines" />
        <div className="ls-sidewalk-bottom" />
        <div className="ls-curb" />

        {/* Street furniture */}
        <div className="ls-lamp" style={{ left: "12%" }} />
        <div className="ls-lamp" style={{ left: "42%" }} />
        <div className="ls-lamp" style={{ left: "72%" }} />
        <div className="ls-lamp" style={{ left: "92%" }} />
        <div className="ls-tree" style={{ left: "7%" }} />
        <div className="ls-tree" style={{ left: "33%" }} />
        <div className="ls-tree" style={{ left: "63%" }} />
        <div className="ls-tree" style={{ left: "85%" }} />

        {/* Traffic cars */}
        <div className="ls-traffic ls-traffic--1" />
        <div className="ls-traffic ls-traffic--2" />
        <div className="ls-traffic ls-traffic--3" />

        {/* NADRO TRUCK */}
        <div className="ls-truck">
          <div className="ls-truck__cargo">
            <div className="ls-truck__cargo-inner">
              <span className="ls-truck__brand">NADRO</span>
            </div>
          </div>
          <div className="ls-truck__cabin">
            <div className="ls-truck__windshield" />
          </div>
          <div className="ls-truck__wheel ls-truck__wheel--rear" />
          <div className="ls-truck__wheel ls-truck__wheel--front" />
          <div className="ls-truck__headlight" />
        </div>

        {/* Delivery person */}
        <div className="ls-person">
          <div className="ls-person__head" />
          <div className="ls-person__body" />
          <div className="ls-person__box" />
        </div>
      </div>

      {/* Scene Selector Popup - Ctrl/Cmd + Shift + B */}
      <SceneSelectorPopup
        currentScene={weather}
        onSceneChange={handleSceneChange}
      />
    </div>
  );
}
