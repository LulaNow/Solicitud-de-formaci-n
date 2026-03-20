"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import anime from "animejs";

export function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 8 + 4,
      height: Math.random() * 8 + 4,
      background: i % 3 === 0 ? "#4D8B31" : i % 3 === 1 ? "#8BC34A" : "#C8E6C9",
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mounted) return;

    const particleElements = containerRef.current.querySelectorAll(".particle");

    particleElements.forEach((particle, index) => {
      anime({
        targets: particle,
        translateX: () => anime.random(-50, 50),
        translateY: () => anime.random(-50, 50),
        scale: [0.5, 1, 0.5],
        opacity: [0.3, 0.7, 0.3],
        duration: () => anime.random(3000, 5000),
        delay: index * 200,
        easing: "easeInOutSine",
        loop: true,
      });
    });
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle absolute"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            borderRadius: "50%",
            background: particle.background,
          }}
        />
      ))}
    </div>
  );
}
