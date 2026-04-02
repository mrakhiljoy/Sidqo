import Anthropic from "@anthropic-ai/sdk";
import { CASE_STRATEGY_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { ANTHROPIC_API_KEY } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    const { caseType, situation, emirate, urgency, additionalContext } = await req.json();

    const userPrompt = `Analyze this UAE legal case and provide a comprehensive strategy:

**Case Type:** ${caseType}
**Emirate / Jurisdiction:** ${emirate || "UAE (General)"}
**Urgency Level:** ${urgency || "Normal"}
**Situation Description:**
${situation}
${additionalContext ? `\n**Additional Context:**\n${additionalContext}` : ""}

Please provide a complete, detailed legal strategy including all the sections outlined in your system instructions. Be specific about UAE laws, deadlines, court procedures, and actionable steps. Reference specific articles of UAE law where applicable.`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 8000,
            system: CASE_STRATEGY_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Cases API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
