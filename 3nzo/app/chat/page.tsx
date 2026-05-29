"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/message-content";

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
      <div className="border-b border-slate-200/50 bg-white/70 backdrop-blur-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image
              src="/geeko-avatar.png"
              alt="3nzo"
              width={36}
              height={36}
              className="rounded-xl shadow-md object-cover aspect-square"
            />
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-white"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-geeko-navy to-geeko-teal bg-clip-text text-transparent">
              Chat with 3nzo
            </h1>
            <p className="text-[10px] text-slate-500">
              Ask questions, get insights, execute changes
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              {message.role === "assistant" ? (
                <div className="h-7 w-7 shrink-0 rounded-lg shadow-sm overflow-hidden">
                  <Image
                    src="/geeko-avatar.png"
                    alt="3nzo"
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm bg-gradient-to-br from-geeko-navy to-slate-700 text-white">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%]",
                  message.role === "assistant"
                    ? "chat-bubble-assistant"
                    : "chat-bubble-user"
                )}
              >
                <MessageContent
                  content={message.content}
                  isUser={message.role === "user"}
                />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 shrink-0 rounded-lg shadow-sm overflow-hidden">
                <Image
                  src="/geeko-avatar.png"
                  alt="3nzo"
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="chat-bubble-assistant">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-geeko-teal" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions (show only if no messages yet) */}
      {messages.length === 1 && (
        <div className="px-5 pb-3">
          <div className="max-w-2xl mx-auto">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:border-geeko-teal hover:text-geeko-teal transition-all duration-200"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200/50 bg-white/70 backdrop-blur-xl p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
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
              className="btn-primary px-4"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
