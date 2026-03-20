"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import "./logistics-scene.css";

type Weather = "night" | "storm" | "sunny" | "snow" | "christmas";
const RANDOM_BASE: Weather[] = ["night", "storm", "sunny"];

async function getAutoWeather(): Promise<Weather> {
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
  const [weather, setWeather] = useState<Weather>("night");
  const { data: config } = trpc.appearance.getSceneConfig.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!config) return;
    const mode = config.sceneMode;

    if (mode === "random") {
      setWeather(RANDOM_BASE[Math.floor(Math.random() * RANDOM_BASE.length)]);
    } else if (mode === "auto") {
      getAutoWeather().then(setWeather);
    } else if (
      ["night", "storm", "sunny", "snow", "christmas"].includes(mode)
    ) {
      setWeather(mode as Weather);
    } else {
      setWeather(RANDOM_BASE[Math.floor(Math.random() * RANDOM_BASE.length)]);
    }

    if (config.christmasEnabled && mode !== "christmas") {
      setWeather("christmas");
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

      {/* Christmas: lights + tree + star */}
      <div className="ls-xmas-lights" />
      <div className="ls-xmas-tree" />
      <div className="ls-xmas-star" />

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
    </div>
  );
}
