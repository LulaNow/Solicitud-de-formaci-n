"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ═══════════════════════════════════════════════
   3D CITY BACKGROUND - NADRO LOGISTICS
   Buildings, road, traffic, people, lamps, semaphores
   ═══════════════════════════════════════════════ */

type SceneTheme = "night" | "sunny" | "storm" | "snow" | "christmas" | string;

interface City3DProps {
  theme?: SceneTheme;
}

/* ── Color palettes per theme ── */
function getColors(theme: SceneTheme) {
  const base = {
    ambient: 0.15,
    skyTop: "#080e1a",
    ground: "#12121f",
    road: "#1e1e30",
    sidewalk: "#252538",
    lampLight: "#ffe696",
    lampIntensity: 0.6,
    windowColor: "#ffd250",
    windowEmissive: 0.4,
    buildingBase: "#0e1a2d",
    carColors: [0x5a3a3a, 0x3a4a5a, 0x4a4a3a, 0x3a5a4a],
  };
  switch (theme) {
    case "sunny":
      return {
        ...base,
        ambient: 0.7,
        ground: "#4a5060",
        road: "#4a4a62",
        sidewalk: "#5a5a70",
        lampIntensity: 0.1,
        windowEmissive: 0.1,
        buildingBase: "#2a4070",
      };
    case "storm":
      return {
        ...base,
        ambient: 0.1,
        ground: "#0a0a16",
        road: "#141424",
        sidewalk: "#1a1a2a",
        lampIntensity: 0.4,
        windowEmissive: 0.3,
      };
    case "snow":
    case "christmas":
      return {
        ...base,
        ambient: 0.25,
        ground: "#3a3e50",
        road: "#3a3e50",
        sidewalk: "#4a5060",
        lampLight: "#ffeedd",
        lampIntensity: 0.7,
        windowColor: "#ffb83c",
        windowEmissive: 0.5,
      };
    default:
      return base;
  }
}

/* ── Building data ── */
const BUILDINGS = [
  { x: -8.5, z: -1.2, w: 1.2, d: 1.0, h: 3.2, color: 0x0e1a2d },
  { x: -7.0, z: -1.5, w: 1.0, d: 0.9, h: 2.3, color: 0x101e30 },
  { x: -5.5, z: -1.0, w: 0.8, d: 1.1, h: 3.8, color: 0x0c1726 },
  { x: -4.0, z: -1.4, w: 1.4, d: 1.0, h: 2.7, color: 0x101e30 },
  { x: -2.5, z: -1.2, w: 1.0, d: 1.2, h: 4.2, color: 0x0e1a2d },
  { x: -1.0, z: -1.6, w: 1.2, d: 0.8, h: 2.0, color: 0x162c4a },
  { x: 0.5, z: -1.0, w: 1.5, d: 1.3, h: 3.5, color: 0x1b3558 },
  { x: 2.2, z: -1.3, w: 1.0, d: 1.0, h: 2.5, color: 0x0e1a2d },
  { x: 3.5, z: -1.5, w: 0.9, d: 0.9, h: 4.5, color: 0x0c1726 },
  { x: 5.0, z: -1.0, w: 1.3, d: 1.1, h: 3.0, color: 0x101e30 },
  { x: 6.5, z: -1.4, w: 1.1, d: 1.0, h: 2.2, color: 0x1a3d30 },
  { x: 8.0, z: -1.2, w: 1.4, d: 1.2, h: 3.8, color: 0x162c4a },
  { x: 9.5, z: -1.5, w: 1.0, d: 0.8, h: 2.8, color: 0x0e1a2d },
  /* Second row - back */
  { x: -7.5, z: -2.8, w: 1.5, d: 0.8, h: 5.0, color: 0x080e1a },
  { x: -5.0, z: -3.0, w: 1.2, d: 0.7, h: 4.0, color: 0x0a1420 },
  { x: -2.0, z: -2.6, w: 1.8, d: 0.9, h: 5.5, color: 0x080e1a },
  { x: 1.0, z: -3.0, w: 1.4, d: 0.8, h: 6.0, color: 0x0a1420 },
  { x: 3.5, z: -2.8, w: 1.2, d: 0.7, h: 4.5, color: 0x080e1a },
  { x: 6.0, z: -3.0, w: 1.6, d: 0.9, h: 5.2, color: 0x0a1420 },
  { x: 8.5, z: -2.7, w: 1.3, d: 0.8, h: 4.8, color: 0x080e1a },
];

/* ── Single Building with windows ── */
function Building({
  x, z, w, d, h, color, windowEmissive, windowColor,
}: {
  x: number; z: number; w: number; d: number; h: number;
  color: number; windowEmissive: number; windowColor: string;
}) {
  const windowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: windowColor,
        emissive: windowColor,
        emissiveIntensity: windowEmissive,
      }),
    [windowColor, windowEmissive]
  );

  const rows = Math.floor(h / 0.5);
  const cols = Math.max(2, Math.floor(w / 0.35));

  return (
    <group position={[x, h / 2, z]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Windows grid */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const wx = -w / 2 + 0.15 + c * (w - 0.3) / Math.max(1, cols - 1);
          const wy = -h / 2 + 0.4 + r * 0.5;
          const lit = Math.random() > 0.3;
          if (!lit) return null;
          return (
            <mesh
              key={`${r}-${c}`}
              position={[wx, wy, d / 2 + 0.01]}
              material={windowMat}
            >
              <planeGeometry args={[0.12, 0.15]} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ── Street Lamp ── */
function Lamp({ x, color, intensity }: { x: number; color: string; intensity: number }) {
  return (
    <group position={[x, 0, 0.8]}>
      {/* Pole */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      {/* Arm */}
      <mesh position={[0.15, 1.55, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      {/* Light bulb */}
      <mesh position={[0.3, 1.5, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Point light */}
      <pointLight
        position={[0.3, 1.45, 0]}
        color={color}
        intensity={intensity}
        distance={3}
        decay={2}
      />
    </group>
  );
}

/* ── Traffic Light ── */
function TrafficLight({ x }: { x: number }) {
  const ref = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.MeshStandardMaterial>(null);
  const phase = useMemo(() => Math.random() * 10, []);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = (clock.elapsedTime + phase) % 8;
    if (t < 4) {
      lightRef.current.color.set("#00cc00");
      lightRef.current.emissive.set("#00cc00");
    } else if (t < 5.5) {
      lightRef.current.color.set("#cccc00");
      lightRef.current.emissive.set("#cccc00");
    } else {
      lightRef.current.color.set("#cc0000");
      lightRef.current.emissive.set("#cc0000");
    }
  });

  return (
    <group ref={ref} position={[x, 0, 0.6]}>
      {/* Pole */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 2.0, 6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Housing */}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.08]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      {/* Active light */}
      <mesh position={[0, 2.05, 0.05]}>
        <circleGeometry args={[0.04, 8]} />
        <meshStandardMaterial
          ref={lightRef}
          color="#00cc00"
          emissive="#00cc00"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

/* ── Moving Car ── */
function Car({
  color, speed, delay, lane,
}: {
  color: number; speed: number; delay: number; lane: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const dir = lane > 0 ? 1 : -1;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime * speed + delay) % 22) - 11;
    ref.current.position.x = t * dir;
    ref.current.rotation.y = dir > 0 ? 0 : Math.PI;
  });

  return (
    <group ref={ref} position={[0, 0.12, lane]}>
      {/* Body */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.28]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.05, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.12, 0.24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Wheels */}
      {[-0.18, 0.18].map((wx) => (
        <mesh key={wx} position={[wx, -0.02, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[0.32, 0.1, 0.08]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.32, 0.1, -0.08]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/* ── Nadro Truck ── */
function NadroTruck() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime * 0.4 + 5) % 22) - 11;
    ref.current.position.x = t;
  });

  return (
    <group ref={ref} position={[0, 0.15, -0.15]} rotation={[0, Math.PI, 0]}>
      {/* Cargo */}
      <mesh position={[-0.25, 0.22, 0]}>
        <boxGeometry args={[0.9, 0.4, 0.38]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Green inner */}
      <mesh position={[-0.25, 0.22, 0.2]}>
        <planeGeometry args={[0.85, 0.36]} />
        <meshStandardMaterial color="#4d8b31" emissive="#4d8b31" emissiveIntensity={0.1} />
      </mesh>
      {/* NADRO text placeholder - small white box */}
      <mesh position={[-0.25, 0.22, 0.21]}>
        <planeGeometry args={[0.3, 0.08]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.35, 0.18, 0]}>
        <boxGeometry args={[0.35, 0.32, 0.36]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
      {/* Windshield */}
      <mesh position={[0.53, 0.22, 0]}>
        <planeGeometry args={[0.01, 0.18]} />
        <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.2} transparent opacity={0.6} />
      </mesh>
      {/* Wheels */}
      {[-0.5, -0.05, 0.35].map((wx) => (
        <mesh key={wx} position={[wx, -0.02, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
      {/* Headlight */}
      <pointLight position={[0.55, 0.15, 0]} color="#ffee88" intensity={0.3} distance={2} />
    </group>
  );
}

/* ── Walking Person ── */
function Person({ startX, speed, z }: { startX: number; speed: number; z: number }) {
  const ref = useRef<THREE.Group>(null);
  const dir = speed > 0 ? 1 : -1;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime * Math.abs(speed) + startX) % 20) - 10;
    ref.current.position.x = t * dir;
    // Simple walk bob
    ref.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.02;
  });

  return (
    <group ref={ref} position={[0, 0.25, z]}>
      {/* Head */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.06]} />
        <meshStandardMaterial color={dir > 0 ? "#2e7d32" : "#1b3558"} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.02, -0.1, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.04]} />
        <meshStandardMaterial color="#1a1a3a" />
      </mesh>
      <mesh position={[0.02, -0.1, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.04]} />
        <meshStandardMaterial color="#1a1a3a" />
      </mesh>
    </group>
  );
}

/* ── Tree ── */
function Tree3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 6]} />
        <meshStandardMaterial color="#2a1e14" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color="#1a5c1a" />
      </mesh>
    </group>
  );
}

/* ── Road markings ── */
function Road() {
  return (
    <group>
      {/* Main road surface */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 1.2]} />
        <meshStandardMaterial color="#1e1e30" />
      </mesh>
      {/* Sidewalk top */}
      <mesh position={[0, 0.03, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.3]} />
        <meshStandardMaterial color="#252538" />
      </mesh>
      {/* Sidewalk bottom */}
      <mesh position={[0, 0.03, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.3]} />
        <meshStandardMaterial color="#252538" />
      </mesh>
      {/* Center line dashes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} position={[-11 + i * 0.8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 0.03]} />
          <meshStandardMaterial color="#ccaa00" emissive="#ccaa00" emissiveIntensity={0.1} />
        </mesh>
      ))}
      {/* Curb bottom */}
      <mesh position={[0, 0.04, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 1.5]} />
        <meshStandardMaterial color="#12121f" />
      </mesh>
    </group>
  );
}

/* ═══ MAIN SCENE ═══ */
function CityScene({ theme }: { theme: SceneTheme }) {
  const colors = useMemo(() => getColors(theme), [theme]);

  return (
    <>
      <ambientLight intensity={colors.ambient} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={theme === "sunny" ? 0.8 : 0.1}
        color={theme === "sunny" ? "#fff5e0" : "#aabbdd"}
      />

      {/* Buildings */}
      {BUILDINGS.map((b, i) => (
        <Building
          key={i}
          {...b}
          windowEmissive={colors.windowEmissive}
          windowColor={colors.windowColor}
        />
      ))}

      {/* Road */}
      <Road />

      {/* Street Lamps */}
      {[-8, -5, -2, 1, 4, 7].map((x) => (
        <Lamp key={x} x={x} color={colors.lampLight} intensity={colors.lampIntensity} />
      ))}

      {/* Traffic Lights */}
      <TrafficLight x={-3} />
      <TrafficLight x={3} />
      <TrafficLight x={8} />

      {/* Trees */}
      {[-6.5, -3.5, -0.5, 2.5, 5.5, 8.5].map((x) => (
        <Tree3D key={x} x={x} z={0.9} />
      ))}

      {/* Traffic Cars */}
      <Car color={0x5a3a3a} speed={0.8} delay={0} lane={0.25} />
      <Car color={0x3a4a5a} speed={0.6} delay={4} lane={0.25} />
      <Car color={0x4a4a3a} speed={0.9} delay={8} lane={-0.25} />
      <Car color={0x3a5a4a} speed={0.5} delay={12} lane={-0.25} />

      {/* Nadro Truck */}
      <NadroTruck />

      {/* People */}
      <Person startX={0} speed={0.3} z={0.85} />
      <Person startX={5} speed={-0.25} z={0.9} />
      <Person startX={-3} speed={0.35} z={-0.85} />
      <Person startX={7} speed={-0.2} z={-0.9} />
    </>
  );
}

/* ═══ EXPORTED COMPONENT ═══ */
export default function City3D({ theme = "night" }: City3DProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "55%",
        zIndex: 1,
      }}
    >
      <Canvas
        camera={{
          position: [0, 3.5, 6],
          fov: 45,
          near: 0.1,
          far: 50,
        }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={["#080e1a", 8, 20]} />
        <CityScene theme={theme} />
      </Canvas>
    </div>
  );
}
