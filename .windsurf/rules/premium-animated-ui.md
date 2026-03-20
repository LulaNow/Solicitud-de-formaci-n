---
description: Premium animated UI components with SVG and anime.js for enterprise applications
tags: [ui, animation, svg, enterprise, premium]
---

# Premium Animated UI Skill

## Philosophy
Create modern, enterprise-grade animated interfaces that balance professionalism with engaging motion design. Use anime.js for smooth, performant animations and custom SVG graphics for brand-aligned visual elements.

## Core Principles

### 1. Animation Hierarchy
- **Micro-interactions**: 150-300ms (hover, focus, clicks)
- **Transitions**: 300-500ms (page changes, modals)
- **Ambient animations**: 2-5s loops (background elements)
- **Entrance animations**: 500-800ms (page load, components appearing)

### 2. Easing Functions (anime.js)
```javascript
// Smooth and professional
easeOutExpo: 'easeOutExpo'  // Fast start, slow end
easeInOutQuad: 'easeInOutQuad'  // Balanced
spring: { mass: 1, stiffness: 80, damping: 10 }  // Natural bounce
```

### 3. SVG Animation Patterns

#### Floating Elements
```javascript
anime({
  targets: '.floating-element',
  translateY: ['-10px', '10px'],
  duration: 3000,
  easing: 'easeInOutSine',
  loop: true,
  direction: 'alternate'
});
```

#### Particle Systems
```javascript
anime({
  targets: '.particle',
  translateX: () => anime.random(-100, 100),
  translateY: () => anime.random(-100, 100),
  scale: [0, 1],
  opacity: [1, 0],
  duration: 2000,
  delay: anime.stagger(100),
  easing: 'easeOutExpo'
});
```

#### Morphing Shapes
```javascript
anime({
  targets: 'path',
  d: [
    { value: pathData1 },
    { value: pathData2 }
  ],
  duration: 1000,
  easing: 'easeInOutQuad',
  loop: true,
  direction: 'alternate'
});
```

## Enterprise UI Patterns

### Login Page Components

#### 1. Animated Background
- Gradient mesh with subtle movement
- Floating geometric shapes
- Particle effects (low density for performance)
- Brand-colored overlays with opacity transitions

#### 2. Form Animations
```javascript
// Input focus animation
anime({
  targets: '.input-wrapper',
  scale: [1, 1.02],
  borderColor: ['#e5e7eb', '#4D8B31'],
  duration: 200,
  easing: 'easeOutQuad'
});

// Button hover
anime({
  targets: '.btn-primary',
  scale: 1.05,
  boxShadow: '0 10px 25px rgba(77, 139, 49, 0.3)',
  duration: 200,
  easing: 'easeOutQuad'
});

// Loading state
anime({
  targets: '.loading-spinner',
  rotate: '360deg',
  duration: 1000,
  easing: 'linear',
  loop: true
});
```

#### 3. Page Entrance
```javascript
// Staggered fade-in
anime({
  targets: '.login-element',
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 600,
  delay: anime.stagger(100),
  easing: 'easeOutExpo'
});
```

### Industry-Specific SVG Icons

#### Pharmaceutical/Healthcare Theme
- **Molecules**: Animated atom structures with orbiting electrons
- **Pills/Capsules**: Rotating 3D-style pills
- **Medical Cross**: Pulsing cross with glow effect
- **DNA Helix**: Rotating double helix
- **Heartbeat**: Animated ECG line
- **Shield**: Protection/security icon with pulse

#### SVG Structure Example
```svg
<svg viewBox="0 0 200 200" class="animated-icon">
  <!-- Molecule structure -->
  <g class="molecule">
    <circle class="atom" cx="100" cy="100" r="10" fill="#4D8B31"/>
    <circle class="electron" cx="130" cy="100" r="5" fill="#8BC34A"/>
    <!-- More atoms and bonds -->
  </g>
</svg>
```

## Color Palette Integration

### NADRO Brand Colors
```css
:root {
  --brand-primary: #4D8B31;
  --brand-secondary: #8BC34A;
  --brand-accent: #2E7D32;
  --brand-light: #C8E6C9;
  --brand-dark: #1B5E20;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #4D8B31 0%, #2E7D32 100%);
  --gradient-glow: radial-gradient(circle, rgba(77,139,49,0.2) 0%, transparent 70%);
}
```

### Animation Color Transitions
```javascript
anime({
  targets: '.brand-element',
  backgroundColor: [
    { value: '#4D8B31' },
    { value: '#8BC34A' },
    { value: '#4D8B31' }
  ],
  duration: 3000,
  easing: 'easeInOutQuad',
  loop: true
});
```

## Performance Optimization

### 1. Use CSS Transforms
- Prefer `transform` over `top/left`
- Use `will-change` sparingly
- Leverage GPU acceleration

### 2. Reduce Repaints
```javascript
// Good: Transform-based animation
anime({ targets: '.el', translateX: 100 });

// Avoid: Layout-triggering properties
anime({ targets: '.el', left: '100px' });
```

### 3. Lazy Animation Loading
```javascript
// Only animate visible elements
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      startAnimation(entry.target);
    }
  });
});
```

## Accessibility Considerations

### 1. Respect Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Keyboard Navigation
- Maintain focus indicators during animations
- Ensure animated elements don't interfere with tab order
- Provide skip animation options

### 3. Screen Readers
- Use `aria-live` for dynamic content
- Don't rely solely on animation to convey information
- Provide text alternatives for visual animations

## Implementation Checklist

### Login Page
- [ ] Animated gradient background
- [ ] Floating SVG elements (3-5 shapes)
- [ ] Smooth form input transitions
- [ ] Button hover/active states
- [ ] Loading spinner animation
- [ ] Page entrance animation
- [ ] Logo animation (fade + scale)
- [ ] Error message slide-in
- [ ] Success state animation

### Component Library
- [ ] Reusable animation hooks
- [ ] SVG icon components
- [ ] Transition wrappers
- [ ] Loading states
- [ ] Skeleton loaders
- [ ] Toast notifications
- [ ] Modal transitions

## Code Examples

### React Hook for Animations
```typescript
import { useEffect, useRef } from 'react';
import anime from 'animejs';

export function useAnimeOnMount(config: anime.AnimeParams) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      anime({
        targets: ref.current,
        ...config
      });
    }
  }, []);
  
  return ref;
}
```

### Animated Component Wrapper
```typescript
export function AnimatedEntry({ children, delay = 0 }) {
  const ref = useAnimeOnMount({
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    delay,
    easing: 'easeOutExpo'
  });
  
  return <div ref={ref}>{children}</div>;
}
```

## Testing Animations

### Visual Regression
- Capture screenshots at key animation frames
- Test across different browsers
- Verify performance metrics (FPS, CPU usage)

### Performance Benchmarks
- Target: 60 FPS for all animations
- Maximum CPU usage: <30% during animations
- Memory: No leaks after 100+ animation cycles

## Resources

- anime.js Documentation: https://animejs.com/documentation/
- SVG Animation Guide: https://css-tricks.com/guide-svg-animations-smil/
- Motion Design Principles: https://material.io/design/motion
- Web Animation Performance: https://web.dev/animations/
