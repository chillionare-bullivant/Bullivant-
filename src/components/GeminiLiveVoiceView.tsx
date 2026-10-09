import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Bot,
  User,
  Sliders,
  AudioWaveform as Waveform,
  Activity,
  Layers,
  Settings2,
  Cpu,
  Info,
  HelpCircle,
  Headphones,
} from "lucide-react";

interface TranscriptMessage {
  id: string;
  sender: "user" | "model" | "system";
  text: string;
  timestamp: string;
}

export function GeminiLiveVoiceView() {
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Microphone permission & fallback state
  const [micStatus, setMicStatus] = useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [showPermHelp, setShowPermHelp] = useState<boolean>(false);

  // Configuration
  const [selectedVoice, setSelectedVoice] = useState<"Zephyr" | "Puck" | "Kore" | "Fenrir" | "Charon">("Zephyr");
  const [selectedPreset, setSelectedPreset] = useState<string>("web3");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "You are an interactive, ultra-responsive AI voice assistant for this full-stack Web3, Bitcoin, Solana, and Node.js architecture workspace. Speak clearly, concisely, and naturally."
  );

  // Transcripts & chat
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([
    {
      id: "welcome-1",
      sender: "system",
      text: "Gemini Live Voice Conversation ready. Click 'Connect Voice Session' to begin speaking with gemini-3.8-live in real time.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [textInput, setTextInput] = useState<string>("");

  // Audio level visualizer
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Clean up audio & sockets on unmount
  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  // System instruction presets
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    let instruction = "";
    if (preset === "web3") {
      instruction =
        "You are an interactive Web3 and crypto architect. Speak clearly and concisely about Bitcoin, Solana Proof of History, mempool latency, and decentralized consensus.";
    } else if (preset === "nodejs") {
      instruction =
        "You are an expert Node.js runtime and systems engineer. Help with asynchronous I/O, event loops, TCP sockets, and low-latency performance.";
    } else if (preset === "security") {
      instruction =
        "You are a Senior Cybersecurity and Cryptography specialist. Explain encryption, NIST standards, AEAD AES-256-GCM, and security postures in simple, articulate spoken words.";
    } else {
      instruction =
        "You are a friendly, conversational AI assistant with voice capabilities. Answer questions naturally and helpfully.";
    }
    setCustomPrompt(instruction);

    // If connected, notify backend of voice/instruction change
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "reconnect_voice",
          voiceName: selectedVoice,
          systemInstruction: instruction,
        })
      );
    }
  };

  const handleVoiceChange = (voice: "Zephyr" | "Puck" | "Kore" | "Fenrir" | "Charon") => {
    setSelectedVoice(voice);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "reconnect_voice",
          voiceName: voice,
          systemInstruction: customPrompt,
        })
      );
    }
  };

  // Helper: Float32Array to 16-bit PCM ArrayBuffer
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  };

  // Helper: ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Helper: Base64 24kHz PCM to Float32Array for AudioContext
  const base64ToFloat32Array = (base64: string): Float32Array => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  };

  // Stop all active audio playback (for barge-in / interruptions)
  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (_e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  };

  // Play incoming 24kHz PCM audio chunk gaplessly
  const scheduleAudioChunk = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const pcmFloat32 = base64ToFloat32Array(base64Audio);
    const buffer = ctx.createBuffer(1, pcmFloat32.length, 24000);
    buffer.getChannelData(0).set(pcmFloat32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    activeSourcesRef.current.push(source);

    setVoiceState("speaking");

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setVoiceState("listening");
      }
    };
  };

  // Retry requesting microphone permission without restarting the live voice session
  const retryMicrophone = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMicStatus("granted");
      setMicNotice(null);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      if (inputCtx.state === "suspended") await inputCtx.resume();
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) {
          setAudioLevel(0);
          return;
        }

        const channelData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        setAudioLevel(Math.min(100, Math.round(rms * 400)));

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pcmBuffer = floatTo16BitPCM(channelData);
          const base64Audio = arrayBufferToBase64(pcmBuffer);
          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              audio: base64Audio,
            })
          );
        }
      };

      setTranscripts((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: "🎤 Microphone permission granted! Live microphone streaming is now active.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      console.warn("Retry microphone failed:", err?.message || err);
      setMicStatus("denied");
      setMicNotice(
        "Microphone permission is still blocked. You can continue speaking with Gemini Live via Text & Voice Output Mode!"
      );
    }
  };

  // Helper to send quick voice prompts
  const sendQuickPrompt = (promptText: string) => {
    if (!isConnected) {
      connectSession();
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          setVoiceState("thinking");
          wsRef.current.send(JSON.stringify({ type: "text", text: promptText }));
        }
      }, 700);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setVoiceState("thinking");
      wsRef.current.send(JSON.stringify({ type: "text", text: promptText }));
    }

    setTranscripts((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: promptText,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Start live session (with graceful Voice Output Mode if microphone is denied)
  const connectSession = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    setMicNotice(null);
    stopAllPlayback();

    let stream: MediaStream | null = null;
    let micGranted = false;

    // 1. Try to acquire microphone stream (non-fatal if denied by browser/iframe)
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        micGranted = true;
        setMicStatus("granted");
      } else {
        setMicStatus("unsupported");
        setMicNotice("Microphone API is not supported in this browser. Running in Voice Output Mode.");
      }
    } catch (err: any) {
      console.warn("Microphone access could not be acquired (activating Voice Output Mode):", err?.message || err);
      micGranted = false;
      setMicStatus("denied");
      setMicNotice(
        "Microphone access was denied or blocked by browser permissions. Voice Output Mode is active: You can send prompts and hear Gemini speak back in real time!"
      );
    }

    try {
      // 2. Setup Output AudioContext (24kHz for Gemini Live audio playback)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      if (outputCtx.state === "suspended") await outputCtx.resume();
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 3. If microphone was granted, setup input audio processor
      if (micGranted && stream) {
        try {
          const inputCtx = new AudioCtx({ sampleRate: 16000 });
          if (inputCtx.state === "suspended") await inputCtx.resume();
          inputAudioCtxRef.current = inputCtx;

          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (isMutedRef.current) {
              setAudioLevel(0);
              return;
            }

            const channelData = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < channelData.length; i++) {
              sum += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sum / channelData.length);
            setAudioLevel(Math.min(100, Math.round(rms * 400)));

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const pcmBuffer = floatTo16BitPCM(channelData);
              const base64Audio = arrayBufferToBase64(pcmBuffer);
              wsRef.current.send(
                JSON.stringify({
                  type: "audio",
                  audio: base64Audio,
                })
              );
            }
          };
        } catch (inputErr: any) {
          console.warn("Input audio processor setup error, falling back to output-only mode:", inputErr);
          micGranted = false;
          setMicStatus("denied");
        }
      }

      // 4. Connect WebSocket to backend Live Voice proxy
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setVoiceState("listening");

        ws.send(
          JSON.stringify({
            type: "reconnect_voice",
            voiceName: selectedVoice,
            systemInstruction: customPrompt,
          })
        );

        setTranscripts((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: "system",
            text: micGranted
              ? `Connected to Gemini Live (${selectedVoice} voice). Start speaking into your microphone!`
              : `Connected to Gemini Live (${selectedVoice} voice). Voice Output Mode active! You can type or click quick prompts below to hear Gemini speak in 24kHz audio.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "session_ready") {
            setVoiceState("listening");
          } else if (msg.type === "audio" && msg.audio) {
            scheduleAudioChunk(msg.audio);
          } else if (msg.type === "text" && msg.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === "model") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + msg.text },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `model-${Date.now()}`,
                    sender: "model",
                    text: msg.text,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ];
              }
            });
          } else if (msg.type === "interrupted") {
            stopAllPlayback();
            setVoiceState("listening");
          } else if (msg.type === "turn_complete") {
            if (activeSourcesRef.current.length === 0) {
              setVoiceState("listening");
            }
          } else if (msg.type === "error") {
            setErrorMsg(msg.error);
          }
        } catch (err: any) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (_e) => {
        setErrorMsg("WebSocket connection error to Gemini Live API.");
        disconnectSession();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setVoiceState("idle");
      };
    } catch (err: any) {
      console.error("Failed to initialize voice session:", err);
      setErrorMsg(`Audio Session Error: ${err?.message || "Failed to initialize audio."}`);
      disconnectSession();
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectSession = () => {
    stopAllPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_e) {}
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_e) {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (_e) {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_e) {}
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setVoiceState("idle");
    setAudioLevel(0);
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userText = textInput.trim();
    setTextInput("");

    setTranscripts((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setVoiceState("thinking");
      wsRef.current.send(
        JSON.stringify({
          type: "text",
          text: userText,
        })
      );
    } else {
      setErrorMsg("Voice session is disconnected. Connect to talk to Gemini Live.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-zinc-950 text-white rounded-2xl p-6 border border-indigo-800/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  Gemini Live AI Voice Conversation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  gemini-3.8-live
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Live API
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                Experience natural, bidirectional real-time audio conversations powered by the <strong>gemini-3.8-live</strong> model. Features sub-second latency, natural barge-in interruptions, and synchronized 24kHz audio playback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {isConnected ? (
              <button
                type="button"
                onClick={disconnectSession}
                className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-mono text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={connectSession}
                disabled={isConnecting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PhoneCall className="w-4 h-4" />
                )}
                <span>{isConnecting ? "Connecting Live API..." : "Start Voice Conversation"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/40 font-mono text-xs">
          <div className="bg-indigo-900/20 rounded-xl p-3 border border-indigo-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Session Status</span>
            </div>
            <div className="text-sm font-bold text-white mt-1 flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-ping" : "bg-zinc-500"
                }`}
              />
              <span className="capitalize">{isConnected ? voiceState : "Disconnected"}</span>
            </div>
          </div>

          <div className="bg-indigo-900/20 rounded-xl p-3 border border-indigo-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Model</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-1">
              gemini-3.8-live
            </div>
          </div>

          <div className="bg-indigo-900/20 rounded-xl p-3 border border-indigo-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Persona</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {selectedVoice} (24kHz)
            </div>
          </div>

          <div className="bg-indigo-900/20 rounded-xl p-3 border border-indigo-800/30">
            <div className="text-zinc-400 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio Channel</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-1">
              {isConnected ? "16kHz In / 24kHz Out" : "Standby"}
            </div>
          </div>
        </div>
      </div>

      {/* Microphone Permission Status & Voice Output Banner */}
      {micNotice && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-950 text-xs shadow-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Headphones className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-semibold">{micNotice}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={retryMicrophone}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1 cursor-pointer transition shadow-2xs"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Request Mic Access Again</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPermHelp(!showPermHelp)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>{showPermHelp ? "Hide Guide" : "How to Unblock"}</span>
              </button>
            </div>
          </div>

          {showPermHelp && (
            <div className="p-3 bg-white/95 border border-amber-200 rounded-xl text-[11px] text-zinc-700 space-y-1 mt-1">
              <div className="font-bold text-amber-900">How to enable microphone in your browser:</div>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-600">
                <li><strong>Chrome / Brave / Edge:</strong> Click the icon to the left of the URL in your address bar (padlock or tune icon) &rarr; Site settings &rarr; <strong>Microphone</strong> &rarr; Select <strong>Allow</strong> &rarr; Click &quot;Request Mic Access Again&quot; above.</li>
                <li><strong>Firefox:</strong> Click the microphone/permission icon left of URL &rarr; Clear blocked state &rarr; Click Retry.</li>
                <li><strong>Safari / iOS:</strong> Settings &rarr; Safari &rarr; Microphone &rarr; Set to Allow.</li>
                <li><em>Tip:</em> You can keep using <strong>Text &amp; Voice Output Mode</strong> without any microphone permission! Just type or click any quick prompt to hear Gemini Live answer with full 24kHz audio.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Interactive Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Voice Control & Live Orb/Waveform */}
        <div className="lg:col-span-1 space-y-6">
          {/* Visual Voice State Orb */}
          <div className="bg-zinc-950 text-white rounded-2xl p-6 border border-zinc-800 text-center flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
            {/* Visualizer Background Glow */}
            <div
              className={`absolute inset-0 opacity-20 blur-2xl transition-all duration-500 pointer-events-none ${
                voiceState === "speaking"
                  ? "bg-cyan-500"
                  : voiceState === "listening"
                  ? "bg-emerald-500"
                  : voiceState === "thinking"
                  ? "bg-purple-500"
                  : "bg-zinc-800"
              }`}
            />

            <div className="relative">
              {/* Outer pulsing ring */}
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  voiceState === "speaking"
                    ? "bg-cyan-500/20 ring-4 ring-cyan-400/40 scale-105"
                    : voiceState === "listening"
                    ? "bg-emerald-500/20 ring-4 ring-emerald-400/30"
                    : voiceState === "thinking"
                    ? "bg-purple-500/20 ring-4 ring-purple-400/40 animate-pulse"
                    : "bg-zinc-900 ring-2 ring-zinc-800"
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-inner ${
                    voiceState === "speaking"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white animate-pulse"
                      : voiceState === "listening"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                      : voiceState === "thinking"
                      ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {voiceState === "speaking" ? (
                    <Volume2 className="w-9 h-9 animate-bounce" />
                  ) : isMuted ? (
                    <MicOff className="w-9 h-9 text-red-400" />
                  ) : (
                    <Mic className="w-9 h-9" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base tracking-wide">
                {voiceState === "speaking"
                  ? "Gemini is Speaking..."
                  : voiceState === "listening"
                  ? micStatus === "denied"
                    ? "Voice Output Mode Active"
                    : isMuted
                    ? "Microphone Muted"
                    : "Listening to You..."
                  : voiceState === "thinking"
                  ? "Processing Live Audio..."
                  : "Voice Session Standby"}
              </h3>
              <p className="text-xs text-zinc-400">
                {isConnected
                  ? micStatus === "denied"
                    ? "Microphone blocked: Type or click quick prompts to hear Gemini speak."
                    : "Speak naturally. Interrupt at any time to take the turn."
                  : "Press Start to connect voice session."}
              </p>
            </div>

            {/* Audio waveform / mic volume indicator */}
            <div className="w-full space-y-1 pt-2">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>{micStatus === "denied" ? "Audio Mode" : "Mic Input Level"}</span>
                <span>{micStatus === "denied" ? "Output-Only (24kHz)" : `${audioLevel}%`}</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-75 ${
                    micStatus === "denied"
                      ? "bg-cyan-500 w-full"
                      : isMuted
                      ? "bg-zinc-700"
                      : audioLevel > 50
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                  style={{ width: micStatus === "denied" ? "100%" : `${isConnected && !isMuted ? audioLevel : 0}%` }}
                />
              </div>
            </div>

            {/* Action Bar: Mute / Connect */}
            <div className="flex gap-2 w-full pt-2">
              {isConnected ? (
                <>
                  {micStatus === "denied" ? (
                    <button
                      type="button"
                      onClick={retryMicrophone}
                      className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 hover:bg-cyan-600/40"
                    >
                      <Mic className="w-4 h-4 text-cyan-300" />
                      <span>Request Mic</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        isMuted
                          ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                          : "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700"
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isMuted ? "Unmute Mic" : "Mute Mic"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={disconnectSession}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={connectSession}
                  disabled={isConnecting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <PhoneCall className="w-4 h-4" />
                  )}
                  <span>{isConnecting ? "Connecting..." : "Connect Voice Session"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice & System Persona Configuration */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              <span>Voice &amp; Persona Settings</span>
            </h4>

            {/* Voice Persona Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Prebuilt Voice</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(["Zephyr", "Puck", "Kore", "Fenrir", "Charon"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleVoiceChange(v)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      selectedVoice === v
                        ? "bg-indigo-600 text-white shadow-xs font-bold"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Role &amp; Context Preset</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "web3", label: "Web3 & Crypto" },
                  { id: "nodejs", label: "Node.js & Sockets" },
                  { id: "security", label: "Cybersecurity SOC" },
                  { id: "general", label: "General Assistant" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer text-left ${
                      selectedPreset === p.id
                        ? "bg-zinc-900 text-white font-bold"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom System Instruction */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500">System Instruction</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 focus:outline-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Transcript & Text Chat Fallback */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col h-[580px]">
          {/* Transcript Header */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Waveform className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Live Conversation Transcripts &amp; Messages
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                setTranscripts([
                  {
                    id: "clear-1",
                    sender: "system",
                    text: "Conversation transcript cleared.",
                    timestamp: new Date().toLocaleTimeString(),
                  },
                ])
              }
              className="text-[11px] text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          {/* Transcript Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcripts.map((t) => (
              <div
                key={t.id}
                className={`flex flex-col ${
                  t.sender === "user"
                    ? "items-end"
                    : t.sender === "model"
                    ? "items-start"
                    : "items-center"
                }`}
              >
                {t.sender === "system" ? (
                  <div className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[11px] font-mono text-center max-w-md">
                    {t.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                      t.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-bl-xs"
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 font-bold text-[10px] opacity-80 uppercase tracking-wider">
                      {t.sender === "user" ? (
                        <>
                          <User className="w-3 h-3" />
                          <span>You (Mic Input)</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-indigo-600" />
                          <span>Gemini Live ({selectedVoice})</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{t.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{t.text}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Voice Prompts Strip */}
          <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              Quick Prompts:
            </span>
            {[
              "Explain Flash Loan Arbitrage",
              "How does Bitcoin mempool work?",
              "Explain Solana Proof of History",
              "What is Port 8545 EVM RPC?",
              "How does Reality Bridge Port 7777 work?",
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuickPrompt(prompt)}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-zinc-700 rounded-lg border border-zinc-200 whitespace-nowrap text-[11px] font-medium transition cursor-pointer shadow-2xs shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Text Input Fallback Bar */}
          <form
            onSubmit={handleSendTextMessage}
            className="p-3 border-t border-zinc-100 bg-zinc-50 rounded-b-2xl flex items-center space-x-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isConnected
                  ? "Speak into your mic or type a prompt here..."
                  : "Connect voice session above to speak or send text..."
              }
              className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-indigo-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || !isConnected}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 cursor-pointer transition-colors shadow-2xs"
              title="Send text message to Live API"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
