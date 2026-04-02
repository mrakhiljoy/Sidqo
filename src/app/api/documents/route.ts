import Anthropic from "@anthropic-ai/sdk";
import { DOCUMENT_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { ANTHROPIC_API_KEY } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    const { documentType, details, party1, party2, additionalInfo } = await req.json();

    const userPrompt = `Generate a professional UAE legal document with the following specifications:

**Document Type:** ${documentType}
**Party 1 / Claimant:** ${party1 || "To be specified"}
**Party 2 / Respondent:** ${party2 || "To be specified"}
**Key Details:** ${details}
${additionalInfo ? `**Additional Requirements:** ${additionalInfo}` : ""}

Please generate a complete, professionally formatted legal document following UAE legal standards. Include all necessary clauses, references to applicable UAE laws, and proper formatting. The document should be ready to use as a professional template.`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 8000,
            system: DOCUMENT_SYSTEM_PROMPT,
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
    console.error("Documents API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
