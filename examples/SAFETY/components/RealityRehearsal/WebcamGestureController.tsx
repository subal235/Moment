"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface WebcamGestureControllerProps {
  onMoveChange?: (moveL: "idle" | "forward" | "back", moveLat: "idle" | "strafe_left" | "strafe_right") => void;
}

export function WebcamGestureController({ onMoveChange }: WebcamGestureControllerProps) {
  const [isActive, setIsActive] = useState(false);
  const [activeGesture, setActiveGesture] = useState<"IDLE" | "FORWARD" | "BACK" | "LEFT" | "RIGHT">("IDLE");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Real-time Virtual Joystick Reticle Coordinate (-1 to +1)
  const [stickPos, setStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const currentKeyRef = useRef<string | null>(null);

  // Dispatch synthetic keyboard events so the whole simulator moves in real-time
  const dispatchKey = useCallback((key: "w" | "s" | "a" | "d" | null) => {
    if (currentKeyRef.current === key) return;

    // Release old key
    if (currentKeyRef.current) {
      const oldKey = currentKeyRef.current;
      window.dispatchEvent(new KeyboardEvent("keyup", { key: oldKey, code: `Key${oldKey.toUpperCase()}`, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: oldKey.toUpperCase(), code: `Key${oldKey.toUpperCase()}`, bubbles: true }));
    }

    currentKeyRef.current = key;

    // Press new key
    if (key) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, code: `Key${key.toUpperCase()}`, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: key.toUpperCase(), code: `Key${key.toUpperCase()}`, bubbles: true }));
    }

    // Direct callback
    if (onMoveChange) {
      let moveL: "idle" | "forward" | "back" = "idle";
      let moveLat: "idle" | "strafe_left" | "strafe_right" = "idle";

      if (key === "w") moveL = "forward";
      if (key === "s") moveL = "back";
      if (key === "a") moveLat = "strafe_left";
      if (key === "d") moveLat = "strafe_right";

      onMoveChange(moveL, moveLat);
    }
  }, [onMoveChange]);

  const updateFromCoordinates = useCallback((normX: number, normY: number) => {
    // Clamp to circle radius 1.0
    const dist = Math.sqrt(normX * normX + normY * normY);
    let clampedX = normX;
    let clampedY = normY;
    if (dist > 1) {
      clampedX = normX / dist;
      clampedY = normY / dist;
    }

    setStickPos({ x: clampedX, y: clampedY });

    const deadzone = 0.22;
    if (Math.abs(clampedX) > Math.abs(clampedY)) {
      if (clampedX < -deadzone) {
        setActiveGesture("LEFT");
        dispatchKey("a");
      } else if (clampedX > deadzone) {
        setActiveGesture("RIGHT");
        dispatchKey("d");
      } else {
        setActiveGesture("IDLE");
        dispatchKey(null);
      }
    } else {
      if (clampedY < -deadzone) {
        setActiveGesture("FORWARD");
        dispatchKey("w");
      } else if (clampedY > deadzone) {
        setActiveGesture("BACK");
        dispatchKey("s");
      } else {
        setActiveGesture("IDLE");
        dispatchKey(null);
      }
    }
  }, [dispatchKey]);

  const startCamera = async () => {
    setPermissionError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError("Camera API unavailable. Ensure you are on https:// or localhost, or use the interactive joystick below.");
      return;
    }

    let stream: MediaStream | null = null;

    // Strategy 1: Ideal dimensions without rigid facingMode constraints
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch (e1) {
      console.warn("Primary camera constraint failed, trying basic fallback...", e1);
      // Strategy 2: Absolute baseline video: true (works on all Windows/USB cams)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (e2: any) {
        console.error("Camera access error:", e2);
        let msg = e2.message || "Camera access denied.";
        if (e2.name === "NotAllowedError" || e2.name === "PermissionDeniedError") {
          msg = "Camera permission denied. Enable camera access in browser / Windows Privacy Settings, or use the draggable joystick nub below.";
        } else if (e2.name === "NotFoundError" || e2.name === "DevicesNotFoundError") {
          msg = "No webcam detected. You can steer using the interactive 2D joystick nub or WASD keys.";
        } else if (e2.name === "NotReadableError" || e2.name === "TrackStartError") {
          msg = "Webcam is already in use by another app (e.g. Teams/Zoom/OBS). Close other apps or use the 2D joystick.";
        }
        setPermissionError(msg);
        setIsActive(false);
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    dispatchKey(null);
    setActiveGesture("IDLE");
    setStickPos({ x: 0, y: 0 });
    setIsActive(false);
  };

  // Ensure video element plays stream cleanly once when mounted
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (isActive && video && stream) {
      if (video.srcObject !== stream) {
        video.muted = true;
        video.srcObject = stream;
        video.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("Video playback notice:", err);
          }
        });
      }
    }
  }, [isActive]);

  // Real-Time Optical Motion & Hand Position Processing Loop
  useEffect(() => {
    if (!isActive || isDraggingJoystick) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw mirrored video frame into analysis canvas
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -w, 0, w, h);
      ctx.restore();

      const currentFrame = ctx.getImageData(0, 0, w, h);
      const data = currentFrame.data;
      const prevData = prevFrameDataRef.current;

      let motionSumX = 0;
      let motionSumY = 0;
      let motionCount = 0;

      if (prevData) {
        for (let y = 0; y < h; y += 4) {
          for (let x = 0; x < w; x += 4) {
            const idx = (y * w + x) * 4;
            const diff =
              Math.abs(data[idx] - prevData[idx]) +
              Math.abs(data[idx + 1] - prevData[idx + 1]) +
              Math.abs(data[idx + 2] - prevData[idx + 2]);

            if (diff > 40) {
              motionSumX += x;
              motionSumY += y;
              motionCount++;
            }
          }
        }
      }

      prevFrameDataRef.current = new Uint8ClampedArray(data);

      const thresholdPixels = 35;
      if (motionCount > thresholdPixels) {
        const centroidX = motionSumX / motionCount;
        const centroidY = motionSumY / motionCount;

        const normX = (centroidX / w) * 2 - 1;
        const normY = (centroidY / h) * 2 - 1;

        updateFromCoordinates(normX, normY);
      } else {
        // Return smoothly toward center when no movement
        setStickPos((prev) => ({
          x: Math.abs(prev.x) < 0.05 ? 0 : prev.x * 0.7,
          y: Math.abs(prev.y) < 0.05 ? 0 : prev.y * 0.7,
        }));
        if (Math.abs(stickPos.x) < 0.1 && Math.abs(stickPos.y) < 0.1) {
          setActiveGesture("IDLE");
          dispatchKey(null);
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, isDraggingJoystick, updateFromCoordinates, dispatchKey, stickPos.x, stickPos.y]);

  // Touch / Mouse Drag Joystick Handler
  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingJoystick || !joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    const normX = (e.clientX - centerX) / radius;
    const normY = (e.clientY - centerY) / radius;

    updateFromCoordinates(normX, normY);
  };

  const handleJoystickPointerUp = () => {
    setIsDraggingJoystick(false);
    setStickPos({ x: 0, y: 0 });
    setActiveGesture("IDLE");
    dispatchKey(null);
  };

  return (
    <div className="p-2.5 bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-700/80 text-xs space-y-2 max-w-[240px] shadow-2xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-emerald-400 animate-pulse" : "bg-cyan-400 animate-pulse"}`} />
          <span className="font-bold text-[11px] text-zinc-100 truncate flex items-center gap-1">
            <span>🕹️</span> Hand Gesture &amp; Joystick
          </span>
        </div>

        <button
          type="button"
          onClick={isActive ? stopCamera : startCamera}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 ${
            isActive
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
          }`}
        >
          <span>{isActive ? "⏹ Stop Cam" : "📷 Start Cam"}</span>
        </button>
      </div>

      {permissionError && (
        <div className="p-2 rounded-xl bg-rose-950 border border-rose-800 text-[10px] text-rose-300">
          {permissionError}
        </div>
      )}

      {/* Main Joystick + Camera Overlay Viewport */}
      <div 
        ref={joystickContainerRef}
        onPointerDown={(e) => {
          setIsDraggingJoystick(true);
          handleJoystickPointerMove(e);
        }}
        onPointerMove={handleJoystickPointerMove}
        onPointerUp={handleJoystickPointerUp}
        onPointerCancel={handleJoystickPointerUp}
        className="relative rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-950 aspect-[4/3] w-full shadow-inner cursor-grab active:cursor-grabbing select-none"
      >
        {/* Visible Mirrored Video if Camera Active */}
        {isActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover transform -scale-x-100 opacity-85 pointer-events-none"
          />
        ) : (
          /* Standby Ambient Grid when camera is off */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-3 text-center">
            <div className="text-[10px] text-zinc-400 mb-1">Interactive 2D Joystick</div>
            <div className="text-[8.5px] text-zinc-500">Click &amp; drag nub or start camera to steer</div>
          </div>
        )}

        {/* Offscreen Analysis Canvas */}
        <canvas
          ref={canvasRef}
          width={160}
          height={120}
          className="hidden"
        />

        {/* Real-Time 2D Glowing Joystick Gimbal Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Outer Gimbal Ring */}
          <div className="w-24 h-24 rounded-full border border-cyan-500/30 bg-black/30 backdrop-blur-[2px] relative flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            {/* Crosshair Lines */}
            <div className="absolute inset-x-0 h-px bg-cyan-500/20" />
            <div className="absolute inset-y-0 w-px bg-cyan-500/20" />

            {/* Directional Labels */}
            <span className="absolute top-1 text-[8px] font-mono font-bold text-white/50">W</span>
            <span className="absolute bottom-1 text-[8px] font-mono font-bold text-white/50">S</span>
            <span className="absolute left-1 text-[8px] font-mono font-bold text-white/50">A</span>
            <span className="absolute right-1 text-[8px] font-mono font-bold text-white/50">D</span>

            {/* Dynamic Joystick Knob / Thumbstick */}
            <div
              style={{
                transform: `translate(${stickPos.x * 32}px, ${stickPos.y * 32}px)`,
                transition: isDraggingJoystick ? "none" : "transform 75ms ease-out",
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-shadow shadow-lg ${
                activeGesture !== "IDLE"
                  ? "bg-emerald-500 border-emerald-300 text-black shadow-[0_0_16px_rgba(52,211,153,0.9)] scale-110"
                  : "bg-cyan-500/80 border-cyan-300 text-white shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              }`}
            >
              <span className="text-[11px] font-black">
                {activeGesture === "FORWARD" ? "↑" : activeGesture === "BACK" ? "↓" : activeGesture === "LEFT" ? "←" : activeGesture === "RIGHT" ? "→" : "•"}
              </span>
            </div>
          </div>
        </div>

        {/* Directional Corner Indicators */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5">
          <div className="flex justify-between items-start">
            <span className="text-[8px] font-mono text-zinc-400 bg-black/60 px-1 py-0.5 rounded border border-white/10">
              X: {Math.round(stickPos.x * 100)}%
            </span>
            <span className="text-[8px] font-mono text-zinc-400 bg-black/60 px-1 py-0.5 rounded border border-white/10">
              Y: {Math.round(stickPos.y * 100)}%
            </span>
          </div>

          {/* Active Gesture Telemetry Badge */}
          <div className="flex justify-between items-end">
            <div className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8.5px] font-mono flex items-center gap-1 border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${activeGesture !== "IDLE" ? "bg-emerald-400 animate-ping" : "bg-cyan-400"}`} />
              <span className="text-emerald-400 font-bold">{activeGesture}</span>
            </div>

            <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-800">
              {isDraggingJoystick ? "TOUCH JOYSTICK" : isActive ? "HAND TRACKING" : "DRAGGABLE"}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[9px] text-zinc-400 text-center leading-tight">
        Move your hand in front of camera or <strong>drag joystick nub</strong> to steer in real time.
      </p>
    </div>
  );
}
