"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export function MedicalCrossIcon({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current.querySelector(".cross-glow"),
      opacity: [0.2, 0.6, 0.2],
      scale: [1, 1.1, 1],
      duration: 2000,
      easing: "easeInOutSine",
      loop: true,
    });

    anime({
      targets: ref.current.querySelector(".cross-main"),
      scale: [1, 1.05, 1],
      duration: 1500,
      easing: "easeInOutQuad",
      loop: true,
    });
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle className="cross-glow" cx="100" cy="100" r="50" fill="#4D8B31" opacity="0.3" filter="url(#glow)" />
      <g className="cross-main">
        <rect x="85" y="60" width="30" height="80" rx="5" fill="#4D8B31" />
        <rect x="60" y="85" width="80" height="30" rx="5" fill="#4D8B31" />
        <rect x="90" y="65" width="20" height="70" rx="3" fill="#8BC34A" opacity="0.6" />
        <rect x="65" y="90" width="70" height="20" rx="3" fill="#8BC34A" opacity="0.6" />
      </g>
    </svg>
  );
}
