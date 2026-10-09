import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocket } from "ws";

export interface LiveVoiceConfig {
  voiceName?: "Zephyr" | "Puck" | "Kore" | "Fenrir" | "Charon";
  systemInstruction?: string;
}

export class LiveVoiceSessionManager {
  public static async handleConnection(clientWs: WebSocket) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error:
            "GEMINI_API_KEY is not configured in environment variables. Please configure your key in AI Studio Secrets.",
        })
      );
      clientWs.close();
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let liveSession: any = null;
    let selectedVoice = "Zephyr";

    const initLiveSession = async (voiceName: string = "Zephyr", customInstruction?: string) => {
      try {
        if (liveSession && typeof liveSession.close === "function") {
          try {
            liveSession.close();
          } catch (_e) {}
        }

        selectedVoice = voiceName;

        const instruction =
          customInstruction ||
          "You are an interactive, ultra-responsive AI voice assistant for this full-stack Web3, Bitcoin, Solana, and Node.js architecture workspace. Speak clearly, concisely, and naturally. Help the user explore distributed consensus, Proof of History, mempool mechanics, system architecture, or general programming and tech questions in real-time.";

        liveSession = await ai.live.connect({
          model: "gemini-3.8-live",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice,
                },
              },
            },
            systemInstruction: instruction,
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              // 1. Output audio stream (raw 24kHz PCM)
              const parts = message.serverContent?.modelTurn?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: "audio",
                        audio: part.inlineData.data,
                      })
                    );
                  }
                }
                if (part.text) {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: "text",
                        text: part.text,
                      })
                    );
                  }
                }
              }

              // 2. Interruption detection (barge-in)
              if (message.serverContent?.interrupted) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: "interrupted",
                    })
                  );
                }
              }

              // 3. Turn complete
              if (message.serverContent?.turnComplete) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: "turn_complete",
                    })
                  );
                }
              }
            },
            onclose: () => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "session_closed" }));
              }
            },
            onerror: (err: any) => {
              console.error("Gemini Live session callback error:", err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    error: err?.message || "Gemini Live session error encountered.",
                  })
                );
              }
            },
          },
        });

        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: "session_ready",
              model: "gemini-3.8-live",
              voice: selectedVoice,
              sampleRate: 24000,
              inputSampleRate: 16000,
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (err: any) {
        console.error("Failed to connect to Gemini Live API:", err);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: "error",
              error: err?.message || "Could not establish Gemini Live session.",
            })
          );
        }
      }
    };

    // Initialize session with default voice
    await initLiveSession("Zephyr");

    // Client event listener
    clientWs.on("message", async (rawMsg) => {
      try {
        const parsed = JSON.parse(rawMsg.toString());

        if (parsed.type === "audio" && parsed.audio && liveSession) {
          // Stream raw 16kHz PCM audio chunk to Gemini Live
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } else if (parsed.type === "text" && parsed.text && liveSession) {
          // Send text prompt into active live session
          liveSession.sendRealtimeInput({
            text: parsed.text,
          });
        } else if (parsed.type === "reconnect_voice" && parsed.voiceName) {
          // Change voice or prompt
          await initLiveSession(parsed.voiceName, parsed.systemInstruction);
        }
      } catch (err: any) {
        console.error("Error processing client WebSocket message:", err);
      }
    });

    clientWs.on("close", () => {
      try {
        if (liveSession && typeof liveSession.close === "function") {
          liveSession.close();
        }
      } catch (_e) {}
    });
  }
}
