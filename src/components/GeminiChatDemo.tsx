import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, Bot, User, RefreshCw, Sparkles, Terminal } from "lucide-react";
import type { ChatMessage } from "../types";

interface Props {
  apiKeyConfigured: boolean;
}

export function GeminiChatDemo({ apiKeyConfigured }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "model",
      content:
        "Hello! I am your Node.js & Gemini assistant. Ask me questions about Node.js event loops, streams, worker threads, or using the Gemini API in server-side apps.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gemini-3.1-flash-lite");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          messages: messages.filter((m) => m.id !== "init-1"),
          model,
          systemInstruction:
            "You are an expert Node.js architect and mentor. Explain concepts clearly, objectively, and concisely with brief code snippets when helpful.",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate chat response.");
      }

      const botMsg: ChatMessage = {
        id: "model-" + Date.now(),
        role: "model",
        content: data.text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setError(err?.message || "Chat turn failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "init-1",
        role: "model",
        content:
          "Chat history cleared. What Node.js or Gemini API concept would you like to explore next?",
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  };

  return (
    <div id="gemini-chat-container" className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Multi-Turn Chat in Node.js</h3>
            <p className="text-xs text-zinc-500">
              <code>ai.chats.create()</code> stateful conversational context
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-mono text-zinc-400 hidden sm:inline">model:</span>
          <select
            id="chat-model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading}
            className="text-xs font-mono bg-white border border-zinc-300 rounded px-2 py-1 text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast &amp; Reliable)</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (Alias)</option>
          </select>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Chat History"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/20">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-medium ${
                m.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-zinc-900 text-white rounded-tr-xs"
                  : "bg-white text-zinc-800 border border-zinc-200/80 shadow-2xs rounded-tl-xs whitespace-pre-wrap font-sans"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-zinc-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center space-x-2 text-xs text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Gemini is formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-t border-red-200">
          {error}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-zinc-200 flex gap-2">
        <input
          id="chat-user-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask a follow-up question (context is retained)..."
          className="flex-1 px-3 py-2 text-xs sm:text-sm border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
