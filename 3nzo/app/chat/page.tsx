"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hey! I'm **3nzo**, your paid media AI assistant.

I can help you with:
- **Query metrics** — "How much did Radiant Waxing spend last week?"
- **Competitive analysis** — "What's our Search Impression Share?"
- **Execute changes** — "Pause the Brand campaign for Amazing Lash"
- **Get insights** — "Which ad groups should we increase bids on?"

What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "How much did we spend this week?",
    "Show top performing campaigns",
    "What's our Search Impression Share?",
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="border-b border-slate-200/50 bg-white/70 backdrop-blur-xl px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl animated-gradient text-white shadow-lg shadow-teal-200">
              <Bot className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-geeko-navy to-geeko-teal bg-clip-text text-transparent">
              Chat with 3nzo
            </h1>
            <p className="text-sm text-slate-500">
              Ask questions, get insights, execute changes
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md",
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-geeko-teal to-teal-600 text-white"
                    : "bg-gradient-to-br from-geeko-navy to-slate-700 text-white"
                )}
              >
                {message.role === "assistant" ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[75%]",
                  message.role === "assistant"
                    ? "chat-bubble-assistant"
                    : "chat-bubble-user"
                )}
              >
                <div
                  className={cn(
                    "prose prose-sm max-w-none",
                    message.role === "user" && "prose-invert"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-geeko-teal to-teal-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="chat-bubble-assistant">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-geeko-teal" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions (show only if no messages yet) */}
      {messages.length === 1 && (
        <div className="px-8 pb-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:border-geeko-teal hover:text-geeko-teal transition-all duration-200"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200/50 bg-white/70 backdrop-blur-xl p-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask 3nzo anything..."
              className="input-field flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary px-5"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
