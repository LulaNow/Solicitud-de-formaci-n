"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export function PillIcon({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current.querySelector(".pill-group"),
      rotateY: "360deg",
      duration: 4000,
      easing: "linear",
      loop: true,
    });

    anime({
      targets: ref.current.querySelectorAll(".pill-shine"),
      opacity: [0.3, 0.8, 0.3],
      duration: 2000,
      easing: "easeInOutSine",
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
      <g className="pill-group">
        <ellipse cx="100" cy="100" rx="60" ry="25" fill="#4D8B31" opacity="0.9" />
        <ellipse cx="100" cy="100" rx="30" ry="25" fill="#2E7D32" />
        <ellipse className="pill-shine" cx="85" cy="95" rx="15" ry="8" fill="#8BC34A" opacity="0.5" />
      </g>
    </svg>
  );
}
