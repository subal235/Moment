"use client";

import React, { useState } from "react";

interface HeaderProps {
  onTriggerEmergency?: () => void;
  onReset?: () => void;
  isEmergencyActive?: boolean;
}

export function Header({ onTriggerEmergency, onReset, isEmergencyActive }: HeaderProps) {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-transparent transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        
        {/* Left: Moment Logo */}
        <div className="flex items-center gap-12">
          <a href="#" className="flex items-center gap-2 group cursor-pointer">
            {/* Moment geometric twin-parallelogram icon */}
            <svg
              className="w-5 h-5 text-zinc-950"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 18L10 6H7L1 18H4Z" />
              <path d="M14 18L20 6H17L11 18H14Z" />
            </svg>
            <span className="font-bold text-xl tracking-tight text-zinc-950 font-sans">
              Moment
            </span>
          </a>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14.5px] font-normal text-zinc-800">
            <a
              href="#problem"
              className="hover:text-zinc-950 transition-colors py-1 cursor-pointer"
            >
              Customers
            </a>

            <div className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onBlur={() => setTimeout(() => setSolutionsOpen(false), 200)}
                className="flex items-center gap-1 hover:text-zinc-950 transition-colors py-1 cursor-pointer"
              >
                <span>Solutions</span>
                <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 z-50 animate-in fade-in zoom-in-95">
                  <a href="#cockpit" className="block px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 rounded-xl">
                    Emergency Simulation Cockpit
                  </a>
                  <a href="#futures-comparison" className="block px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 rounded-xl">
                    Alternative Futures Engine (A–D)
                  </a>
                  <a href="#decision-loop" className="block px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 rounded-xl">
                    Multi-Agent Propagation Lifecycle
                  </a>
                  <a href="#embodied-stream" className="block px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl">
                    Embodied Robotics Stream (LingBot 2)
                  </a>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                onBlur={() => setTimeout(() => setAboutOpen(false), 200)}
                className="flex items-center gap-1 hover:text-zinc-950 transition-colors py-1 cursor-pointer"
              >
                <span>About</span>
                <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {aboutOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 z-50 animate-in fade-in zoom-in-95">
                  <a href="#problem" className="block px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 rounded-xl">
                    Executive Summary & Blueprint
                  </a>
                  <a href="#decision-loop" className="block px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 rounded-xl">
                    World Model Architecture
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <a
            href="#ai-query"
            className="px-4 py-2 text-[14px] font-normal text-zinc-800 hover:text-zinc-950 border border-zinc-200/80 rounded-lg hover:border-zinc-300 transition-all cursor-pointer hidden sm:inline-flex"
          >
            Sign in
          </a>

          {/* Moment Iconic Dark Green Pill Button */}
          <button
            onClick={() => {
              if (onTriggerEmergency) {
                onTriggerEmergency();
              } else {
                const el = document.getElementById("cockpit");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#142820] hover:bg-[#0E1E18] text-white text-[13.5px] font-medium shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>Book a demo</span>
            <svg
              className="w-3.5 h-3.5 text-white/90"
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
    </header>
  );
}
