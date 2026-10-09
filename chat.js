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
  console.log("[Chat Demo] Initializing multi-turn chat session with Gemini...\n");

  try {
    const chat = ai.chats.create({
      model: "gemini-3.1-flash-lite",
      config: {
        systemInstruction: "You are an expert Node.js backend mentor. Keep explanations clear, practical, and concise.",
      },
    });

    // Turn 1
    const message1 = "What is the difference between synchronous and asynchronous operations in Node.js?";
    console.log(`User: ${message1}`);
    const response1 = await chat.sendMessage({ message: message1 });
    console.log(`Gemini:\n${response1.text}\n`);

    // Turn 2 (contextual follow-up)
    const message2 = "Give me a quick 3-line example contrasting both using the fs module.";
    console.log(`User: ${message2}`);
    const response2 = await chat.sendMessage({ message: message2 });
    console.log(`Gemini:\n${response2.text}\n`);

    console.log("[Chat Session Completed]");
  } catch (error) {
    console.error("Chat error:", error?.message || error);
    process.exit(1);
  }
}

main();
