# Sistema de UI Animada Premium - NADRO Enterprise Portal

## Descripción General

Sistema de componentes animados empresariales diseñado específicamente para el Portal NADRO, utilizando anime.js y SVG para crear una experiencia visual moderna y profesional con temática farmacéutica/salud.

## Componentes Creados

### 1. Iconos SVG Animados

#### MoleculeIcon
- **Ubicación**: `src/components/animated/MoleculeIcon.tsx`
- **Animación**: Átomos pulsantes + electrones flotantes
- **Uso**: Representa investigación farmacéutica y química
- **Duración**: Loop infinito con easing suave

```tsx
import { MoleculeIcon } from "@/components/animated/MoleculeIcon";
<MoleculeIcon className="h-24 w-24" />
```

#### PillIcon
- **Ubicación**: `src/components/animated/PillIcon.tsx`
- **Animación**: Rotación 3D + brillo pulsante
- **Uso**: Representa productos farmacéuticos
- **Duración**: 4s rotación completa

```tsx
import { PillIcon } from "@/components/animated/PillIcon";
<PillIcon className="h-20 w-20" />
```

#### MedicalCrossIcon
- **Ubicación**: `src/components/animated/MedicalCrossIcon.tsx`
- **Animación**: Pulso con efecto glow
- **Uso**: Representa salud y servicios médicos
- **Duración**: 2s pulso + glow

```tsx
import { MedicalCrossIcon } from "@/components/animated/MedicalCrossIcon";
<MedicalCrossIcon className="h-28 w-28" />
```

#### DNAHelixIcon
- **Ubicación**: `src/components/animated/DNAHelixIcon.tsx`
- **Animación**: Rotación helicoidal + stroke animado
- **Uso**: Representa biotecnología e innovación
- **Duración**: 8s rotación completa

```tsx
import { DNAHelixIcon } from "@/components/animated/DNAHelixIcon";
<DNAHelixIcon className="h-24 w-24" />
```

### 2. Componentes de Ambiente

#### AnimatedBackground
- **Ubicación**: `src/components/animated/AnimatedBackground.tsx`
- **Características**:
  - 3 gradientes animados independientes
  - Movimiento suave y continuo
  - Blur para efecto profesional
  - Paleta de colores NADRO
- **Uso**: Fondo animado para páginas de autenticación

```tsx
import { AnimatedBackground } from "@/components/animated/AnimatedBackground";
<AnimatedBackground />
```

#### FloatingParticles
- **Ubicación**: `src/components/animated/FloatingParticles.tsx`
- **Características**:
  - 12 partículas flotantes
  - Movimiento aleatorio
  - Opacidad variable
  - Colores de marca NADRO
- **Uso**: Efecto ambiental sutil

```tsx
import { FloatingParticles } from "@/components/animated/FloatingParticles";
<FloatingParticles />
```

## Página de Login Animada

### Características Implementadas

1. **Entrada Escalonada**
   - Logo: fade + scale (800ms)
   - Elementos del formulario: stagger de 100ms
   - Easing: `easeOutExpo` para suavidad profesional

2. **Interacciones del Formulario**
   - Inputs: scale 1.01 en focus + ring animado
   - Botón: hover scale 1.02 + shadow animada
   - Loading: spinner rotatorio

3. **Mensajes de Error**
   - Slide-in desde la izquierda
   - Fade-in suave
   - Duración: 400ms

4. **Elementos de Fondo**
   - 4 iconos SVG posicionados en esquinas
   - Opacidad 20% para no distraer
   - Animaciones continuas

### Estructura Visual

```
┌─────────────────────────────────────────┐
│  [Molecule]              [Pill]         │
│                                         │
│         ┌─────────────────┐             │
│         │   NADRO Logo    │             │
│         │                 │             │
│         │  Login Form     │             │
│         │  - Username     │             │
│         │  - Password     │             │
│         │  [Button]       │             │
│         └─────────────────┘             │
│                                         │
│  [Medical Cross]         [DNA Helix]   │
└─────────────────────────────────────────┘
```

## Paleta de Colores NADRO

```css
--brand-primary: #4D8B31    /* Verde principal */
--brand-secondary: #8BC34A  /* Verde claro */
--brand-accent: #2E7D32     /* Verde oscuro */
--brand-light: #C8E6C9      /* Verde muy claro */
--brand-dark: #1B5E20       /* Verde muy oscuro */
```

## Configuración de anime.js

### Timings Estándar
- **Micro-interacciones**: 150-300ms
- **Transiciones**: 300-500ms
- **Animaciones ambientales**: 2-5s
- **Entradas de página**: 500-800ms

### Easing Functions Utilizadas
- `easeOutExpo`: Entradas y salidas rápidas
- `easeInOutSine`: Loops continuos
- `easeInOutQuad`: Transiciones balanceadas
- `linear`: Rotaciones continuas

## Performance

### Optimizaciones Aplicadas
1. **GPU Acceleration**: Uso de `transform` en lugar de propiedades de layout
2. **Will-change**: Aplicado solo donde es necesario
3. **Lazy Loading**: Animaciones inician solo cuando son visibles
4. **Reduce Motion**: Respeta preferencias de accesibilidad

### Métricas Target
- **FPS**: 60 constante
- **CPU**: <30% durante animaciones
- **Memory**: Sin leaks después de 100+ ciclos

## Accesibilidad

### Implementado
- `prefers-reduced-motion` respetado
- Focus indicators visibles durante animaciones
- Animaciones no bloquean interacción
- Texto alternativo en todos los SVG

## Uso en Otras Páginas

### Ejemplo: Dashboard con Animaciones

```tsx
"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";
import { MoleculeIcon } from "@/components/animated/MoleculeIcon";

export default function DashboardPage() {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statsRef.current) {
      anime({
        targets: statsRef.current.querySelectorAll(".stat-card"),
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: "easeOutExpo",
      });
    }
  }, []);

  return (
    <div ref={statsRef}>
      <div className="stat-card">...</div>
      <div className="stat-card">...</div>
    </div>
  );
}
```

## Extensión del Sistema

### Crear Nuevo Icono Animado

1. Crear archivo en `src/components/animated/`
2. Usar estructura base:

```tsx
"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export function CustomIcon({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current.querySelector(".animated-element"),
      // ... configuración de animación
    });
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 200 200" className={className}>
      {/* SVG content */}
    </svg>
  );
}
```

### Agregar Nueva Animación de Página

1. Importar anime.js
2. Crear refs para elementos a animar
3. Usar `useEffect` para iniciar animaciones
4. Aplicar clase `.animated-element` a elementos

## Troubleshooting

### Las animaciones no se ejecutan
- Verificar que anime.js está instalado: `npm list animejs`
- Confirmar que el componente es "use client"
- Revisar que los refs están correctamente asignados

### Performance bajo
- Reducir número de partículas en `FloatingParticles`
- Aumentar duración de animaciones
- Verificar que no hay memory leaks con DevTools

### Iconos no visibles
- Verificar opacidad y z-index
- Confirmar que viewBox está correctamente configurado
- Revisar colores contra el fondo

## Recursos Adicionales

- **Skill**: `.windsurf/rules/premium-animated-ui.md`
- **anime.js Docs**: https://animejs.com/documentation/
- **SVG Reference**: https://developer.mozilla.org/en-US/docs/Web/SVG

## Mantenimiento

### Actualizar Colores de Marca
Editar `src/app/globals.css`:

```css
:root {
  --brand-primary: #NUEVO_COLOR;
  /* ... */
}
```

### Ajustar Velocidad de Animaciones
Modificar duraciones en cada componente o crear constantes globales:

```tsx
// src/lib/animation-config.ts
export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 400,
  slow: 800,
  ambient: 3000,
};
```

## Próximas Mejoras

- [ ] Sistema de temas (light/dark)
- [ ] Más iconos farmacéuticos (jeringas, frascos, etc.)
- [ ] Animaciones de carga personalizadas
- [ ] Transiciones entre páginas
- [ ] Efectos de hover más elaborados
- [ ] Animaciones de éxito/error más expresivas
