"use client";

import React, { useState } from "react";
import {
  LingbotWorld2MainVideoView,
  LingbotWorld2Provider,
  useLingbotWorld2,
} from "@reactor-models/lingbot-world-2";
import { Header } from "@/components/Header";
import { SnapClip } from "@/components/SnapClip";
import { LingbotWorldController } from "@/components/lingbot-world-2/LingbotWorldController";
import { RealityRehearsalEngine } from "@/components/RealityRehearsal/RealityRehearsalEngine";
import { HeroSunburst } from "@/components/HeroSunburst";
import { LiveVisionCommentaryOverlay } from "@/components/RealityRehearsal/LiveVisionCommentaryOverlay";
import { WebcamGestureController } from "@/components/RealityRehearsal/WebcamGestureController";

const API_URL =
  process.env.NEXT_PUBLIC_COORDINATOR_URL ?? "https://api.reactor.inc";

async function fetchToken(): Promise<string> {
  const r = await fetch("/api/reactor/token");
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Token fetch failed (${r.status})`);
  }
  const { jwt } = (await r.json()) as { jwt: string };
  return jwt;
}

function EmbodiedSimulatorSection() {
  const { sidebar, controls } = LingbotWorldController({});
  const { status, connect, disconnect } = useLingbotWorld2();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const [isAutoRetrying, setIsAutoRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleConnect = async (isRetry = false) => {
    if (!isRetry) {
      setConnectError(null);
      setRetryCount(0);
    }
    
    try {
      await connect();
      setIsAutoRetrying(false);
      setConnectError(null);
    } catch (err: any) {
      console.warn("Connect notice:", err);
      if (err?.message?.includes("402") || err?.message?.includes("credits")) {
        setIsAutoRetrying(false);
        setConnectError("Reactor API Credits Depleted (402). Please add credits to your account at https://reactor.inc or update REACTOR_API_KEY in your .env file.");
      } else if (err?.message?.includes("429") || err?.message?.includes("capacity")) {
        setIsAutoRetrying(true);
        setRetryCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount <= 6) {
            setConnectError(`Reactor Cloud GPUs are at peak capacity (429). Auto-retrying queue connection (Attempt ${nextCount}/6 in 5s)...`);
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => {
              handleConnect(true);
            }, 5000);
          } else {
            setIsAutoRetrying(false);
            setConnectError("Reactor GPU Cluster is currently at peak capacity. All cloud GPU worker servers are active. Please click 'Launch Stream' to retry.");
          }
          return nextCount;
        });
      } else {
        setIsAutoRetrying(false);
        setConnectError(err?.message || "Failed to establish 3D WebRTC stream.");
      }
    }
  };

  React.useEffect(() => {
    if (status === "ready") {
      setIsAutoRetrying(false);
      setConnectError(null);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    }
  }, [status]);

  React.useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!viewportRef.current) return;
    if (!document.fullscreenElement) {
      await viewportRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <section id="embodied-stream" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Embodied AI Perspective
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
              Hospital Emergency Response &amp; Capacity World Model
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500">
              Explore how patients, ambulances, hospitals, roads, and resources interact — and compare possible outcomes before making a real-world intervention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status !== "disconnected" && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3.5 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>{isFullscreen ? "🗗" : "⛶"}</span>
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}</span>
              </button>
            )}

            {status === "disconnected" ? (
              <button
                onClick={() => handleConnect()}
                className="px-5 py-2.5 rounded-lg bg-[#142820] text-white hover:bg-[#0E1E18] text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                Connect 3D AMR Stream →
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Stream Connected (60 FPS)
                </span>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] min-h-[560px]">
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-zinc-100 bg-zinc-50/50 flex flex-col justify-between overflow-y-auto max-h-[640px]">
            <div className="space-y-4">
              <div className="text-xs text-zinc-600 font-medium leading-relaxed">
                Drive the AMR with WASD or mouse-look, trigger emergency obstacles, and record offload telemetry.
              </div>
              {sidebar}
            </div>
            <div className="pt-4 border-t border-zinc-200 mt-4">
              <SnapClip />
            </div>
          </div>

          <div ref={viewportRef} className="bg-zinc-950 flex flex-col justify-between min-h-[560px] relative">
            <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 p-4 sm:p-5">
              {status === "disconnected" ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl shadow-inner">
                    🏥
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-zinc-200">
                      Hospital ICU 4B Corridor · AMR Perspective
                    </h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Click <strong>&quot;Connect 3D AMR Stream&quot;</strong> in the top right to start the live WebRTC world model feed, drive with WASD, and trigger real-time hazard injections.
                    </p>
                  </div>

                  {connectError && (
                    <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-800 text-left text-xs text-amber-200 space-y-1 w-full shadow-lg">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <span>⚠️</span> <span>Reactor API Notice (402)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-200/90">
                        {connectError}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleConnect()}
                    className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Launch 3D AMR Stream →
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[480px] lg:min-h-[620px] flex items-center justify-center bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group">
                  {/* Full Size 3D Simulation Stream */}
                  <LingbotWorld2MainVideoView className="w-full h-full min-h-[480px] lg:min-h-[620px] object-cover sm:object-contain" />

                  {/* Floating Overlay Controls: Top Left Fullscreen Button */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
                    >
                      <span>{isFullscreen ? "🗗" : "⛶"}</span>
                      <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                    </button>
                  </div>

                  {/* Floating Overlay: Live Mac Camera Gesture HUD PiP (Top Right) */}
                  <div className="absolute top-3 right-3 z-30 max-w-[210px] shadow-2xl backdrop-blur-md rounded-2xl">
                    <WebcamGestureController />
                  </div>
                </div>
              )}
            </div>

            {/* Live AI Vision Commentary & Radio Dispatch */}
            {status !== "disconnected" && (
              <div className="px-4 pb-2">
                <LiveVisionCommentaryOverlay
                  activeScenarioName="Hospital Emergency Response &amp; Capacity World Model"
                  activeScenarioDescription="Interactive emergency response environment simulating patient arrivals, hospital capacity, ambulance allocation, road congestion, and staff constraints."
                  isStreamConnected={status === "ready"}
                />
              </div>
            )}

            <div className="p-4 bg-zinc-900/95 border-t border-zinc-800 text-white text-xs">
              {controls}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LingbotWorld2App() {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const handleTriggerEmergency = () => {
    setIsEmergencyActive(true);
    const el = document.getElementById("cockpit");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleReset = () => {
    setIsEmergencyActive(false);
  };

  return (
    <LingbotWorld2Provider apiUrl={API_URL} getJwt={fetchToken}>
      <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
        
        {/* 1. MOMENT NAVBAR */}
        <Header
          onTriggerEmergency={handleTriggerEmergency}
          onReset={handleReset}
          isEmergencyActive={isEmergencyActive}
        />

        {/* 2. HERO SECTION — EXACT MOMENT AESTHETICS */}
        <section className="relative min-h-[82vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-6 pb-16">
          {/* Exact Radiating Sunburst Line Pattern */}
          <HeroSunburst />

          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-7 relative z-10 my-auto">
            {/* Main Headline (Moment exact typography and structure) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-semibold tracking-[-0.035em] text-[#111827] leading-[1.08] max-w-4xl mx-auto">
              An AI World Model for Emergency Decision-Making
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto font-normal leading-relaxed">
              Explore how patients, ambulances, hospitals, roads, and resources interact — and rehearse possible futures before making real-world interventions.
            </p>

            {/* Dark Green Pill CTA Button (Moment Exact Style) */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleTriggerEmergency}
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-lg bg-[#142820] hover:bg-[#0E1E18] text-white text-[14.5px] font-medium shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
              >
                <span>Book a demo</span>
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* 4. REALITY REHEARSAL SIMULATION COCKPIT */}
        <RealityRehearsalEngine
          isEmergencyActive={isEmergencyActive}
          onTriggerEmergency={handleTriggerEmergency}
          onReset={handleReset}
        />

        {/* 5. "THE PROBLEM" EDITORIAL FEATURE SECTION */}
        <section id="problem" className="py-24 border-t border-zinc-100 bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                The Interconnected Healthcare Problem
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-950">
                During a mass casualty crisis, every decision alters the wider system.
              </h2>
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed">
                Patient arrivals affect hospital capacity; hospital capacity affects patient allocation; ambulance allocation affects travel times; road congestion creates offload stalls; and ICU limits constrain triage survivability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center text-sm font-bold">
                  01
                </div>
                <h4 className="text-lg font-bold text-zinc-950">Dashboards Show the Past</h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Dashboards mainly describe current bed counts and queue lengths as they exist right now, but cannot forecast cascading bottlenecks.
                </p>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center text-sm font-bold">
                  02
                </div>
                <h4 className="text-lg font-bold text-zinc-950">Maps Optimize Single Routes</h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Navigation engines find the fastest highway for one vehicle without accounting for regional triage saturation or hospital bed collapse.
                </p>
              </div>

              <div className="p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3 ring-1 ring-emerald-600/30">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold">
                  03
                </div>
                <h4 className="text-lg font-bold text-zinc-950">Reality Rehearsal Rehearses Futures</h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Simulates multi-agent interventions, forecasts consequence propagation chains, and identifies the highest-survival intervention.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                World Model Propagation Chain
              </span>
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-zinc-800">
                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200">100 Patient Arrivals</span>
                <span className="text-zinc-400">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200">Hospital Capacity Drops</span>
                <span className="text-zinc-400">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200">Patient Allocation Changes</span>
                <span className="text-zinc-400">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200">Ambulance Routes Shift</span>
                <span className="text-zinc-400">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200">Travel Times Alter</span>
                <span className="text-zinc-400">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">Hospital Loads Saturate</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PRODUCT LOOP SECTION */}
        <section id="decision-loop" className="py-24 border-t border-zinc-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Continuous Decision Lifecycle
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-950">
                Change the world → Simulate → Compare futures → Play &amp; Adapt
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-zinc-200 space-y-2.5">
                <span className="text-xs font-bold text-zinc-400 font-mono">STEP 01</span>
                <h4 className="text-base font-bold text-zinc-950">Trigger Emergency</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Introduce a 100-casualty mass accident into the synthetic city grid with varying triage severities.
                </p>
              </div>

              <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-zinc-200 space-y-2.5">
                <span className="text-xs font-bold text-zinc-400 font-mono">STEP 02</span>
                <h4 className="text-base font-bold text-zinc-950">Detect Bottlenecks</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Discrete-event simulation flags projected ICU saturation and offload ramp chokepoints before they happen.
                </p>
              </div>

              <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-zinc-200 space-y-2.5">
                <span className="text-xs font-bold text-zinc-400 font-mono">STEP 03</span>
                <h4 className="text-base font-bold text-zinc-950">Explore &amp; Score Futures</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Simulate Scenarios A, B, C, and D across transparent weighted stress metrics (Overload, Wait, Queue, Imbalance).
                </p>
              </div>

              <div className="p-6 bg-[#FAFAFA] rounded-2xl border border-zinc-200 space-y-2.5">
                <span className="text-xs font-bold text-zinc-400 font-mono">STEP 04</span>
                <h4 className="text-base font-bold text-zinc-950">Change the World</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Inject unexpected constraints (e.g. Hospital B loses 30% power, +50 casualties) and watch the optimal future adapt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. EMBODIED SIMULATOR STREAM */}
        <EmbodiedSimulatorSection />

        {/* 8. FOOTER */}
        <footer className="py-12 border-t border-zinc-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-zinc-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 18L10 6H7L1 18H4Z" />
                <path d="M14 18L20 6H17L11 18H14Z" />
              </svg>
              <span className="font-semibold text-zinc-950">Moment</span>
              <span>· Reality Rehearsal AI World Model for Emergency Decision-Making</span>
            </div>

            <div className="flex items-center gap-6">
              <a href="#cockpit" className="hover:text-zinc-950 transition-colors">
                Simulation Cockpit
              </a>
              <a href="#futures-comparison" className="hover:text-zinc-950 transition-colors">
                Scenarios
              </a>
              <a href="#problem" className="hover:text-zinc-950 transition-colors">
                The Problem
              </a>
              <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-950 transition-colors">
                Datasets
              </a>
            </div>
          </div>
        </footer>

      </div>
    </LingbotWorld2Provider>
  );
}
