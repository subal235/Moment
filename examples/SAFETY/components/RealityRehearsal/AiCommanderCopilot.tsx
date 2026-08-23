"use client";

import React, { useState, useEffect, useRef } from "react";

export interface AiDirective {
  tacticalAssessment: string;
  recommendedAction: string;
  recommendedScenario: string;
  projectedOutcome: {
    stressScore: number;
    rampQueueReduction: string;
    avgOffloadWait: string;
    criticalMortalityRisk: string;
  };
  rationale: string;
  voiceBrief: string;
}

interface AiCommanderCopilotProps {
  simulationState: any;
  onApplyScenario: (scenarioId: string) => void;
  onToggleWhatIf: (presetId: string) => void;
}

export function AiCommanderCopilot({
  simulationState,
  onApplyScenario,
  onToggleWhatIf,
}: AiCommanderCopilotProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [directive, setDirective] = useState<AiDirective | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const quickPrompts = [
    "Hospital B lost 30% power. Reroute incoming T1 critical casualties.",
    "Bridge 4 is severely jammed (+45% delay). Recommend optimal load balancing.",
    "Hospital C is reaching 142% choke. Calculate surge bed requirements.",
    "Generate executive After-Action Review comparing Scenario A vs D.",
  ];

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setPrompt(transcript);
          setIsListening(false);
          handleAskAI(transcript);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const playVoiceAudio = async (text: string) => {
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
        // Fallback to browser Web Speech API synthesis
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
          return;
        }
        throw new Error("TTS fetch failed");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
      };

      await audio.play();
    } catch (err) {
      console.warn("Audio playback notice:", err);
      setIsPlayingAudio(false);
    }
  };

  const stopVoiceAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleAskAI = async (queryText?: string) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setError(null);
    setApplied(false);
    stopVoiceAudio();

    try {
      const res = await fetch("/api/ai/commander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          simulationState,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.directive) {
        setDirective(data.directive);
        if (autoSpeak && data.directive.voiceBrief) {
          playVoiceAudio(data.directive.voiceBrief);
        }
      }
    } catch (err: any) {
      console.error("AI Commander error:", err);
      setError(err.message || "Failed to communicate with AI Commander");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    if (!directive) return;
    if (directive.recommendedScenario) {
      onApplyScenario(directive.recommendedScenario);
    }
    setApplied(true);
  };

  return (
    <div className="p-6 bg-white rounded-3xl border border-zinc-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-white flex items-center justify-center text-xl shadow-inner">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-950">
                Voice-Powered AI Incident Commander &amp; World Model Copilot
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                OpenAI GPT-4o + TTS
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Speak or type tactical queries to evaluate hospital bottlenecks, ICU saturation, and adaptive dispatch policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-zinc-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Auto-Speak Dispatch Orders</span>
          </label>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Voice Link Active</span>
          </div>
        </div>
      </div>

      {/* Input & Voice Controls */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          {/* Microphone Push-to-Talk Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            title={isListening ? "Listening... click to cancel" : "Click to speak with AI Commander"}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isListening
                ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200"
            }`}
          >
            <span className="text-sm">{isListening ? "🔴" : "🎙️"}</span>
            <span>{isListening ? "Listening..." : "Speak"}</span>
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
            placeholder={
              isListening
                ? "Listening to your voice command..."
                : "Speak or type e.g. 'Hospital B capacity dropped by 30%, how to distribute 20 critical patients?'"
            }
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-sm"
          />

          <button
            onClick={() => handleAskAI()}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#142820] text-white text-xs font-semibold hover:bg-[#0E1E18] disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Reasoning...</span>
              </>
            ) : (
              <span>Analyze &amp; Advise →</span>
            )}
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(qp);
                handleAskAI(qp);
              }}
              className="text-[11px] px-3 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 border border-zinc-200 transition-colors cursor-pointer text-left"
            >
              💬 {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* AI Directive Card */}
      {directive && (
        <div className="p-5 bg-[#FAFAFA] rounded-2xl border border-zinc-200 space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 flex-wrap gap-2">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> Tactical Directive &amp; Resource Allocation Plan
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-zinc-500">
                Recommendation: <strong>{directive.recommendedScenario.toUpperCase()}</strong>
              </span>

              {/* Audio Playback Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (isPlayingAudio) {
                    stopVoiceAudio();
                  } else {
                    playVoiceAudio(directive.voiceBrief);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPlayingAudio
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <span>{isPlayingAudio ? "⏹ Stop Audio" : "🔊 Listen to Dispatch"}</span>
                {isPlayingAudio && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-rose-500 animate-pulse" />
                    <span className="w-1 h-4 bg-rose-600 animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-rose-400 animate-pulse delay-150" />
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                Situational Assessment
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed">
                {directive.tacticalAssessment}
              </p>

              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider pt-2">
                Operational Rationale
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed">
                {directive.rationale}
              </p>
            </div>

            <div className="space-y-3 p-4 bg-white rounded-xl border border-zinc-200">
              <div className="text-xs font-bold text-zinc-950 flex items-center justify-between">
                <span>Projected System Outcome</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                  Stress: {directive.projectedOutcome.stressScore}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="text-[10px] text-zinc-500">Queue Reduction</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {directive.projectedOutcome.rampQueueReduction}
                  </div>
                </div>
                <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="text-[10px] text-zinc-500">Avg Offload</div>
                  <div className="text-sm font-bold text-zinc-900">
                    {directive.projectedOutcome.avgOffloadWait}
                  </div>
                </div>
                <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="text-[10px] text-zinc-500">Mortality Risk</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {directive.projectedOutcome.criticalMortalityRisk}
                  </div>
                </div>
              </div>

              {/* Radio Dispatch Box */}
              <div className="p-3 bg-zinc-950 text-zinc-100 rounded-xl text-[11px] font-mono flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 text-base">📻</span>
                  <span className="leading-snug text-zinc-200">{directive.voiceBrief}</span>
                </div>

                <button
                  type="button"
                  onClick={() => playVoiceAudio(directive.voiceBrief)}
                  className="shrink-0 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Replay radio broadcast"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          {/* Action Execution Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-zinc-600">
              <strong>Action:</strong> {directive.recommendedAction}
            </div>

            <button
              onClick={handleExecute}
              disabled={applied}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2 ${
                applied
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95"
              }`}
            >
              {applied ? (
                <>
                  <span>✓</span> Applied to Simulation
                </>
              ) : (
                <>
                  <span>⚡</span> Execute Directive in Simulator →
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
