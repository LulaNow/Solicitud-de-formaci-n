"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export function MoleculeIcon({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    anime({
      targets: ref.current.querySelectorAll(".electron"),
      translateX: function () {
        return anime.random(-3, 3);
      },
      translateY: function () {
        return anime.random(-3, 3);
      },
      duration: 2000,
      easing: "easeInOutSine",
      loop: true,
      direction: "alternate",
      delay: anime.stagger(200),
    });

    anime({
      targets: ref.current.querySelectorAll(".atom"),
      scale: [1, 1.1, 1],
      duration: 3000,
      easing: "easeInOutQuad",
      loop: true,
      delay: anime.stagger(300),
    });
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="molecule">
        <circle className="atom" cx="100" cy="100" r="12" fill="#4D8B31" opacity="0.9" />
        <circle className="atom" cx="70" cy="80" r="10" fill="#8BC34A" opacity="0.8" />
        <circle className="atom" cx="130" cy="80" r="10" fill="#8BC34A" opacity="0.8" />
        <circle className="atom" cx="70" cy="120" r="10" fill="#8BC34A" opacity="0.8" />
        <circle className="atom" cx="130" cy="120" r="10" fill="#8BC34A" opacity="0.8" />
        
        <line x1="100" y1="100" x2="70" y2="80" stroke="#4D8B31" strokeWidth="2" opacity="0.5" />
        <line x1="100" y1="100" x2="130" y2="80" stroke="#4D8B31" strokeWidth="2" opacity="0.5" />
        <line x1="100" y1="100" x2="70" y2="120" stroke="#4D8B31" strokeWidth="2" opacity="0.5" />
        <line x1="100" y1="100" x2="130" y2="120" stroke="#4D8B31" strokeWidth="2" opacity="0.5" />
        
        <circle className="electron" cx="100" cy="60" r="4" fill="#C8E6C9" />
        <circle className="electron" cx="140" cy="100" r="4" fill="#C8E6C9" />
        <circle className="electron" cx="100" cy="140" r="4" fill="#C8E6C9" />
        <circle className="electron" cx="60" cy="100" r="4" fill="#C8E6C9" />
      </g>
    </svg>
  );
}
