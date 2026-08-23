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

    const { 
      imageBase64, 
      scenarioName = "Hospital Emergency Operations",
      scenarioDescription = "Interactive healthcare emergency decision environment",
      activeHazards = [] 
    } = await req.json();

    const systemPrompt = `You are the AI Real-Time Tactical Safety Officer and Live Dispatch Commentator for "Reality Rehearsal", an advanced emergency healthcare response world model.

Current Active Scenario: "${scenarioName}"
Description: "${scenarioDescription}"

Your job:
1. Visually inspect the provided live simulation / camera frame.
2. Analyze whatever is visible in this specific environment (e.g. if it's an emergency hospital command center, analyze telemetry monitors, traffic flow, and staff dispatch; if it's an aerial drone, analyze rooftops, airspace, and weather; if it's an AMR, analyze corridor lanes and obstacles).
3. Produce a dynamic, authoritative, 1-2 sentence real-time emergency broadcast commentary tailored specifically to this active scenario.

Respond in JSON with this exact schema:
{
  "headline": "Short 3-5 word status (e.g., 'Command Center Telemetry Synchronized', 'Trauma Bay Influx Nominal', 'Airspace Clearance 92%')",
  "commentary": "1-2 concise, realistic sentences describing what is occurring in this live view and the operational safety status.",
  "safetyScore": 94, // 0-100 score
  "hazardDetected": false, // true if power loss, traffic jam, congestion, or physical obstacle is detected
  "spokenBrief": "One crisp sentence for the radio audio broadcast tailored to this active emergency scene."
}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64 && imageBase64.startsWith("data:image")) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this live video frame from the active scenario: "${scenarioName}". Context: "${scenarioDescription}". Active constraints: ${activeHazards.join(", ") || "Nominal"}. Provide real-time tactical commentary.`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64,
              detail: "low",
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Live telemetry report: Operating in "${scenarioName}". Context: "${scenarioDescription}". Active constraints: ${activeHazards.join(", ") || "Nominal"}. Provide situational commentary.`,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI Vision error:", err);
      return NextResponse.json(
        { error: `Vision API error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    return NextResponse.json({ success: true, commentary: parsed });
  } catch (error: any) {
    console.error("Vision route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
