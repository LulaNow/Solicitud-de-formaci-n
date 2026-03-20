"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export function DNAHelixIcon({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current.querySelector(".helix-group"),
      rotateZ: "360deg",
      duration: 8000,
      easing: "linear",
      loop: true,
    });

    anime({
      targets: ref.current.querySelectorAll(".helix-strand"),
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 3000,
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
      <g className="helix-group">
        <path
          className="helix-strand"
          d="M 100 40 Q 120 60, 100 80 T 100 120 T 100 160"
          stroke="#4D8B31"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
        />
        <path
          className="helix-strand"
          d="M 100 40 Q 80 60, 100 80 T 100 120 T 100 160"
          stroke="#8BC34A"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
        />
        <circle cx="100" cy="50" r="5" fill="#4D8B31" />
        <circle cx="100" cy="80" r="5" fill="#8BC34A" />
        <circle cx="100" cy="110" r="5" fill="#4D8B31" />
        <circle cx="100" cy="140" r="5" fill="#8BC34A" />
        <line x1="95" y1="50" x2="105" y2="80" stroke="#C8E6C9" strokeWidth="1" />
        <line x1="95" y1="80" x2="105" y2="110" stroke="#C8E6C9" strokeWidth="1" />
        <line x1="95" y1="110" x2="105" y2="140" stroke="#C8E6C9" strokeWidth="1" />
      </g>
    </svg>
  );
}
