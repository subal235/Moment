"use client";

import React, { useState } from "react";

export interface StressEpisodeData {
  scenarioId: string;
  scenarioName: string;
  totalDurationSec: number;
  injectedHazards: Array<{
    name: string;
    keySlot: number;
    timestampSec: number;
    reactionLatencyMs: number;
    clearanceMarginM: number;
    behaviorState: "EMERGENCY_STOP" | "DEGRADED_FALLBACK" | "OBSTACLE_AVOIDANCE" | "NOMINAL";
    outcome: "PASS" | "ADAPTED" | "CRITICAL_STOP";
  }>;
}

export function StressTestReportModal({
  isOpen,
  onClose,
  scenarioName = "🏥 Hospital Emergency Wing & ICU 4B",
  scenarioId = "hospital_icu_4b",
}: {
  isOpen: boolean;
  onClose: () => void;
  scenarioName?: string;
  scenarioId?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "dataset" | "raw">("report");

  if (!isOpen) return null;

  const mockEpisodes: StressEpisodeData = {
    scenarioId,
    scenarioName,
    totalDurationSec: 18.4,
    injectedHazards: [
      {
        name: "⚡ Battery Drain 100% (Critical Power Loss)",
        keySlot: 1,
        timestampSec: 4.2,
        reactionLatencyMs: 38,
        clearanceMarginM: 0.62,
        behaviorState: "EMERGENCY_STOP",
        outcome: "CRITICAL_STOP",
      },
      {
        name: "📡 Sensor Failure & Vision Glitch",
        keySlot: 2,
        timestampSec: 9.6,
        reactionLatencyMs: 64,
        clearanceMarginM: 0.41,
        behaviorState: "DEGRADED_FALLBACK",
        outcome: "ADAPTED",
      },
      {
        name: "Pedestrian + IV Emergence",
        keySlot: 3,
        timestampSec: 14.1,
        reactionLatencyMs: 52,
        clearanceMarginM: 0.35,
        behaviorState: "OBSTACLE_AVOIDANCE",
        outcome: "PASS",
      },
    ],
  };

  const handleExportDataset = (format: "jsonl" | "lerobot") => {
    setDownloading(true);
    const datasetPayload = {
      version: "loop-v1.0",
      format,
      metadata: {
        task: "hospital_amr_navigation_stress_test",
        robot_type: "differential_drive_amr",
        environment: "icu_corridor_night",
        injected_perturbations: mockEpisodes.injectedHazards.map((h) => h.name),
        total_episodes: 12,
        total_steps: 1840,
        sample_rate_hz: 60,
      },
      episodes: Array.from({ length: 4 }).map((_, epIdx) => ({
        episode_index: epIdx,
        length: 460,
        perturbation_injected: mockEpisodes.injectedHazards[epIdx % mockEpisodes.injectedHazards.length].name,
        timesteps: Array.from({ length: 10 }).map((_, stepIdx) => ({
          step: stepIdx * 46,
          timestamp: (stepIdx * 1.84).toFixed(2),
          observation: {
            rgb_latent_hash: `0x${Math.random().toString(16).slice(2, 10)}`,
            lidar_min_dist: (0.35 + Math.random() * 1.2).toFixed(2),
            battery_pct: epIdx === 0 && stepIdx > 3 ? 0.0 : 94.2,
            sensor_health_flag: epIdx === 1 && stepIdx > 4 ? 0 : 1,
          },
          action: {
            linear_velocity: epIdx === 0 && stepIdx > 3 ? 0.0 : 1.18,
            angular_velocity: (Math.sin(stepIdx) * 0.12).toFixed(3),
            emergency_brake: epIdx === 0 && stepIdx > 3 ? 1 : 0,
          },
          reward: 0.68,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(datasetPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loop_${scenarioId}_training_dataset_${format}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#ECEBE8] border-2 border-[#111111] shadow-[8px_8px_0px_#111111] flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#111111] bg-[#ECEBE8]">
          <div>
            <div className="font-mono text-xs text-[#666666] uppercase tracking-wider">
              LOOP PHYSICAL AI AUDIT ENGINE
            </div>
            <h2 className="text-xl font-bold text-[#111111] flex items-center gap-2">
              <span>STRESS TEST REPORT &amp; TRAINING DATASET</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportDataset("jsonl")}
              disabled={downloading}
              className="px-4 py-2 bg-[#111111] text-white hover:bg-[#282828] font-mono text-xs font-bold border border-[#111111] shadow-[2px_2px_0px_#111111] cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {downloading ? "GENERATING..." : "EXPORT .JSONL DATASET ↗"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white text-[#111111] hover:bg-[#F2F1ED] font-mono text-xs font-bold border border-[#111111] shadow-[2px_2px_0px_#111111] cursor-pointer transition-all active:scale-95"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#111111] bg-[#E5E4E0] font-mono text-xs">
          <button
            onClick={() => setActiveTab("report")}
            className={`px-5 py-2.5 font-bold border-r border-[#111111] cursor-pointer transition-colors ${
              activeTab === "report" ? "bg-[#ECEBE8] text-[#111111] border-b-2 border-b-[#111111]" : "text-[#555555] hover:bg-[#DCDAD5]"
            }`}
          >
            [ 01 / STRESS TEST AUDIT REPORT ]
          </button>
          <button
            onClick={() => setActiveTab("dataset")}
            className={`px-5 py-2.5 font-bold border-r border-[#111111] cursor-pointer transition-colors ${
              activeTab === "dataset" ? "bg-[#ECEBE8] text-[#111111] border-b-2 border-b-[#111111]" : "text-[#555555] hover:bg-[#DCDAD5]"
            }`}
          >
            [ 02 / MODEL TRAINING DATA ENGINE ]
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-5 py-2.5 font-bold cursor-pointer transition-colors ${
              activeTab === "raw" ? "bg-[#ECEBE8] text-[#111111] border-b-2 border-b-[#111111]" : "text-[#555555] hover:bg-[#DCDAD5]"
            }`}
          >
            [ 03 / LEROBOT SCHEMA PREVIEW ]
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#ECEBE8]">
          {activeTab === "report" && (
            <>
              {/* Top Score Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-[#111111] shadow-[2px_2px_0px_#111111]">
                  <span className="font-mono text-[10px] uppercase text-[#666666] block">Overall Safety Score</span>
                  <div className="text-2xl font-mono font-extrabold text-[#111111] mt-1">6.8 <span className="text-xs text-[#777777]">/ 10</span></div>
                  <span className="text-[10px] text-[#00A86B] font-mono font-bold mt-1 block">PASS (COMPLIANT)</span>
                </div>

                <div className="p-4 bg-white border border-[#111111] shadow-[2px_2px_0px_#111111]">
                  <span className="font-mono text-[10px] uppercase text-[#666666] block">Policy Robustness</span>
                  <div className="text-2xl font-mono font-extrabold text-[#111111] mt-1">3.4 <span className="text-xs text-[#777777]">/ 5</span></div>
                  <span className="text-[10px] text-[#111111] font-mono mt-1 block">MODERATE ADAPTATION</span>
                </div>

                <div className="p-4 bg-white border border-[#111111] shadow-[2px_2px_0px_#111111]">
                  <span className="font-mono text-[10px] uppercase text-[#666666] block">Avg Reaction Latency</span>
                  <div className="text-2xl font-mono font-extrabold text-[#111111] mt-1">51.3<span className="text-xs font-normal">ms</span></div>
                  <span className="text-[10px] text-[#00A86B] font-mono mt-1 block">&lt; 100ms ISO TARGET</span>
                </div>

                <div className="p-4 bg-white border border-[#111111] shadow-[2px_2px_0px_#111111]">
                  <span className="font-mono text-[10px] uppercase text-[#666666] block">ISO 3691-4 Envelope</span>
                  <div className="text-2xl font-mono font-extrabold text-[#111111] mt-1">0.38<span className="text-xs font-normal">m</span></div>
                  <span className="text-[10px] text-[#00A86B] font-mono mt-1 block">MIN CLEARANCE MAINTAINED</span>
                </div>
              </div>

              {/* Injected Hazards Breakdown Table */}
              <div className="bg-white border border-[#111111] shadow-[3px_3px_0px_#111111] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#111111] pb-2">
                  <h3 className="font-mono text-xs font-bold uppercase text-[#111111]">
                    INJECTED STRESS PERTURBATIONS &amp; BEHAVIOR BREAKDOWN
                  </h3>
                  <span className="font-mono text-[10px] text-[#666666]">
                    SCENARIO: {scenarioName}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#111111] text-[10px] text-[#666666] uppercase">
                        <th className="py-2">Slot</th>
                        <th className="py-2">Hazard Injected</th>
                        <th className="py-2">Reaction</th>
                        <th className="py-2">Clearance</th>
                        <th className="py-2">Robot Failsafe Response</th>
                        <th className="py-2 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E4E0]">
                      {mockEpisodes.injectedHazards.map((h, i) => (
                        <tr key={i} className="hover:bg-[#F9F8F6]">
                          <td className="py-2.5 font-bold text-[#111111]">KEY {h.keySlot}</td>
                          <td className="py-2.5 font-semibold text-[#111111]">{h.name}</td>
                          <td className="py-2.5">{h.reactionLatencyMs} ms</td>
                          <td className="py-2.5">{h.clearanceMarginM.toFixed(2)} m</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 bg-[#F2F1ED] border border-[#111111] text-[10px] font-bold">
                              {h.behaviorState}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 font-bold text-[10px] border ${
                                h.outcome === "PASS"
                                  ? "bg-[#00E599]/20 text-[#008A52] border-[#00A86B]"
                                  : h.outcome === "ADAPTED"
                                  ? "bg-amber-100 text-amber-900 border-amber-500"
                                  : "bg-red-100 text-red-900 border-red-500"
                              }`}
                            >
                              {h.outcome}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Behavior Analysis Summary */}
              <div className="p-4 bg-[#F2F1ED] border border-[#111111] space-y-2">
                <span className="font-mono text-xs font-bold text-[#111111] uppercase block">
                  ADVERSARIAL STRESS TEST EVALUATION SUMMARY
                </span>
                <p className="text-xs text-[#333333] leading-relaxed">
                  During 100% battery drain injection, the AMR engaged emergency mechanical friction deceleration within 38ms, preventing overrun in the ICU corridor. Under primary sensor failure, optical glitch artifacts caused momentary trajectory hesitation, but degraded obstacle clearance buffer remained above 0.35m.
                </p>
              </div>
            </>
          )}

          {activeTab === "dataset" && (
            <div className="space-y-4">
              <div className="p-5 bg-white border border-[#111111] shadow-[2px_2px_0px_#111111] space-y-3">
                <span className="font-mono text-xs font-bold text-[#111111] uppercase block">
                  PHYSICAL AI POLICY TRAINING DATASET EXPORT
                </span>
                <p className="text-xs text-[#555555] leading-relaxed">
                  Export verified failure and recovery trajectory episodes recorded during stress testing. This dataset contains observation RGB latents, LiDAR distance arrays, actuator control signals, and perturbation timestamps formatted for behavioral cloning and diffusion policy fine-tuning.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[#F2F1ED] border border-[#111111] space-y-2">
                    <span className="font-mono text-xs font-bold text-[#111111] block">LeRobot / HuggingFace Format</span>
                    <p className="text-[11px] text-[#666666]">
                      Standard HuggingFace datasets format with episode metadata, state actions, and reward signals.
                    </p>
                    <button
                      onClick={() => handleExportDataset("lerobot")}
                      className="w-full py-2 bg-[#111111] text-white font-mono text-xs font-bold border border-[#111111] shadow-[2px_2px_0px_#111111] cursor-pointer hover:bg-[#282828] active:scale-95"
                    >
                      DOWNLOAD LEROBOT DATASET (.JSON)
                    </button>
                  </div>

                  <div className="p-4 bg-[#F2F1ED] border border-[#111111] space-y-2">
                    <span className="font-mono text-xs font-bold text-[#111111] block">Open X-Embodiment JSONL</span>
                    <p className="text-[11px] text-[#666666]">
                      Sequential JSONL timesteps for multimodal VLA training (OpenVLA, ACT-v4, Octo).
                    </p>
                    <button
                      onClick={() => handleExportDataset("jsonl")}
                      className="w-full py-2 bg-white text-[#111111] font-mono text-xs font-bold border border-[#111111] shadow-[2px_2px_0px_#111111] cursor-pointer hover:bg-[#F2F1ED] active:scale-95"
                    >
                      DOWNLOAD JSONL EPISODES (.JSONL)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "raw" && (
            <div className="bg-[#111111] p-4 border border-[#111111] text-white font-mono text-[11px] overflow-x-auto">
              <pre className="text-[#00E599]">
{`{
  "task": "hospital_amr_corridor_navigation",
  "scenario": "${scenarioId}",
  "perturbation_class": "critical_battery_drain_and_sensor_failure",
  "episode_metrics": {
    "safety_score": 6.8,
    "policy_robustness": 3.4,
    "reaction_latency_ms": 38.0,
    "failsafe_stop_distance_m": 0.18
  },
  "training_features": [
    "observation.rgb_latent",
    "observation.lidar_range",
    "observation.battery_state",
    "action.linear_vel",
    "action.angular_vel",
    "action.emergency_brake"
  ]
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
