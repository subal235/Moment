import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set on the server" },
        { status: 500 },
      );
    }

    const { message, simulationState } = await req.json();

    const systemPrompt = `You are the AI Incident Commander and Strategic World Model Copilot for "Reality Rehearsal", an advanced emergency healthcare response simulation system.

Current City Healthcare Infrastructure:
- Ground Zero: 100 Mass-Casualty Victims (20 T1 Critical, 30 T2 Serious, 50 T3 Moderate)
- Fleet: 14 Ambulances dispatched across urban transit corridors
- Hospital A (St. Jude Metropolitan): ER Capacity 40, ICU Beds 10. Default transit 6.2 min.
- Hospital B (City Central Trauma Center): ER Capacity 60, ICU Beds 20. Default transit 11.5 min. (Specialty: Level 1 Trauma)
- Hospital C (Riverside General Hospital): ER Capacity 50, ICU Beds 15. Default transit 8.4 min.

Your role:
1. Provide a sharp, authoritative emergency tactical analysis of the situation and the trade-offs.
2. Recommend the optimal intervention strategy (e.g. Scenario D multi-agent load balancing, dynamic rerouting, or activating surge beds).
3. Return structured simulation actions that can be executed directly by the simulation engine.

You MUST respond in valid JSON format with the following schema:
{
  "tacticalAssessment": "2-3 sentences assessing current chokepoints and risks.",
  "recommendedAction": "Exact strategic directive for paramedic dispatch and hospital triage.",
  "recommendedScenario": "scenario_d" | "scenario_c" | "scenario_b" | "scenario_a",
  "projectedOutcome": {
    "stressScore": 27,
    "rampQueueReduction": "88%",
    "avgOffloadWait": "4.1 min",
    "criticalMortalityRisk": "< 1.2%"
  },
  "rationale": "Key insight explaining why this policy prevents system failure.",
  "voiceBrief": "One crisp radio dispatch sentence suitable for audio transmission to field units."
}`;

    const userMessageContent = `
User Query: "${message || "Analyze current emergency bottlenecks and recommend the optimal dispatch strategy."}"

Live Simulation Snapshot:
${JSON.stringify(simulationState || {}, null, 2)}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessageContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return NextResponse.json(
        { error: `OpenAI API returned ${response.status}: ${errorText}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    return NextResponse.json({ success: true, directive: parsed });
  } catch (error: any) {
    console.error("Error in AI Commander route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
