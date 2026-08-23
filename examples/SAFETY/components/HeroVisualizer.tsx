"use client";

import React, { useEffect, useRef, useState } from "react";
import { LingbotWorld2MainVideoView } from "@reactor-models/lingbot-world-2";

export function HeroVisualizer({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [telemetry, setTelemetry] = useState({
    fps: 59.8,
    lat: 16.4,
    vel: 1.2,
    yaw: -0.4,
    hazardsDetected: 0,
    scanAngle: 0,
  });

  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Generate 3D point cloud field representing a corridor with AMR robot trajectory
    const numPoints = 160;
    const points: Array<{ x: number; y: number; z: number; baseColor: string; size: number }> = [];

    // Left wall
    for (let i = 0; i < 40; i++) {
      points.push({
        x: -120 + (Math.sin(i) * 5),
        y: -60 + (i % 8) * 20,
        z: 40 + Math.floor(i / 8) * 60,
        baseColor: "#4338CA",
        size: 1.5,
      });
    }

    // Right wall
    for (let i = 0; i < 40; i++) {
      points.push({
        x: 120 + (Math.cos(i) * 5),
        y: -60 + (i % 8) * 20,
        z: 40 + Math.floor(i / 8) * 60,
        baseColor: "#4338CA",
        size: 1.5,
      });
    }

    // Floor navigation lane & waypoints
    for (let i = 0; i < 50; i++) {
      const z = 20 + i * 8;
      points.push({
        x: Math.sin(i * 0.15) * 25,
        y: 70,
        z: z,
        baseColor: "#00E599",
        size: 2.0,
      });
    }

    // Dynamic obstacle cluster
    for (let i = 0; i < 30; i++) {
      points.push({
        x: 35 + (i % 5) * 8,
        y: 20 + Math.floor(i / 5) * 8,
        z: 180 + ((i * 7) % 20),
        baseColor: "#EF4444",
        size: 2.2,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mousePosRef.current.targetX = x * 0.35;
      mousePosRef.current.targetY = y * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      time += 0.03;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 500);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 320);

      // Smooth mouse lerp
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 + 10;
      const fov = 260;

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(17, 17, 17, 0.06)";
      ctx.lineWidth = 1;
      for (let x = -200; x <= 200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(cx + x * 0.2, cy - 80);
        ctx.lineTo(cx + x * 1.4, cy + 120);
        ctx.stroke();
      }

      // Animated LiDAR Laser Scanline Sweep
      const scanZ = (time * 120) % 400;
      const scanY = cy + Math.sin(time * 2) * 60;

      // Render 3D Point Cloud with animated camera tilt and forward motion
      points.forEach((pt, idx) => {
        // Forward flow animation
        let curZ = (pt.z - time * 35) % 360;
        if (curZ < 10) curZ += 360;

        // Apply mouse tilt
        const rotY = mousePosRef.current.x + Math.sin(time * 0.5) * 0.05;
        const rotX = mousePosRef.current.y + 0.1;

        let px = pt.x * Math.cos(rotY) - curZ * Math.sin(rotY);
        let pz = pt.x * Math.sin(rotY) + curZ * Math.cos(rotY);
        let py = pt.y * Math.cos(rotX) - pz * Math.sin(rotX);
        pz = pt.y * Math.sin(rotX) + pz * Math.cos(rotX);

        if (pz <= 5) return;

        const scale = fov / (fov + pz);
        const sx = cx + px * scale;
        const sy = cy + py * scale;

        // Distance attenuation
        const alpha = Math.max(0.15, Math.min(0.9, 1 - pz / 420));
        const distFromScan = Math.abs(curZ - scanZ);
        const isScanned = distFromScan < 30;

        ctx.fillStyle = isScanned
          ? "#111111"
          : pt.baseColor === "#EF4444"
          ? `rgba(239, 68, 68, ${alpha})`
          : pt.baseColor === "#00E599"
          ? `rgba(0, 168, 107, ${alpha})`
          : `rgba(67, 56, 202, ${alpha * 0.8})`;

        const r = isScanned ? pt.size * scale * 1.8 : pt.size * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.6, r), 0, Math.PI * 2);
        ctx.fill();

        // Connect waypoint path
        if (pt.baseColor === "#00E599" && idx > 0 && points[idx - 1]?.baseColor === "#00E599") {
          ctx.strokeStyle = `rgba(0, 168, 107, ${alpha * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw 3D Dynamic Bounding Box around obstacle (Pedestrian / Cart)
      const boxZ = 180 - ((time * 35) % 180);
      if (boxZ > 20) {
        const bScale = fov / (fov + boxZ);
        const bx = cx + 45 * bScale;
        const by = cy + 30 * bScale;
        const bw = 40 * bScale;
        const bh = 50 * bScale;

        ctx.strokeStyle = "rgba(220, 38, 38, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);

        // Bounding box corner ticks
        ctx.fillStyle = "#DC2626";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`OBSTACLE: ${(boxZ * 0.02).toFixed(1)}m`, bx - bw / 2, by - bh / 2 - 4);
      }

      // Draw LiDAR Radar Sweep Arc in Top-Right
      const rx = w - 45;
      const ry = 45;
      const rRadius = 26;
      ctx.strokeStyle = "rgba(17, 17, 17, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry, rRadius, 0, Math.PI * 2);
      ctx.stroke();

      const sweepAngle = (time * 3) % (Math.PI * 2);
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(sweepAngle) * rRadius, ry + Math.sin(sweepAngle) * rRadius);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    const intervalId = setInterval(() => {
      setTelemetry((prev) => ({
        fps: 59.4 + Math.random() * 0.8,
        lat: 15.8 + Math.random() * 1.5,
        vel: 1.18 + Math.random() * 0.05,
        yaw: -0.4 + (Math.sin(Date.now() / 1000) * 0.8),
        hazardsDetected: Math.random() > 0.3 ? 1 : 0,
        scanAngle: Math.floor((Date.now() / 20) % 360),
      }));
    }, 400);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] lg:h-[480px] bg-[#E5E4E0] border border-[#111111] overflow-hidden flex flex-col justify-between p-4 group">
      {/* Interactive Video / 3D Pointcloud Viewport */}
      <div className="relative flex-1 w-full bg-[#DCDAD5] border border-[#111111] overflow-hidden cursor-crosshair">
        <LingbotWorld2MainVideoView
          videoObjectFit="cover"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            backgroundColor: "#DCDAD5",
            filter: "contrast(1.05) grayscale(0.2)",
          }}
        />

        {/* Dynamic 3D Canvas LiDAR Engine */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Live HUD telemetry overlays */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-[#ECEBE8]/95 border border-[#111111] px-2.5 py-1 text-[9.5px] font-mono font-extrabold flex items-center gap-1.5 shadow-[1px_1px_0px_#111111]">
            <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
            <span className="text-[#111111] uppercase tracking-wider">
              {status === "ready" ? "● WEBRTC LIVE STREAM" : "PHYSICAL AI SIMULATION EMBED"}
            </span>
          </div>

          <div className="bg-white/90 border border-[#111111] px-2 py-0.5 text-[8.5px] font-mono text-[#333333] flex items-center gap-2">
            <span>HZ: <strong className="text-black">{telemetry.fps.toFixed(1)}</strong></span>
            <span>LAT: <strong className="text-black">{telemetry.lat.toFixed(0)}ms</strong></span>
            <span>VEL: <strong className="text-black">{telemetry.vel.toFixed(2)}m/s</strong></span>
          </div>
        </div>

        {/* Bottom Right Live Coordinates */}
        <div className="absolute bottom-2 right-2 bg-[#ECEBE8]/90 border border-[#111111] px-2 py-1 text-[9px] font-mono text-[#111111] flex items-center gap-2">
          <span>YAW: <strong>{telemetry.yaw.toFixed(2)}°</strong></span>
          <span>HAZARDS: <strong className={telemetry.hazardsDetected > 0 ? "text-red-600 font-bold" : "text-[#00A86B]"}>{telemetry.hazardsDetected} ACTIVE</strong></span>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-2 left-2 text-[8.5px] font-mono text-[#666666] opacity-0 group-hover:opacity-100 transition-opacity bg-[#ECEBE8]/80 px-1.5 py-0.5 border border-[#111111]/30">
          [ 3D LIDAR PARALLAX ACTIVE · HOVER TO TILT ]
        </div>
      </div>

      {/* Bottom OOJU-Style Annotation */}
      <div className="pt-3 flex flex-wrap items-center justify-between font-mono text-[10.5px] text-[#444444]">
        <div>
          <span className="font-bold text-[#111111]">p = policy execution</span> · <span>h = dynamic hazard injection</span>
          <div className="text-[#666666] text-[9.5px]">continuous testing engine · 10,000 verified hours</div>
        </div>
        <div className="text-right text-[#111111] font-extrabold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
          <span>icu-01 · corridor transit</span>
        </div>
      </div>
    </div>
  );
}
