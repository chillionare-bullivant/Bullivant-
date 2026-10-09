import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function main() {
  const prompt = process.argv[2] || "Explain why Node.js is well-suited for streaming data and AI integration in 3 concise bullet points.";
  console.log(`[Stream Demo] Querying Gemini with prompt: "${prompt}"\n`);

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
      }
    }
    console.log("\n\n[Stream Completed Successfully]");
  } catch (error) {
    console.error("\nStreaming error:", error?.message || error);
    process.exit(1);
  }
}

main();
