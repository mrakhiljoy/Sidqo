"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import {
  Scale,
  Send,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  ChevronDown,
  User,
  BookOpen,
  Briefcase,
  Home,
  Heart,
  Shield,
  Plane,
  DollarSign,
  ShoppingCart,
  RotateCcw,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  { icon: "💼", category: "Employment", questions: ["Was my termination legal?", "How do I calculate my end of service gratuity?", "My employer hasn't paid my salary for 2 months"] },
  { icon: "🏠", category: "Tenancy", questions: ["My landlord wants to evict me without notice", "Can my landlord increase rent mid-tenancy?", "My security deposit wasn't returned"] },
  { icon: "✈️", category: "Visa & Residency", questions: ["Am I eligible for a Golden Visa?", "What happens if my visa is cancelled?", "How can I transfer my visa?"] },
  { icon: "🏢", category: "Business", questions: ["How do I start a mainland company in UAE?", "What are the differences between free zone and mainland?", "My business partner is defrauding me"] },
  { icon: "⚖️", category: "Criminal", questions: ["I was arrested — what are my rights?", "Someone filed a cheque bounce case against me", "How do I report a crime in UAE?"] },
  { icon: "👨‍👩‍👧", category: "Family", questions: ["How does divorce work in UAE for expats?", "What are my child custody rights?", "How is inheritance handled under UAE law?"] },
];

const categoryIcons: Record<string, React.ElementType> = {
  "Employment": Briefcase,
  "Tenancy": Home,
  "Family": Heart,
  "Business": Scale,
  "Criminal": Shield,
  "Visa & Residency": Plane,
  "Debt & Finance": DollarSign,
  "Consumer Rights": ShoppingCart,
};

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      const presets: Record<string, string> = {
        termination: "My employer just terminated me. Was my termination legal under UAE Labour Law? What are my rights and entitlements?",
        tenant: "What are my rights as a tenant in UAE? I want to understand my full legal protections regarding rent increases, eviction, and security deposits.",
        "golden-visa": "Am I eligible for the UAE Golden Visa? What are the different categories and requirements?",
        business: "I want to start a business in UAE. What are my options — mainland vs free zone — and what steps do I need to follow?",
      };
      if (presets[q]) {
        setInput(presets[q]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isStreaming) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: accumulated };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please check your API key configuration and try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (content: string, id: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex h-screen pt-16 bg-navy-800">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-gold-400/10 bg-navy-700/50 backdrop-blur-sm">
        <div className="p-4 border-b border-gold-400/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-navy-900" />
            </div>
            <div>
              <div className="text-sm font-semibold text-warm-white">Sidqo AI Lawyer</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-warm-white/40">Online & Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-warm-white/30 uppercase tracking-wider font-medium mb-3">Quick Questions</p>
          <div className="space-y-2">
            {suggestedQuestions.map((cat, catIdx) => (
              <div key={cat.category}>
                <button
                  onClick={() => setActiveCategory(activeCategory === catIdx ? -1 : catIdx)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-sm text-warm-white/70 font-medium">{cat.category}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-warm-white/30 transition-transform ${activeCategory === catIdx ? "rotate-180" : ""}`}
                  />
                </button>
                {activeCategory === catIdx && (
                  <div className="ml-3 mt-1 space-y-1">
                    {cat.questions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left text-xs text-warm-white/50 hover:text-gold-400 px-3 py-2 rounded-lg hover:bg-gold-400/5 transition-all border border-transparent hover:border-gold-400/20"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {messages.length > 0 && (
          <div className="p-4 border-t border-gold-400/10">
            <button
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear Conversation
            </button>
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gold-400/10 bg-navy-700/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-navy-900" />
            </div>
            <div>
              <div className="text-sm font-semibold text-warm-white">Sidqo — UAE AI Lawyer</div>
              <div className="text-xs text-warm-white/40">Powered by Claude Opus · UAE Legal Expert</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-white/5 text-warm-white/40 hover:text-warm-white/70 transition-all"
                title="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              {/* Welcome state */}
              <div className="text-center mb-10 mt-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 flex items-center justify-center mx-auto mb-5 gold-glow">
                  <Scale className="w-10 h-10 text-gold-400" />
                </div>
                <h2 className="text-2xl font-bold text-warm-white mb-2">How can I help you today?</h2>
                <p className="text-warm-white/50 text-sm max-w-md mx-auto">
                  Ask me anything about UAE law. I'm trained on UAE Federal Laws, DIFC regulations, and local court precedents.
                </p>
              </div>

              {/* Quick suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Briefcase, text: "Was my termination legal under UAE Labour Law?", tag: "Employment" },
                  { icon: Home, text: "My landlord wants to increase rent by 30%", tag: "Tenancy" },
                  { icon: Plane, text: "Am I eligible for the UAE Golden Visa?", tag: "Immigration" },
                  { icon: Scale, text: "How do I file a case at Dubai Court?", tag: "Litigation" },
                  { icon: Shield, text: "Someone bounced a cheque on me — what can I do?", tag: "Criminal" },
                  { icon: BookOpen, text: "What are my consumer rights in UAE?", tag: "Consumer" },
                ].map(({ icon: Icon, text, tag }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="glass glass-hover rounded-xl p-4 text-left flex gap-3 items-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gold-400/70 font-medium mb-1">{tag}</div>
                      <div className="text-sm text-warm-white/80">{text}</div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-warm-white/25 mt-8">
                Or type your own question below. I understand plain English — no legal jargon needed.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 message-enter ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                      <Scale className="w-4.5 h-4.5 text-navy-900" />
                    </div>
                  )}

                  <div className={`group max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.role === "user" ? (
                      <div className="bg-gold-400/15 border border-gold-400/25 rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm text-warm-white/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="glass rounded-2xl rounded-tl-sm px-5 py-4">
                        {msg.content ? (
                          <div className="prose-legal text-sm">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            {isStreaming && idx === messages.length - 1 && (
                              <span className="inline-block w-0.5 h-4 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gold-400/60">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span className="text-sm">Analyzing UAE law...</span>
                          </div>
                        )}

                        {msg.content && !isStreaming && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyMessage(msg.content, idx)}
                              className="flex items-center gap-1.5 text-xs text-warm-white/30 hover:text-gold-400 transition-colors"
                            >
                              {copiedId === idx ? (
                                <><Check className="w-3 h-3" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy response</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-9 h-9 rounded-xl bg-navy-400/50 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-warm-white/60" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-gold-400/10 bg-navy-700/30 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 glass rounded-2xl border border-gold-400/20 focus-within:border-gold-400/50 transition-all overflow-hidden">
                <TextareaAutosize
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about UAE law... (e.g., 'What are my rights if my employer delays my salary?')"
                  minRows={1}
                  maxRows={6}
                  className="w-full bg-transparent px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 resize-none focus:outline-none"
                  disabled={isStreaming}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-gold-400/30 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-xs text-warm-white/20 mt-2">
              For informational purposes only · Not legal advice · Consult a licensed UAE attorney for serious matters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-800 flex items-center justify-center"><div className="text-gold-400">Loading...</div></div>}>
      <ChatContent />
    </Suspense>
  );
}
