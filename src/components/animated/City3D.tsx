"use client";

import { useRef, useMemo, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SceneTheme = "night" | "sunny" | "storm" | "snow" | "christmas" | string;
interface City3DProps { theme?: SceneTheme; }

function seeded(s: number) { let v = s; return () => { v = (v * 16807) % 2147483647; return v / 2147483647; }; }

function getColors(theme: SceneTheme) {
  const b = { ambient: 0.15, dirI: 0.08, dirC: "#aabbdd", fog: "#0a1020", ground: "#0c1222", road: "#161c2a", sidewalk: "#1c2232", winE: 0.6, cars: [0x8b2020,0x204060,0x405020,0x604020,0x303060] };
  if (theme === "sunny") return { ...b, ambient: 0.9, dirI: 1.0, dirC: "#fff8e0", fog: "#6eabd4", ground: "#4a5565", road: "#555d6e", sidewalk: "#606878", winE: 0.02 };
  if (theme === "storm") return { ...b, ambient: 0.06, dirI: 0.02, fog: "#030810", ground: "#050a14", winE: 0.5 };
  if (theme === "snow" || theme === "christmas") return { ...b, ambient: 0.22, dirI: 0.18, fog: "#0e1828", ground: "#1e2838", road: "#222838", sidewalk: "#2a3040", winE: 0.7 };
  return b;
}

/* ── City layout ── */
const SW = 1.8, BS = 5, GC = 5, GR = 5;
const OX = -((GC - 1) * (BS + SW)) / 2, OZ = -((GR - 1) * (BS + SW)) / 2;

/* ── Generate window texture for buildings (shared) ── */
function makeWindowTex(rng: () => number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0c1726";
  ctx.fillRect(0, 0, 64, 128);
  const rows = 16, cols = 4;
  for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
    if (rng() > 0.35) {
      const bright = 0.4 + rng() * 0.6;
      ctx.fillStyle = `rgba(255,${Math.floor(180 + rng() * 75)},${Math.floor(50 + rng() * 50)},${bright})`;
      ctx.fillRect(cc * 16 + 3, r * 8 + 2, 10, 5);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/* ── Building: single box with window texture (NO individual window meshes) ── */
const Bldg = memo(function Bldg({ x, z, w, d, h, color }: { x: number; z: number; w: number; d: number; h: number; color: number }) {
  const mat = useMemo(() => {
    const rng = seeded(Math.round(x * 1000 + z * 100 + h * 10));
    const tex = makeWindowTex(rng);
    tex.repeat.set(Math.max(1, Math.round(w / 1.5)), Math.max(1, Math.round(h / 2)));
    return new THREE.MeshStandardMaterial({ map: tex, color, emissive: "#ffd250", emissiveIntensity: 0.15, emissiveMap: tex });
  }, [x, z, w, d, h, color]);

  return (
    <mesh position={[x, h / 2, z]} material={mat}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
});

/* ── Pre-generate all buildings ── */
const BCOLS = [0x0e1a2d, 0x101e30, 0x0c1726, 0x14253e, 0x162a44, 0x0b1824, 0x182e48];
const ALL_BLDGS = (() => {
  const rng = seeded(42);
  const out: { x: number; z: number; w: number; d: number; h: number; c: number }[] = [];
  for (let row = 0; row < GR; row++) for (let col = 0; col < GC; col++) {
    const bx = OX + col * (BS + SW) + BS / 2, bz = OZ + row * (BS + SW) + BS / 2;
    const n = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const w = 0.8 + rng() * 1.5, d = 0.8 + rng() * 1.5, h = 1.5 + rng() * 6;
      out.push({ x: bx - BS / 2 + 0.5 + rng() * (BS - w - 1), z: bz - BS / 2 + 0.5 + rng() * (BS - d - 1), w, d, h, c: BCOLS[Math.floor(rng() * BCOLS.length)] });
    }
  }
  return out;
})();

/* ── Street grid (simple planes, no dashes) ── */
function Streets({ rc, sc }: { rc: string; sc: string }) {
  const els = useMemo(() => {
    const a: JSX.Element[] = [];
    const span = GC * (BS + SW) + SW + 10;
    for (let r = 0; r <= GR; r++) {
      const z = OZ + r * (BS + SW) - BS / 2 - SW / 2;
      a.push(<mesh key={`h${r}`} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[span, SW]} /><meshStandardMaterial color={rc} /></mesh>);
      a.push(<mesh key={`hs${r}`} position={[0, 0.04, z - SW / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[span, 0.4]} /><meshStandardMaterial color={sc} /></mesh>);
      a.push(<mesh key={`hs${r}b`} position={[0, 0.04, z + SW / 2 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[span, 0.4]} /><meshStandardMaterial color={sc} /></mesh>);
    }
    for (let c = 0; c <= GC; c++) {
      const x = OX + c * (BS + SW) - BS / 2 - SW / 2;
      a.push(<mesh key={`v${c}`} position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[SW, span]} /><meshStandardMaterial color={rc} /></mesh>);
      a.push(<mesh key={`vs${c}`} position={[x - SW / 2 - 0.2, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.4, span]} /><meshStandardMaterial color={sc} /></mesh>);
      a.push(<mesh key={`vs${c}b`} position={[x + SW / 2 + 0.2, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.4, span]} /><meshStandardMaterial color={sc} /></mesh>);
    }
    return a;
  }, [rc, sc]);
  return <>{els}</>;
}

/* ── Traffic light (NO pointLight - just glowing sphere) ── */
function TLight({ p, ry = 0 }: { p: [number, number, number]; ry?: number }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  const ph = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime + ph) % 8;
    const c = t < 4 ? "#00cc00" : t < 5.5 ? "#cccc00" : "#cc0000";
    ref.current.color.set(c);
    ref.current.emissive.set(c);
  });
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.04, 0.04, 2.4, 4]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0, 2.5, 0]}><boxGeometry args={[0.14, 0.35, 0.08]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0, 2.5, 0.05]}><circleGeometry args={[0.05, 6]} /><meshStandardMaterial ref={ref} color="#0c0" emissive="#0c0" emissiveIntensity={1.2} /></mesh>
    </group>
  );
}

/* ── Lamp (NO pointLight - just glowing sphere) ── */
const LampMesh = memo(function LampMesh({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.03, 0.04, 2, 4]} /><meshStandardMaterial color="#3a3a3a" /></mesh>
      <mesh position={[0.25, 1.95, 0]}><sphereGeometry args={[0.08, 4, 4]} /><meshStandardMaterial color="#ffe696" emissive="#ffe696" emissiveIntensity={1.5} /></mesh>
    </group>
  );
});

/* ── Car (horizontal) ── */
function CarH({ color, spd, del, z, lane }: { color: number; spd: number; del: number; z: number; lane: number }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GC + 1) * (BS + SW) + 4;
  const dir = lane > 0 ? 1 : -1;
  useFrame(({ clock }) => { if (!ref.current) return; ref.current.position.x = ((clock.elapsedTime * spd + del) % range - range / 2) * dir; });
  return (
    <group ref={ref} position={[0, 0.15, z + lane * 0.4]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.7, 0.2, 0.35]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.05, 0.24, 0]}><boxGeometry args={[0.3, 0.14, 0.3]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.38, 0.12, 0]}><sphereGeometry args={[0.03, 4, 4]} /><meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.8} /></mesh>
    </group>
  );
}

/* ── Car (vertical) ── */
function CarV({ color, spd, del, x, lane }: { color: number; spd: number; del: number; x: number; lane: number }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GR + 1) * (BS + SW) + 4;
  const dir = lane > 0 ? 1 : -1;
  useFrame(({ clock }) => { if (!ref.current) return; ref.current.position.z = ((clock.elapsedTime * spd + del) % range - range / 2) * dir; });
  return (
    <group ref={ref} position={[x + lane * 0.4, 0.15, 0]} rotation={[0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.7, 0.2, 0.35]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.05, 0.24, 0]}><boxGeometry args={[0.3, 0.14, 0.3]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.38, 0.12, 0]}><sphereGeometry args={[0.03, 4, 4]} /><meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.8} /></mesh>
    </group>
  );
}

/* ── Nadro Truck ── */
function Truck({ z }: { z: number }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GC + 1) * (BS + SW) + 4;
  useFrame(({ clock }) => { if (!ref.current) return; ref.current.position.x = ((clock.elapsedTime * 0.6 + 5) % range - range / 2); });
  return (
    <group ref={ref} position={[0, 0.18, z]}>
      <mesh position={[-0.35, 0.24, 0]}><boxGeometry args={[1.1, 0.5, 0.48]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[-0.35, 0.24, 0.25]}><planeGeometry args={[1.05, 0.45]} /><meshStandardMaterial color="#4d8b31" emissive="#4d8b31" emissiveIntensity={0.2} /></mesh>
      <mesh position={[0.45, 0.22, 0]}><boxGeometry args={[0.42, 0.4, 0.45]} /><meshStandardMaterial color="#2e7d32" /></mesh>
    </group>
  );
}

/* ── Slow camera drift for cinematic feel ── */
function CameraDrift() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.08;
    camera.position.x = Math.sin(t) * 3;
    camera.position.z = 28 + Math.cos(t) * 2;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ═══ MAIN SCENE ═══ */
function CityScene({ theme }: { theme: SceneTheme }) {
  const c = useMemo(() => getColors(theme), [theme]);

  const furniture = useMemo(() => {
    const lamps: [number, number, number][] = [];
    const tls: { p: [number, number, number]; ry: number }[] = [];
    const rng = seeded(99);
    // Traffic lights only at a few key intersections (not all)
    for (let r = 1; r < GR; r += 2) {
      const z = OZ + r * (BS + SW) - BS / 2 - SW / 2;
      for (let cc = 1; cc < GC; cc += 2) {
        const x = OX + cc * (BS + SW) - BS / 2 - SW / 2;
        tls.push({ p: [x + 0.7, 0, z + 0.7], ry: 0 }, { p: [x - 0.7, 0, z - 0.7], ry: Math.PI });
      }
    }
    // Lamps: only every other block
    for (let r = 0; r <= GR; r++) {
      const z = OZ + r * (BS + SW) - BS / 2 - SW / 2;
      for (let i = 0; i < GC; i += 2) {
        const bx = OX + i * (BS + SW) + BS / 2;
        lamps.push([bx, 0, z + SW / 2 + 0.35]);
        if (rng() > 0.5) lamps.push([bx, 0, z - SW / 2 - 0.35]);
      }
    }
    return { lamps, tls };
  }, []);

  const cars = useMemo(() => {
    const rng = seeded(77), a: JSX.Element[] = [];
    let ci = 0;
    // Horizontal: 1-2 cars per street
    for (let r = 0; r <= GR; r++) {
      const z = OZ + r * (BS + SW) - BS / 2 - SW / 2;
      const n = 1 + Math.floor(rng() * 2);
      for (let i = 0; i < n; i++) { a.push(<CarH key={`ch${ci++}`} color={c.cars[Math.floor(rng() * c.cars.length)]} spd={0.8 + rng() * 1.2} del={rng() * 30} z={z} lane={rng() > 0.5 ? 1 : -1} />); }
    }
    // Vertical: 1 car per street
    for (let cc = 0; cc <= GC; cc++) {
      const x = OX + cc * (BS + SW) - BS / 2 - SW / 2;
      a.push(<CarV key={`cv${ci++}`} color={c.cars[Math.floor(rng() * c.cars.length)]} spd={0.6 + rng() * 1.0} del={rng() * 30} x={x} lane={rng() > 0.5 ? 1 : -1} />);
    }
    return a;
  }, [c.cars]);

  const mainZ = OZ + Math.floor(GR / 2) * (BS + SW) - BS / 2 - SW / 2;

  return (
    <>
      <ambientLight intensity={c.ambient} />
      <directionalLight position={[15, 20, 10]} intensity={c.dirI} color={c.dirC} />
      <hemisphereLight args={["#1a2040", "#0a0e18", 0.12]} />

      {/* Ground — very large to eliminate black edges */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={c.ground} />
      </mesh>

      <Streets rc={c.road} sc={c.sidewalk} />

      {ALL_BLDGS.map((b, i) => <Bldg key={i} x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} color={b.c} />)}

      {furniture.tls.map((t, i) => <TLight key={i} p={t.p} ry={t.ry} />)}
      {furniture.lamps.map((p, i) => <LampMesh key={i} p={p} />)}

      {cars}
      <Truck z={mainZ - 0.25} />

      <CameraDrift />
    </>
  );
}

/* ═══ EXPORTED COMPONENT ═══ */
export default function City3D({ theme = "night" }: City3DProps) {
  const c = useMemo(() => getColors(theme), [theme]);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 22, 28], fov: 50, near: 0.5, far: 120 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        style={{ background: c.fog }}
        dpr={1}
        frameloop="always"
      >
        <fog attach="fog" args={[c.fog, 10, 60]} />
        <CityScene theme={theme} />
      </Canvas>
    </div>
  );
}
