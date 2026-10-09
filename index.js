import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// Initialize the SDK (it automatically picks up GEMINI_API_KEY from environment variables, or you can pass it directly)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function main() {
  try {
    let modelName = "gemini-3.1-flash-lite";
    let response;

    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: "Hello! Tell me a quick joke about Node.js.",
      });
    } catch (err) {
      if (err?.status === 404 || err?.status === 503 || err?.message?.includes("demand")) {
        modelName = "gemini-3.8-flash";
        response = await ai.models.generateContent({
          model: modelName,
          contents: "Hello! Tell me a quick joke about Node.js.",
        });
      } else {
        throw err;
      }
    }

    console.log(response.text);
  } catch (error) {
    console.error("Error executing Gemini request:", error);
    process.exit(1);
  }
}

main();
