import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function main() {
  console.log("[Structured Output Demo] Requesting typed JSON schema from Gemini...\n");

  try {
    const prompt = "Analyze the strengths and common use cases of Node.js for backend API development.";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedUseCases: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            performanceRatingOutOfTen: { type: Type.NUMBER },
          },
          required: ["topic", "summary", "strengths", "recommendedUseCases"],
        },
      },
    });

    console.log("Raw JSON response string received:\n");
    console.log(response.text);

    console.log("\nParsed JavaScript Object representation:\n");
    const parsedData = JSON.parse(response.text || "{}");
    console.dir(parsedData, { depth: null, colors: true });

    console.log("\n[Structured Output Completed Successfully]");
  } catch (error) {
    console.error("Structured output error:", error?.message || error);
    process.exit(1);
  }
}

main();
