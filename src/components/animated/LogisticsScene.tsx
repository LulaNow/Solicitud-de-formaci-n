"use client";

import { useState, useEffect } from "react";

export function LogisticsScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="absolute inset-0 bg-[#0b1120]" />;

  return (
    <div
      className="scene-root absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ═══ SKY ═══ */}
      <div className="absolute inset-0 sky" />

      {/* Stars — single element, box-shadow trick */}
      <div className="stars" />

      {/* Moon */}
      <div className="moon" />

      {/* Slow clouds (2 elements + pseudo) */}
      <div className="cloud cloud--1" />
      <div className="cloud cloud--2" />

      {/* ═══ CITY ═══ */}
      <div className="city">
        {/* ── Far skyline silhouettes ── */}
        <div
          className="bldg"
          style={{ left: "1%", width: 42, height: 110, background: "#0e1a2d" }}
        />
        <div
          className="bldg"
          style={{ left: "5%", width: 34, height: 80, background: "#101e30" }}
        />
        <div
          className="bldg"
          style={{ left: "9%", width: 28, height: 130, background: "#0c1726" }}
        />
        <div
          className="bldg"
          style={{ left: "14%", width: 50, height: 95, background: "#101e30" }}
        />
        <div
          className="bldg"
          style={{ left: "20%", width: 36, height: 70, background: "#0e1a2d" }}
        />

        <div
          className="bldg"
          style={{ right: "1%", width: 44, height: 100, background: "#0e1a2d" }}
        />
        <div
          className="bldg"
          style={{ right: "6%", width: 30, height: 125, background: "#0c1726" }}
        />
        <div
          className="bldg"
          style={{ right: "10%", width: 48, height: 85, background: "#101e30" }}
        />
        <div
          className="bldg"
          style={{
            right: "16%",
            width: 32,
            height: 145,
            background: "#0e1a2d",
          }}
        />

        {/* ── Mid buildings with windows ── */}
        <div
          className="bldg bldg--win-a"
          style={{ left: "24%", width: 52, height: 100, background: "#14253e" }}
        />
        <div
          className="bldg bldg--win-b"
          style={{ left: "30%", width: 38, height: 68, background: "#162a44" }}
        />
        <div
          className="bldg bldg--win-a"
          style={{ left: "53%", width: 40, height: 115, background: "#14253e" }}
        />
        <div
          className="bldg bldg--win-b"
          style={{ left: "59%", width: 46, height: 60, background: "#152842" }}
        />

        {/* ═══ HOSPITAL ═══ */}
        <div
          className="bldg hospital"
          style={{ right: "22%", width: 90, height: 160 }}
        >
          <div className="win-grid win-grid--warm" />
          {/* Red cross */}
          <div className="cross cross--red" />
          <div className="bldg-label">HOSPITAL</div>
          {/* Rooftop */}
          <div className="rooftop rooftop--hospital" />
        </div>

        {/* ═══ PHARMACY ═══ */}
        <div
          className="bldg pharmacy"
          style={{ left: "35%", width: 62, height: 90 }}
        >
          <div className="win-grid win-grid--green" />
          <div className="cross cross--green" />
          <div className="bldg-label bldg-label--green">FARMACIA</div>
          {/* Awning */}
          <div className="awning" />
        </div>

        {/* ── Sidewalk + Road ── */}
        <div className="sidewalk-top" />
        <div className="road" />
        <div className="road-lines" />
        <div className="sidewalk-bottom" />
        <div className="curb" />

        {/* ── Street furniture ── */}
        <div className="lamp" style={{ left: "12%" }} />
        <div className="lamp" style={{ left: "42%" }} />
        <div className="lamp" style={{ left: "72%" }} />
        <div className="lamp" style={{ left: "92%" }} />

        <div className="tree-el" style={{ left: "7%" }} />
        <div className="tree-el" style={{ left: "33%" }} />
        <div className="tree-el" style={{ left: "63%" }} />
        <div className="tree-el" style={{ left: "85%" }} />

        {/* ── Parked car (ambient) ── */}
        <div className="parked-car" style={{ left: "16%" }} />

        {/* ═══ NADRO TRUCK ═══ */}
        <div className="truck">
          {/* Cargo box */}
          <div className="truck__cargo">
            <div className="truck__cargo-inner">
              <span className="truck__brand">NADRO</span>
            </div>
          </div>
          {/* Cabin */}
          <div className="truck__cabin">
            <div className="truck__windshield" />
          </div>
          {/* Wheels */}
          <div className="truck__wheel truck__wheel--rear" />
          <div className="truck__wheel truck__wheel--front" />
          {/* Headlights */}
          <div className="truck__headlight" />
        </div>
      </div>

      <style jsx>{`
        /* ── Base ── */
        .sky {
          background: linear-gradient(
            180deg,
            #080e1a 0%,
            #0f1d36 35%,
            #1a3460 70%,
            #243f65 100%
          );
        }

        .stars {
          position: absolute;
          width: 1px;
          height: 1px;
          top: 0;
          left: 0;
          box-shadow:
            80px 22px 0 1px rgba(255, 255, 255, 0.55),
            220px 45px 0 0 rgba(255, 255, 255, 0.4),
            370px 18px 0 1px rgba(255, 255, 255, 0.5),
            510px 58px 0 0 rgba(255, 255, 255, 0.35),
            660px 30px 0 1px rgba(255, 255, 255, 0.5),
            800px 12px 0 0 rgba(255, 255, 255, 0.45),
            950px 48px 0 1px rgba(255, 255, 255, 0.4),
            130px 75px 0 0 rgba(255, 255, 255, 0.3),
            430px 85px 0 0 rgba(255, 255, 255, 0.35),
            720px 72px 0 1px rgba(255, 255, 255, 0.5),
            1100px 25px 0 0 rgba(255, 255, 255, 0.4),
            1250px 60px 0 1px rgba(255, 255, 255, 0.45),
            290px 100px 0 0 rgba(255, 255, 255, 0.3),
            580px 110px 0 0 rgba(255, 255, 255, 0.25),
            860px 95px 0 0 rgba(255, 255, 255, 0.35),
            1050px 80px 0 0 rgba(255, 255, 255, 0.3);
          animation: twinkle 5s ease-in-out infinite alternate;
        }

        .moon {
          position: absolute;
          right: 11%;
          top: 7%;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #e8e4d4;
          box-shadow:
            0 0 30px 6px rgba(232, 228, 212, 0.2),
            inset -5px -3px 0 0 #d4cfbb;
        }

        /* ── Clouds ── */
        .cloud {
          position: absolute;
          width: 100px;
          height: 24px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 24px;
          animation: drift linear infinite;
        }
        .cloud::before,
        .cloud::after {
          content: "";
          position: absolute;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 50%;
        }
        .cloud::before {
          width: 44px;
          height: 34px;
          top: -16px;
          left: 16px;
        }
        .cloud::after {
          width: 34px;
          height: 26px;
          top: -8px;
          right: 14px;
        }
        .cloud--1 {
          top: 10%;
          left: -120px;
          animation-duration: 70s;
        }
        .cloud--2 {
          top: 20%;
          left: -120px;
          animation-duration: 95s;
          animation-delay: -30s;
          opacity: 0.5;
          transform: scale(0.7);
        }

        /* ── City container ── */
        .city {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
        }

        /* ── Generic building ── */
        .bldg {
          position: absolute;
          bottom: 110px; /* sits on sidewalk */
          border-radius: 2px 2px 0 0;
        }

        /* Window patterns via pseudo (no extra DOM) */
        .bldg--win-a::after,
        .bldg--win-b::after {
          content: "";
          position: absolute;
          inset: 10% 12% 6% 12%;
        }
        .bldg--win-a::after {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 70%,
              rgba(255, 210, 80, 0.5) 70%,
              rgba(255, 210, 80, 0.5) 82%,
              transparent 82%
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 60%,
              rgba(255, 210, 80, 0.5) 60%,
              rgba(255, 210, 80, 0.5) 80%,
              transparent 80%
            );
          animation: windowFlicker 7s ease-in-out infinite alternate;
        }
        .bldg--win-b::after {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 68%,
              rgba(160, 200, 255, 0.35) 68%,
              rgba(160, 200, 255, 0.35) 80%,
              transparent 80%
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 55%,
              rgba(160, 200, 255, 0.35) 55%,
              rgba(160, 200, 255, 0.35) 78%,
              transparent 78%
            );
          animation: windowFlicker 9s ease-in-out infinite alternate;
          animation-delay: -3s;
        }

        /* ── Hospital ── */
        .hospital {
          background: linear-gradient(180deg, #1b3558, #162c4a);
          box-shadow: 0 0 30px rgba(30, 70, 130, 0.25);
          z-index: 2;
        }
        .rooftop--hospital {
          position: absolute;
          top: -6px;
          left: 10%;
          right: 10%;
          height: 6px;
          background: #1f3a5c;
          border-radius: 2px 2px 0 0;
        }

        /* ── Pharmacy ── */
        .pharmacy {
          background: linear-gradient(180deg, #1a3d30, #16332a);
          box-shadow: 0 0 20px rgba(77, 139, 49, 0.18);
          z-index: 2;
        }
        .awning {
          position: absolute;
          bottom: -6px;
          left: -4px;
          right: -4px;
          height: 8px;
          background: repeating-linear-gradient(
            90deg,
            #2e7d32 0,
            #2e7d32 8px,
            #4d8b31 8px,
            #4d8b31 16px
          );
          border-radius: 0 0 3px 3px;
        }

        /* ── Window grid (for hospital / pharmacy) ── */
        .win-grid {
          position: absolute;
          inset: 14% 10% 5% 10%;
        }
        .win-grid--warm {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 16%,
              rgba(255, 215, 80, 0.65) 16%,
              rgba(255, 215, 80, 0.65) 22%,
              transparent 22%
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 18%,
              rgba(255, 215, 80, 0.65) 18%,
              rgba(255, 215, 80, 0.65) 32%,
              transparent 32%
            );
          animation: windowFlicker 6s ease-in-out infinite alternate;
        }
        .win-grid--green {
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 20%,
              rgba(180, 230, 180, 0.5) 20%,
              rgba(180, 230, 180, 0.5) 30%,
              transparent 30%
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 16%,
              rgba(180, 230, 180, 0.5) 16%,
              rgba(180, 230, 180, 0.5) 36%,
              transparent 36%
            );
          animation: windowFlicker 5s ease-in-out infinite alternate;
          animation-delay: -2s;
        }

        /* ── Cross symbols ── */
        .cross {
          position: absolute;
          top: 7%;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
        }
        .cross::before,
        .cross::after {
          content: "";
          position: absolute;
          border-radius: 1px;
        }
        .cross::before {
          left: 50%;
          top: 0;
          width: 30%;
          height: 100%;
          transform: translateX(-50%);
        }
        .cross::after {
          left: 0;
          top: 50%;
          width: 100%;
          height: 30%;
          transform: translateY(-50%);
        }
        .cross--red::before,
        .cross--red::after {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }
        .cross--green::before,
        .cross--green::after {
          background: #4d8b31;
          box-shadow: 0 0 8px rgba(77, 139, 49, 0.6);
        }

        /* ── Building labels ── */
        .bldg-label {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.5);
        }
        .bldg-label--green {
          color: rgba(139, 195, 74, 0.6);
        }

        /* ── Road system ── */
        .sidewalk-top {
          position: absolute;
          bottom: 102px;
          left: 0;
          right: 0;
          height: 8px;
          background: #252538;
        }
        .road {
          position: absolute;
          bottom: 38px;
          left: 0;
          right: 0;
          height: 64px;
          background: #1e1e30;
        }
        .road-lines {
          position: absolute;
          bottom: 68px;
          left: 0;
          right: 0;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 28px,
            rgba(255, 200, 0, 0.45) 28px,
            rgba(255, 200, 0, 0.45) 56px
          );
        }
        .sidewalk-bottom {
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          height: 8px;
          background: #252538;
        }
        .curb {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: #12121f;
        }

        /* ── Street lamps ── */
        .lamp {
          position: absolute;
          bottom: 110px;
          width: 2px;
          height: 40px;
          background: #444;
          z-index: 3;
        }
        .lamp::before {
          content: "";
          position: absolute;
          top: -3px;
          left: -4px;
          width: 10px;
          height: 5px;
          background: #666;
          border-radius: 2px;
        }
        .lamp::after {
          content: "";
          position: absolute;
          top: -8px;
          left: -16px;
          width: 34px;
          height: 50px;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at 50% 20%,
            rgba(255, 230, 150, 0.12) 0%,
            transparent 70%
          );
          pointer-events: none;
        }

        /* ── Trees ── */
        .tree-el {
          position: absolute;
          bottom: 110px;
          width: 4px;
          height: 18px;
          background: #2a1e14;
          z-index: 3;
        }
        .tree-el::before {
          content: "";
          position: absolute;
          top: -14px;
          left: -8px;
          width: 20px;
          height: 18px;
          border-radius: 50% 50% 40% 40%;
          background: radial-gradient(ellipse at 50% 60%, #2a6b1c, #18440e);
        }

        /* ── Parked car ── */
        .parked-car {
          position: absolute;
          bottom: 52px;
          width: 36px;
          height: 16px;
          background: #3a4868;
          border-radius: 3px 3px 1px 1px;
          z-index: 3;
        }
        .parked-car::before {
          content: "";
          position: absolute;
          top: -6px;
          left: 6px;
          right: 6px;
          height: 8px;
          background: #3a4868;
          border-radius: 3px 3px 0 0;
        }
        .parked-car::after {
          content: "";
          position: absolute;
          bottom: -3px;
          left: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #111;
          box-shadow: 20px 0 0 0 #111;
        }

        /* ═══ NADRO TRUCK ═══ */
        .truck {
          position: absolute;
          bottom: 44px;
          width: 100px;
          height: 42px;
          z-index: 5;
          animation:
            truckArrive 5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards,
            truckIdle 3s ease-in-out 5s infinite alternate;
        }

        .truck__cargo {
          position: absolute;
          right: 0;
          bottom: 6px;
          width: 58px;
          height: 36px;
          background: #fff;
          border-radius: 2px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }
        .truck__cargo-inner {
          position: absolute;
          inset: 2px;
          background: #4d8b31;
          border-radius: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .truck__brand {
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .truck__cabin {
          position: absolute;
          left: 0;
          bottom: 6px;
          width: 32px;
          height: 28px;
          background: linear-gradient(135deg, #2e7d32, #256b2a);
          border-radius: 6px 2px 2px 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        }
        .truck__windshield {
          position: absolute;
          top: 4px;
          left: 3px;
          width: 14px;
          height: 14px;
          background: linear-gradient(
            135deg,
            rgba(135, 206, 235, 0.45),
            rgba(135, 206, 235, 0.25)
          );
          border-radius: 3px 1px 1px 1px;
        }

        .truck__wheel {
          position: absolute;
          bottom: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, #333 40%, #111 60%);
          border: 1.5px solid #444;
        }
        .truck__wheel--rear {
          right: 8px;
        }
        .truck__wheel--front {
          left: 8px;
        }

        .truck__headlight {
          position: absolute;
          bottom: 10px;
          left: -8px;
          width: 16px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(
            ellipse,
            rgba(255, 240, 120, 0.45) 0%,
            transparent 70%
          );
          animation: headlightPulse 2.5s ease-in-out infinite alternate;
        }

        /* ═══ KEYFRAMES ═══ */
        @keyframes twinkle {
          0% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes drift {
          from {
            transform: translateX(-160px);
          }
          to {
            transform: translateX(calc(100vw + 160px));
          }
        }
        @keyframes windowFlicker {
          0% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            opacity: 0.72;
          }
        }
        @keyframes truckArrive {
          0% {
            right: -120px;
          }
          65% {
            right: calc(22% + 10px);
          }
          80% {
            right: calc(22% - 2px);
          }
          100% {
            right: 22%;
          }
        }
        @keyframes truckIdle {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-0.5px);
          }
        }
        @keyframes headlightPulse {
          0% {
            opacity: 0.35;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
