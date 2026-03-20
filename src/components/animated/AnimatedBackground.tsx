"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export function AnimatedBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current.querySelector(".gradient-1"),
      translateX: ["-10%", "10%"],
      translateY: ["-10%", "10%"],
      duration: 20000,
      easing: "easeInOutSine",
      loop: true,
      direction: "alternate",
    });

    anime({
      targets: ref.current.querySelector(".gradient-2"),
      translateX: ["10%", "-10%"],
      translateY: ["10%", "-10%"],
      duration: 25000,
      easing: "easeInOutSine",
      loop: true,
      direction: "alternate",
    });

    anime({
      targets: ref.current.querySelector(".gradient-3"),
      scale: [1, 1.2, 1],
      duration: 15000,
      easing: "easeInOutQuad",
      loop: true,
    });
  }, []);

  return (
    <div ref={ref} className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <div
        className="gradient-1 absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10 blur-3xl"
      />
      <div
        className="gradient-2 absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-tl from-brand-accent/20 to-brand-light/10 blur-3xl"
      />
      <div
        className="gradient-3 absolute left-1/2 top-1/2 h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-secondary/10 to-brand-primary/10 blur-2xl"
      />
    </div>
  );
}
