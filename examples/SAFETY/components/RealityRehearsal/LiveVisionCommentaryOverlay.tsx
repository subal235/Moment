"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface VisionCommentaryResult {
  headline: string;
  commentary: string;
  safetyScore: number;
  hazardDetected: boolean;
  spokenBrief: string;
}

export function LiveVisionCommentaryOverlay({
  activeScenarioName = "Hospital Emergency Response & Capacity",
  activeScenarioDescription = "Interactive hospital emergency decision environment",
  isStreamConnected = false,
}: {
  activeScenarioName?: string;
  activeScenarioDescription?: string;
  isStreamConnected?: boolean;
}) {
  const [isLiveLoopActive, setIsLiveLoopActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [lastCommentary, setLastCommentary] = useState<VisionCommentaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Capture current video frame as base64 JPEG from the WebRTC video element
  const captureCurrentFrame = useCallback((): string | null => {
    if (typeof document === "undefined") return null;
    const video = document.querySelector("video");
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    try {
      const canvas = document.createElement("canvas");
      const maxDim = 512;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch (e) {
      console.warn("Canvas capture notice:", e);
      return null;
    }
  }, []);

  const playCommentaryAudio = async (text: string) => {
    if (!text) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(true);

      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "onyx" }),
      });

      if (!res.ok) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 1.05;
          u.onend = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(u);
          return;
        }
        throw new Error("TTS fetch failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      await audio.play();
    } catch (err) {
      console.warn("Audio playback notice:", err);
      setIsPlayingAudio(false);
    }
  };

  const analyzeFrame = useCallback(async (autoPlaySound = true) => {
    setIsAnalyzing(true);
    setError(null);

    const frameBase64 = captureCurrentFrame();

    try {
      const res = await fetch("/api/ai/vision-commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: frameBase64,
          scenarioName: activeScenarioName,
          scenarioDescription: activeScenarioDescription,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.commentary) {
        setLastCommentary(data.commentary);
        if (autoPlaySound && data.commentary.spokenBrief) {
          playCommentaryAudio(data.commentary.spokenBrief);
        }
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze video frame");
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureCurrentFrame, activeScenarioName]);

  // Periodic Commentary Loop
  useEffect(() => {
    if (!isLiveLoopActive || !isStreamConnected) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Run first analysis immediately
    analyzeFrame(true);

    // Then repeat every 10 seconds
    timerRef.current = setInterval(() => {
      analyzeFrame(true);
    }, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLiveLoopActive, isStreamConnected, analyzeFrame]);

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-zinc-100 flex items-center gap-1.5">
              <span>👁️</span> AI Vision &amp; Radio Commentary
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 border-l border-zinc-700 pl-3 hidden sm:inline">
            GPT-4o Vision + Onyx TTS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Snap & Analyze Button */}
          <button
            type="button"
            onClick={() => analyzeFrame(true)}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Frame...</span>
              </>
            ) : (
              <>
                <span>📸</span>
                <span>Analyze Frame</span>
              </>
            )}
          </button>

          {/* Live Continuous Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveLoopActive((p) => !p)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isLiveLoopActive
                ? "bg-cyan-500 text-zinc-950 border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
            }`}
          >
            <span className="text-xs">{isLiveLoopActive ? "⏹" : "▶"}</span>
            <span>{isLiveLoopActive ? "Live Loop ON (10s)" : "Start Live Voice Commentary"}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-[11px] text-rose-300">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Broadcast Ticker Bar */}
      {lastCommentary && (
        <div className="p-4 bg-zinc-900/95 rounded-2xl border border-zinc-800/90 shadow-lg space-y-2 text-zinc-200">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                lastCommentary.hazardDetected
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {lastCommentary.hazardDetected ? "⚠ HAZARD DETECTED" : "✓ CORRIDOR CLEAR"}
              </span>
              <span className="font-bold text-white">{lastCommentary.headline}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-400">
                Safety Index: <strong className="text-emerald-400">{lastCommentary.safetyScore}%</strong>
              </span>

              <button
                type="button"
                onClick={() => playCommentaryAudio(lastCommentary.spokenBrief)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPlayingAudio
                    ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                    : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
                }`}
              >
                <span>{isPlayingAudio ? "⏹ Speaking" : "🔊 Replay"}</span>
                {isPlayingAudio && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-2.5 bg-cyan-400 animate-pulse" />
                    <span className="w-1 h-3.5 bg-cyan-300 animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-cyan-500 animate-pulse delay-150" />
                  </span>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {lastCommentary.commentary}
          </p>

          <div className="pt-1 text-[11px] font-mono text-zinc-400 flex items-center gap-2 border-t border-zinc-800">
            <span className="text-cyan-400">📻 Radio Dispatch:</span>
            <span className="text-zinc-200 truncate">&ldquo;{lastCommentary.spokenBrief}&rdquo;</span>
          </div>
        </div>
      )}
    </div>
  );
}
