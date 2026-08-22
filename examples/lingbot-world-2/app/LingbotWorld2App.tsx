"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LingbotWorld2MainVideoView,
  LingbotWorld2Provider,
  useLingbotWorld2,
} from "@reactor-models/lingbot-world-2";
import { Header } from "@/components/Header";
import { SnapClip } from "@/components/SnapClip";
import { LingbotWorldController } from "@/components/lingbot-world-2/LingbotWorldController";

const API_URL =
  process.env.NEXT_PUBLIC_COORDINATOR_URL ?? "https://api.reactor.inc";

async function fetchToken(): Promise<string> {
  const r = await fetch("/api/reactor/token");
  if (!r.ok) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Token fetch failed: ${r.status}`);
  }
  const { jwt } = (await r.json()) as { jwt: string };
  return jwt;
}

import { HeroVisualizer } from "@/components/HeroVisualizer";

function HeroPointCloudStream() {
  const { status } = useLingbotWorld2();
  return <HeroVisualizer status={status} />;
}

function SimulatorSection() {
  const { sidebar, controls } = LingbotWorldController({});
  const { status, connect, disconnect, reset } = useLingbotWorld2();

  return (
    <section id="simulator" className="border-t border-[#111111] bg-[#ECEBE8] text-[#111111]">
      {/* Section Header Bar */}
      <div className="border-b border-[#111111] bg-[#ECEBE8] px-6 py-4 flex flex-wrap items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold uppercase tracking-wider text-[#111111]">
            [ 03 / INTERACTIVE PHYSICAL AI SIMULATOR ]
          </span>
          <span className="text-[#666666] hidden sm:inline text-[11px]">
            Reactor LingBot World 2 • 60 FPS WebRTC
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === "disconnected" ? (
            <button
              onClick={() => connect()}
              className="px-4 py-1.5 bg-[#111111] text-white hover:bg-[#333] font-bold text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
            >
              CONNECT STREAM →
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#00A86B] font-bold">● CONNECTED</span>
              <button
                onClick={() => disconnect()}
                className="px-3 py-1 border border-[#111111] bg-white hover:bg-black/5 text-black font-bold text-[10px] cursor-pointer"
              >
                DISCONNECT
              </button>
              <button
                onClick={() => reset().catch(console.error)}
                className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 font-bold text-[10px] cursor-pointer"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Body */}
      <div className="flex flex-col lg:flex-row border-b border-[#111111]">
        {/* Left: Scenarios Sidebar */}
        <div className="lg:w-[380px] border-b lg:border-b-0 lg:border-r border-[#111111] p-5 space-y-4 bg-[#F2F1ED]">
          <div className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-[#111111] border-b border-[#111111] pb-2">
            PHYSICAL AI SCENARIO MATRIX
          </div>
          {sidebar}
          <SnapClip />
        </div>

        {/* Right: Main Viewport + Telemetry Controls */}
        <div className="flex-1 p-5 space-y-4 bg-[#ECEBE8]">
          <div className="relative bg-black border-2 border-[#111111] shadow-[4px_4px_0px_#111111] aspect-video overflow-hidden rounded-xs">
            <LingbotWorld2MainVideoView
              videoObjectFit="cover"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                backgroundColor: "#05070D",
              }}
            />
          </div>

          <div className="p-4 bg-white border-2 border-[#111111] shadow-[3px_3px_0px_#111111] text-[#111111] rounded-xs">
            {controls}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LingbotWorld2App() {
  return (
    <LingbotWorld2Provider apiUrl={API_URL} getJwt={fetchToken}>
      <div className="min-h-screen flex flex-col bg-[#ECEBE8] text-[#111111] font-sans selection:bg-[#111111] selection:text-white">
        
        {/* 1. LOOP HEADER */}
        <Header />

        {/* 2. HERO SECTION (SPLIT GRID) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#111111]">
          
          {/* Left Column: Visualizer Viewport */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#111111] p-6 lg:p-10 flex flex-col justify-center">
            <HeroPointCloudStream />
          </div>

          {/* Right Column: Hero Statement & CTAs */}
          <div className="p-6 lg:p-14 flex flex-col justify-center space-y-8">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] leading-[1.25] font-normal text-[#111111] tracking-tight">
              Data infrastructure that tests, breaks, and hardens physical AI models before real-world deployment.
            </h1>

            <div className="space-y-4">
              <div className="flex items-stretch gap-0 font-mono text-xs">
                <button
                  onClick={() => {
                    const el = document.getElementById("simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-3 bg-[#111111] text-white hover:bg-[#282828] font-bold tracking-tight cursor-pointer transition-colors border border-[#111111]"
                >
                  run stress test ↗
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById("simulator");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-3 bg-transparent hover:bg-black/5 text-[#111111] font-bold tracking-tight cursor-pointer transition-colors border border-l-0 border-[#111111]"
                >
                  book a pilot
                </button>
              </div>

              <p className="text-xs text-[#555555] leading-relaxed max-w-md font-sans">
                Stress-test your navigation, perception, and manipulation policies against thousands of dynamic edge cases. Export verified datasets to Hugging Face.
              </p>
            </div>
          </div>
        </section>

        {/* 3. "THE PROBLEM" EDITORIAL SECTION */}
        <section id="problem" className="grid grid-cols-1 md:grid-cols-[160px_1fr] border-b border-[#111111]">
          {/* Left Column: Vertical Label */}
          <div className="border-b md:border-b-0 md:border-r border-[#111111] p-6 font-mono text-xs text-[#666666] uppercase tracking-wider">
            the<br />problem
          </div>

          {/* Right Column: Editorial Headline & Copy */}
          <div className="p-8 lg:p-14 space-y-4 bg-[#F2F1ED]">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl text-[#111111] font-normal tracking-tight"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Why physical AI models fail in the real world
            </h2>

            <p className="text-sm sm:text-base text-[#444444] leading-relaxed max-w-3xl font-sans">
              Robotics foundation models learn nominal trajectories quickly. But they fail catastrophically on the long tail of physical reality—unexpected specular glare, occluded pedestrians emerging from blind corners, sensor dropouts, and multi-robot right-of-way contention.
            </p>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed max-w-3xl font-sans">
              Hardware test fleets are expensive and dangerous to crash; static synthetic simulators are too clean and lack physical world fidelity. LOOP bridges the gap with continuous generative perturbation testing.
            </p>
          </div>
        </section>

        {/* 4. "THE ENGINE" / SOLUTION BREAKDOWN SECTION */}
        <section id="solution" className="grid grid-cols-1 md:grid-cols-[160px_1fr] border-b border-[#111111]">
          <div className="border-b md:border-b-0 md:border-r border-[#111111] p-6 font-mono text-xs text-[#666666] uppercase tracking-wider">
            the<br />engine
          </div>

          <div className="p-8 lg:p-14 space-y-8 bg-[#ECEBE8]">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl text-[#111111] font-normal tracking-tight"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Continuous adversarial simulation with Reactor world models
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 bg-white border border-[#111111] space-y-2">
                <span className="font-mono text-xs font-bold text-[#111111] block">01 / BREAK IT</span>
                <h3 className="font-bold text-sm text-[#111111]">Dynamic Hazard Ingestion</h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Inject 5 classes of repeatable perturbations in-flight—pedestrian emergences, floor glare, power failure, and sensor occlusions.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#111111] space-y-2">
                <span className="font-mono text-xs font-bold text-[#111111] block">02 / LEARN FROM IT</span>
                <h3 className="font-bold text-sm text-[#111111]">Sub-Second Telemetry Audit</h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Record exact reaction latencies, minimum clearance envelopes, and ISO 3691-4 safety ring violations across thousands of runs.
                </p>
              </div>

              <div className="p-5 bg-white border border-[#111111] space-y-2">
                <span className="font-mono text-xs font-bold text-[#111111] block">03 / PROVE IT</span>
                <h3 className="font-bold text-sm text-[#111111]">Open Data Export</h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Package validated failure &amp; recovery episodes into LeRobot and Open X-Embodiment formats to harden your next policy checkpoint.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LIVE SIMULATION & SCENARIO TESTING ENGINE */}
        <SimulatorSection />

        {/* 6. FOOTER */}
        <footer className="px-6 py-6 font-mono text-[11px] text-[#666666] flex flex-wrap items-center justify-between border-t border-[#111111] bg-[#ECEBE8]">
          <div>
            <span>© 2026 LOOP — Physical AI Continuous Testing &amp; Data Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://huggingface.co/datasets" target="_blank" rel="noopener noreferrer" className="hover:underline">
              [ hugging face dataset ]
            </a>
            <span>Powered by Reactor LingBot World 2</span>
          </div>
        </footer>

      </div>
    </LingbotWorld2Provider>
  );
}
