"use client";

import React, { useState, useEffect, useMemo } from "react";

export function HeroSunburst() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate deterministic rounded coordinates for rays and concentric rings
  const { rays, rings } = useMemo(() => {
    const rayList = [];
    const totalRays = 136;

    const cx = 700;
    const cy = 400;
    const innerRx = 380;
    const innerRy = 200;
    const outerRx = 750;
    const outerRy = 430;

    const round2 = (num: number) => Math.round(num * 100) / 100;

    for (let i = 0; i < totalRays; i++) {
      const angle = (i * 2 * Math.PI) / totalRays;

      const x1 = round2(cx + Math.cos(angle) * innerRx);
      const y1 = round2(cy + Math.sin(angle) * innerRy);
      const x2 = round2(cx + Math.cos(angle) * outerRx);
      const y2 = round2(cy + Math.sin(angle) * outerRy);

      const isMajor = i % 4 === 0;
      const isSemiMajor = i % 2 === 0;
      const strokeWidth = isMajor ? 1.0 : isSemiMajor ? 0.75 : 0.5;
      const opacity = isMajor ? 0.5 : isSemiMajor ? 0.35 : 0.2;

      rayList.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        strokeWidth,
        opacity,
      });
    }

    const ringList = [
      { rx: 460, ry: 250, opacity: 0.15 },
      { rx: 560, ry: 310, opacity: 0.18 },
      { rx: 660, ry: 370, opacity: 0.12 },
    ];

    return { rays: rayList, rings: ringList };
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 pointer-events-none -z-10" />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center -z-10">
      <svg
        viewBox="0 0 1400 800"
        className="w-full max-w-[1500px] h-[550px] sm:h-[720px] lg:h-[820px] select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="momentFade" cx="50%" cy="50%" r="50%">
            <stop offset="35%" stopColor="#000000" stopOpacity="0" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#000000" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <mask id="momentSunburstMask">
            <rect width="1400" height="800" fill="url(#momentFade)" />
          </mask>
        </defs>

        <g mask="url(#momentSunburstMask)" stroke="#52525B">
          {/* Subtle concentric elliptical rings */}
          {rings.map((ring, idx) => (
            <ellipse
              key={`ring-${idx}`}
              cx="700"
              cy="400"
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke="#71717A"
              strokeWidth="0.75"
              strokeOpacity={ring.opacity}
            />
          ))}

          {/* Radiating Rays */}
          {rays.map((ray) => (
            <line
              key={`ray-${ray.id}`}
              x1={ray.x1}
              y1={ray.y1}
              x2={ray.x2}
              y2={ray.y2}
              strokeWidth={ray.strokeWidth}
              strokeOpacity={ray.opacity}
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
