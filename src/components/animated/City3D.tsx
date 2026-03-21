"use client";

import { useRef, useMemo, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SceneTheme = "night" | "sunny" | "storm" | "snow" | "christmas" | string;
interface City3DProps { theme?: SceneTheme; }

function seeded(s: number) { let v = s; return () => { v = (v * 16807) % 2147483647; return v / 2147483647; }; }

function getColors(theme: SceneTheme) {
  const b = { ambient: 0.12, dirLight: 0.05, dirColor: "#aabbdd", fog: "#060a14", ground: "#0a0e18", road: "#181c28", sidewalk: "#1e2230", lamp: "#ffe696", lampI: 0.8, winColor: "#ffd250", winE: 0.5, cars: [0x8b2020,0x204060,0x405020,0x604020,0x303060,0x206040] };
  if (theme === "sunny") return { ...b, ambient: 0.8, dirLight: 0.9, dirColor: "#fff8e0", fog: "#87ceeb", ground: "#5a6070", road: "#606878", sidewalk: "#6a7080", lampI: 0.05, winE: 0.05 };
  if (theme === "storm") return { ...b, ambient: 0.06, dirLight: 0.02, fog: "#040610", ground: "#060a12", lampI: 0.5, winE: 0.4 };
  if (theme === "snow" || theme === "christmas") return { ...b, ambient: 0.2, dirLight: 0.15, fog: "#101828", ground: "#2a3040", road: "#2a3040", sidewalk: "#343848", lamp: "#ffeedd", lampI: 0.9, winColor: "#ffb83c", winE: 0.6 };
  return b;
}

const SW = 1.6, BS = 4.5, GC = 7, GR = 7;
const OX = -((GC - 1) * (BS + SW)) / 2, OZ = -((GR - 1) * (BS + SW)) / 2;
const BCOLS = [0x0a1420,0x0c1726,0x0e1a2d,0x101e30,0x14253e,0x162a44,0x182e48,0x0b1824];

const ALL_BLDGS = (() => {
  const r = seeded(42);
  const out: { x:number;z:number;w:number;d:number;h:number;c:number }[] = [];
  for (let row = 0; row < GR; row++) for (let col = 0; col < GC; col++) {
    const bx = OX + col*(BS+SW) + BS/2, bz = OZ + row*(BS+SW) + BS/2;
    const n = 3 + Math.floor(r()*4);
    for (let i = 0; i < n; i++) {
      const w = 0.6+r()*1.2, d = 0.6+r()*1.2, h = 1+r()*5.5;
      out.push({ x: bx-BS/2+0.4+r()*(BS-w-0.8), z: bz-BS/2+0.4+r()*(BS-d-0.8), w, d, h, c: BCOLS[Math.floor(r()*BCOLS.length)] });
    }
  }
  return out;
})();

const Bldg = memo(function Bldg({ x,z,w,d,h,c,wC,wE }: { x:number;z:number;w:number;d:number;h:number;c:number;wC:string;wE:number }) {
  const wins = useMemo(() => {
    const rng = seeded(Math.round(x*1e3+z*100+h*10));
    const rs = Math.floor(h/0.6), cs = Math.max(2,Math.floor(w/0.4));
    const a: {wx:number;wy:number;wz:number}[] = [];
    for (let r = 0; r < rs; r++) for (let cc = 0; cc < cs; cc++) {
      if (rng() > 0.35) a.push({ wx: -w/2+0.15+cc*((w-0.3)/Math.max(1,cs-1)), wy: -h/2+0.5+r*0.6, wz: d/2+0.01 });
    }
    // Side windows
    for (let r = 0; r < rs; r++) for (let cc = 0; cc < Math.max(2,Math.floor(d/0.4)); cc++) {
      if (rng() > 0.4) a.push({ wx: w/2+0.01, wy: -h/2+0.5+r*0.6, wz: -d/2+0.15+cc*((d-0.3)/Math.max(1,Math.floor(d/0.4)-1)) });
    }
    return a;
  }, [x,z,w,d,h]);
  return (
    <group position={[x,h/2,z]}>
      <mesh><boxGeometry args={[w,h,d]} /><meshStandardMaterial color={c} /></mesh>
      {wins.map((p,i) => <mesh key={i} position={[p.wx,p.wy,p.wz]}><planeGeometry args={[0.12,0.16]} /><meshStandardMaterial color={wC} emissive={wC} emissiveIntensity={wE} /></mesh>)}
    </group>
  );
});

function Streets({ rc, sc }: { rc:string; sc:string }) {
  const els = useMemo(() => {
    const a: JSX.Element[] = [];
    const span = GC*(BS+SW)+SW;
    for (let r = 0; r <= GR; r++) {
      const z = OZ+r*(BS+SW)-BS/2-SW/2;
      a.push(<mesh key={`h${r}`} position={[0,0.02,z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[span,SW]} /><meshStandardMaterial color={rc} /></mesh>);
      a.push(<mesh key={`hs${r}a`} position={[0,0.04,z-SW/2-0.15]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[span,0.3]} /><meshStandardMaterial color={sc} /></mesh>);
      a.push(<mesh key={`hs${r}b`} position={[0,0.04,z+SW/2+0.15]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[span,0.3]} /><meshStandardMaterial color={sc} /></mesh>);
    }
    for (let c = 0; c <= GC; c++) {
      const x = OX+c*(BS+SW)-BS/2-SW/2;
      a.push(<mesh key={`v${c}`} position={[x,0.02,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[SW,span]} /><meshStandardMaterial color={rc} /></mesh>);
      a.push(<mesh key={`vs${c}a`} position={[x-SW/2-0.15,0.04,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.3,span]} /><meshStandardMaterial color={sc} /></mesh>);
      a.push(<mesh key={`vs${c}b`} position={[x+SW/2+0.15,0.04,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.3,span]} /><meshStandardMaterial color={sc} /></mesh>);
    }
    return a;
  }, [rc,sc]);
  return <>{els}</>;
}

function Dashes() {
  const els = useMemo(() => {
    const a: JSX.Element[] = [];
    const span = GC*(BS+SW)+SW, cnt = Math.floor(span/1.2);
    for (let r = 0; r <= GR; r++) {
      const z = OZ+r*(BS+SW)-BS/2-SW/2;
      for (let i = 0; i < cnt; i++) a.push(<mesh key={`hd${r}_${i}`} position={[-span/2+i*1.2+0.3,0.03,z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.5,0.05]} /><meshStandardMaterial color="#ccaa00" emissive="#ccaa00" emissiveIntensity={0.15} /></mesh>);
    }
    for (let c = 0; c <= GC; c++) {
      const x = OX+c*(BS+SW)-BS/2-SW/2;
      for (let i = 0; i < cnt; i++) a.push(<mesh key={`vd${c}_${i}`} position={[x,0.03,-span/2+i*1.2+0.3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.05,0.5]} /><meshStandardMaterial color="#ccaa00" emissive="#ccaa00" emissiveIntensity={0.15} /></mesh>);
    }
    return a;
  }, []);
  return <>{els}</>;
}

function TLight({ p, ry=0 }: { p:[number,number,number]; ry?:number }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  const ph = useMemo(() => Math.random()*10, []);
  useFrame(({ clock }) => { if (!ref.current) return; const t=(clock.elapsedTime+ph)%8; if(t<4){ref.current.color.set("#00cc00");ref.current.emissive.set("#00cc00")}else if(t<5.5){ref.current.color.set("#cccc00");ref.current.emissive.set("#cccc00")}else{ref.current.color.set("#cc0000");ref.current.emissive.set("#cc0000")} });
  return (
    <group position={p} rotation={[0,ry,0]}>
      <mesh position={[0,1,0]}><cylinderGeometry args={[0.04,0.04,2,6]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0,2.1,0]}><boxGeometry args={[0.15,0.4,0.1]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0,2.1,0.06]}><circleGeometry args={[0.05,8]} /><meshStandardMaterial ref={ref} color="#0c0" emissive="#0c0" emissiveIntensity={0.8} /></mesh>
    </group>
  );
}

function Lamp({ p, c, i: intensity }: { p:[number,number,number]; c:string; i:number }) {
  return (
    <group position={p}>
      <mesh position={[0,0.9,0]}><cylinderGeometry args={[0.03,0.04,1.8,6]} /><meshStandardMaterial color="#3a3a3a" /></mesh>
      <mesh position={[0.2,1.75,0]} rotation={[0,0,-0.4]}><cylinderGeometry args={[0.02,0.02,0.5,4]} /><meshStandardMaterial color="#444" /></mesh>
      <mesh position={[0.4,1.65,0]}><sphereGeometry args={[0.07,6,6]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1} /></mesh>
      <pointLight position={[0.4,1.6,0]} color={c} intensity={intensity} distance={4} decay={2} />
    </group>
  );
}

function CarH({ color,spd,del,z,lane }:{ color:number;spd:number;del:number;z:number;lane:number }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GC+1)*(BS+SW);
  const dir = lane > 0 ? 1 : -1;
  useFrame(({ clock }) => { if(!ref.current) return; ref.current.position.x = ((clock.elapsedTime*spd+del)%range - range/2)*dir; });
  return (
    <group ref={ref} position={[0,0.12,z+lane*0.35]} rotation={[0,dir>0?0:Math.PI,0]}>
      <mesh position={[0,0.08,0]}><boxGeometry args={[0.6,0.18,0.3]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.05,0.22,0]}><boxGeometry args={[0.28,0.12,0.26]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.33,0.1,0.1]}><sphereGeometry args={[0.025,4,4]} /><meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.6} /></mesh>
      <mesh position={[0.33,0.1,-0.1]}><sphereGeometry args={[0.025,4,4]} /><meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.6} /></mesh>
      <mesh position={[-0.33,0.1,0]}><sphereGeometry args={[0.02,4,4]} /><meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={0.3} /></mesh>
    </group>
  );
}

function CarV({ color,spd,del,x,lane }:{ color:number;spd:number;del:number;x:number;lane:number }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GR+1)*(BS+SW);
  const dir = lane > 0 ? 1 : -1;
  useFrame(({ clock }) => { if(!ref.current) return; ref.current.position.z = ((clock.elapsedTime*spd+del)%range - range/2)*dir; });
  return (
    <group ref={ref} position={[x+lane*0.35,0.12,0]} rotation={[0,dir>0?Math.PI/2:-Math.PI/2,0]}>
      <mesh position={[0,0.08,0]}><boxGeometry args={[0.6,0.18,0.3]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.05,0.22,0]}><boxGeometry args={[0.28,0.12,0.26]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0.33,0.1,0]}><sphereGeometry args={[0.025,4,4]} /><meshStandardMaterial color="#ffff88" emissive="#ffff88" emissiveIntensity={0.6} /></mesh>
    </group>
  );
}

function Truck({ z }:{ z:number }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GC+1)*(BS+SW);
  useFrame(({ clock }) => { if(!ref.current) return; ref.current.position.x = ((clock.elapsedTime*0.5+5)%range - range/2); });
  return (
    <group ref={ref} position={[0,0.15,z]}>
      <mesh position={[-0.3,0.22,0]}><boxGeometry args={[1,0.45,0.42]} /><meshStandardMaterial color="#fff" /></mesh>
      <mesh position={[-0.3,0.22,0.22]}><planeGeometry args={[0.95,0.4]} /><meshStandardMaterial color="#4d8b31" emissive="#4d8b31" emissiveIntensity={0.15} /></mesh>
      <mesh position={[0.4,0.2,0]}><boxGeometry args={[0.38,0.35,0.4]} /><meshStandardMaterial color="#2e7d32" /></mesh>
      <pointLight position={[0.62,0.18,0]} color="#ffee88" intensity={0.4} distance={3} />
    </group>
  );
}

function Person({ pos,spd,axis }:{ pos:[number,number,number];spd:number;axis:"x"|"z" }) {
  const ref = useRef<THREE.Group>(null);
  const range = (GC+1)*(BS+SW);
  useFrame(({ clock }) => { if(!ref.current) return; const t=((clock.elapsedTime*Math.abs(spd)+pos[0]*10)%range)-range/2; if(axis==="x") ref.current.position.x=t; else ref.current.position.z=t; ref.current.position.y=0.22+Math.abs(Math.sin(clock.elapsedTime*5))*0.02; });
  return (
    <group ref={ref} position={pos}>
      <mesh position={[0,0.18,0]}><sphereGeometry args={[0.05,6,6]} /><meshStandardMaterial color="#d4a574" /></mesh>
      <mesh position={[0,0.04,0]}><boxGeometry args={[0.08,0.2,0.06]} /><meshStandardMaterial color={spd>0?"#2e7d32":"#1b3558"} /></mesh>
    </group>
  );
}

const Tree = memo(function Tree({ x,z }:{ x:number;z:number }) {
  return (
    <group position={[x,0,z]}>
      <mesh position={[0,0.3,0]}><cylinderGeometry args={[0.04,0.06,0.6,5]} /><meshStandardMaterial color="#2a1e14" /></mesh>
      <mesh position={[0,0.7,0]}><sphereGeometry args={[0.25,6,5]} /><meshStandardMaterial color="#1a5c1a" /></mesh>
    </group>
  );
});

function CityScene({ theme }:{ theme:SceneTheme }) {
  const c = useMemo(() => getColors(theme), [theme]);

  const furniture = useMemo(() => {
    const lamps:[number,number,number][] = [], tls:{p:[number,number,number];ry:number}[] = [], trees:{x:number;z:number}[] = [];
    const rng = seeded(99);
    for (let r = 0; r <= GR; r++) {
      const z = OZ+r*(BS+SW)-BS/2-SW/2;
      for (let cc = 0; cc <= GC; cc++) { const x = OX+cc*(BS+SW)-BS/2-SW/2; tls.push({p:[x+0.6,0,z+0.6],ry:0},{p:[x-0.6,0,z-0.6],ry:Math.PI}); }
      for (let i = 0; i < GC; i++) { const bx = OX+i*(BS+SW)+BS/2; lamps.push([bx-1.5,0,z+SW/2+0.3],[bx+1.5,0,z-SW/2-0.3]); if(rng()>0.5) trees.push({x:bx+(rng()-0.5)*2,z:z+SW/2+0.35}); if(rng()>0.5) trees.push({x:bx+(rng()-0.5)*2,z:z-SW/2-0.35}); }
    }
    return { lamps, tls, trees };
  }, []);

  const cars = useMemo(() => {
    const rng = seeded(77), a: JSX.Element[] = [];
    let ci = 0;
    for (let r = 0; r <= GR; r++) { const z = OZ+r*(BS+SW)-BS/2-SW/2; const n = 2+Math.floor(rng()*3); for (let i = 0; i < n; i++) { a.push(<CarH key={`ch${ci}`} color={c.cars[Math.floor(rng()*c.cars.length)]} spd={0.8+rng()*1.5} del={rng()*40} z={z} lane={rng()>0.5?1:-1} />); ci++; } }
    for (let cc = 0; cc <= GC; cc++) { const x = OX+cc*(BS+SW)-BS/2-SW/2; const n = 1+Math.floor(rng()*2); for (let i = 0; i < n; i++) { a.push(<CarV key={`cv${ci}`} color={c.cars[Math.floor(rng()*c.cars.length)]} spd={0.6+rng()*1.2} del={rng()*40} x={x} lane={rng()>0.5?1:-1} />); ci++; } }
    return a;
  }, [c.cars]);

  const people = useMemo(() => {
    const rng = seeded(55), a: JSX.Element[] = [];
    for (let r = 0; r <= GR; r++) { const z = OZ+r*(BS+SW)-BS/2-SW/2; for (let i = 0; i < 3; i++) a.push(<Person key={`ph${r}_${i}`} pos={[rng()*10-5,0.22,z+SW/2+0.3+rng()*0.2]} spd={0.15+rng()*0.3} axis="x" />); }
    for (let cc = 0; cc <= GC; cc++) { const x = OX+cc*(BS+SW)-BS/2-SW/2; for (let i = 0; i < 2; i++) a.push(<Person key={`pv${cc}_${i}`} pos={[x+SW/2+0.3,0.22,rng()*10-5]} spd={0.12+rng()*0.25} axis="z" />); }
    return a;
  }, []);

  const mainStreetZ = OZ + Math.floor(GR/2)*(BS+SW)-BS/2-SW/2;

  return (
    <>
      <ambientLight intensity={c.ambient} />
      <directionalLight position={[10,15,8]} intensity={c.dirLight} color={c.dirColor} />
      <hemisphereLight args={["#1a2040","#0a0e18",0.15]} />

      {/* Ground */}
      <mesh position={[0,-0.01,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[80,80]} /><meshStandardMaterial color={c.ground} /></mesh>

      <Streets rc={c.road} sc={c.sidewalk} />
      <Dashes />

      {ALL_BLDGS.map((b,i) => <Bldg key={i} x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} c={b.c} wC={c.winColor} wE={c.winE} />)}

      {furniture.lamps.map((p,i) => <Lamp key={i} p={p} c={c.lamp} i={c.lampI} />)}
      {furniture.tls.map((t,i) => <TLight key={i} p={t.p} ry={t.ry} />)}
      {furniture.trees.map((t,i) => <Tree key={i} x={t.x} z={t.z} />)}

      {cars}
      {people}

      <Truck z={mainStreetZ - 0.2} />
    </>
  );
}

export default function City3D({ theme = "night" }: City3DProps) {
  const c = useMemo(() => getColors(theme), [theme]);
  return (
    <div style={{ position:"absolute", inset:0, zIndex:1 }}>
      <Canvas
        camera={{ position: [0, 22, 28], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: c.fog }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={[c.fog, 15, 55]} />
        <CityScene theme={theme} />
      </Canvas>
    </div>
  );
}
