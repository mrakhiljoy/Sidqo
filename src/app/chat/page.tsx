"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import LoginModal from "@/components/LoginModal";
import UpgradeModal from "@/components/UpgradeModal";
import { trackEvent } from "@/components/PostHogProvider";
import {
  FREE_MESSAGE_LIMIT,
  hasReachedLimit,
  incrementCount,
} from "@/hooks/useMessageQuota";
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
  Paperclip,
  FileText,
  X,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface DocumentAttachment {
  fileName: string;
  fileType: string;
  pageCount?: number;
  textLength: number;
  extractedText: string;
  needsTranslation?: boolean;
  wasTranslated?: boolean;
  detectedLanguage?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  document?: DocumentAttachment;
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

// Keys that survive page navigation and OAuth/Stripe redirects
const PENDING_MSG_KEY = "sidqo_pending_msg";
const PENDING_REASON_KEY = "sidqo_pending_reason"; // "login" | "upgrade"
const PENDING_DOC_KEY = "sidqo_pending_doc"; // stringified DocumentAttachment
const PENDING_UPLOAD_KEY = "sidqo_pending_upload"; // "true" if user was trying to upload before login
const PRIVACY_NOTICE_COUNT_KEY = "sidqo_privacy_notice_count";

// Chat history persistence (survives redirects and sessions)
const CHAT_HISTORY_ANON_KEY = "sidqo_chat_anon"; // pre-login
const chatHistoryKey = (email: string) => `sidqo_chat_${email}`; // per-user

function ChatContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<DocumentAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const pendingMessageRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasShownPrivacyNotice = useRef(false);

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

  // Restore saved chat history from localStorage.
  // Returns the restored messages so callers can pass them directly to sendMessage
  // (avoids React state timing: setMessages is async, sendMessage reads stale `messages`)
  const restoreChatHistory = (email?: string | null): Message[] => {
    // 1. Always prefer per-user chat (scoped to this account)
    if (email) {
      const emailChat = localStorage.getItem(chatHistoryKey(email));
      if (emailChat) {
        try {
          const saved: Message[] = JSON.parse(emailChat);
          if (Array.isArray(saved) && saved.length > 0) {
            setMessages(saved);
            return saved;
          }
        } catch {}
      }
    }

    // 2. Only fall back to anon chat if there's a pending login/upload marker,
    //    meaning this user was chatting pre-login and just authenticated.
    //    Without this guard, switching accounts leaks User A's chat to User B.
    const reason = localStorage.getItem(PENDING_REASON_KEY);
    const pendingUpload = localStorage.getItem(PENDING_UPLOAD_KEY);
    const isOwnAnonChat = reason === "login" || !!pendingUpload;

    if (isOwnAnonChat) {
      const anonChat = localStorage.getItem(CHAT_HISTORY_ANON_KEY);
      if (anonChat) {
        try {
          const saved: Message[] = JSON.parse(anonChat);
          if (Array.isArray(saved) && saved.length > 0) {
            // Promote anon chat to this user's key
            if (email) {
              localStorage.setItem(chatHistoryKey(email), anonChat);
            }
            localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
            setMessages(saved);
            return saved;
          }
        } catch {}
      }
    }

    // 3. Stale anon chat from a different user — clear it
    localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
    return [];
  };

  // Recovery 1: Login flow
  // Fires when session arrives — works for same-session login (ref) AND
  // page-reload login (localStorage, survives Google OAuth redirect)
  useEffect(() => {
    if (!session) return;

    // Restore full chat history first (always, on every session arrival)
    const email = session.user?.email;
    const restored = messages.length === 0 ? restoreChatHistory(email) : messages;

    // Check for pending document from before sign-in
    const pendingDocStr = localStorage.getItem(PENDING_DOC_KEY);
    if (pendingDocStr) {
      try {
        const doc = JSON.parse(pendingDocStr);
        setPendingDocument(doc);
        localStorage.removeItem(PENDING_DOC_KEY);
      } catch {}
    }

    // Check if user was trying to upload before login
    const pendingUpload = localStorage.getItem(PENDING_UPLOAD_KEY);
    if (pendingUpload) {
      localStorage.removeItem(PENDING_UPLOAD_KEY);
      setShowLoginModal(false);
      const noticeCount = parseInt(localStorage.getItem(PRIVACY_NOTICE_COUNT_KEY) || "0", 10);
      if (noticeCount < 3) {
        localStorage.setItem(PRIVACY_NOTICE_COUNT_KEY, String(noticeCount + 1));
        setShowPrivacyNotice(true);
      } else {
        setTimeout(() => fileInputRef.current?.click(), 100);
      }
      return;
    }

    // Same-session: ref is set (no page reload happened)
    if (pendingMessageRef.current) {
      const pending = pendingMessageRef.current;
      pendingMessageRef.current = null;
      localStorage.removeItem(PENDING_MSG_KEY);
      localStorage.removeItem(PENDING_REASON_KEY);
      setShowLoginModal(false);
      sendMessage(pending, restored.length > 0 ? restored : undefined);
      return;
    }

    // Cross-reload: ref is gone, check localStorage for login/upgrade-origin pending
    const reason = localStorage.getItem(PENDING_REASON_KEY);
    const pending = localStorage.getItem(PENDING_MSG_KEY);
    if (pending && (reason === "login" || reason === "upgrade")) {
      localStorage.removeItem(PENDING_MSG_KEY);
      localStorage.removeItem(PENDING_REASON_KEY);
      setShowLoginModal(false);
      setShowUpgradeModal(false);
      sendMessage(pending, restored.length > 0 ? restored : undefined);
    }
  }, [session]);

  // Recovery 2: Stripe upgrade flow
  // Fires when subscriptionStatus transitions to "active"
  useEffect(() => {
    if (session?.user?.subscriptionStatus !== "active") return;

    const reason = localStorage.getItem(PENDING_REASON_KEY);
    const pending = localStorage.getItem(PENDING_MSG_KEY);
    if (pending && reason === "upgrade") {
      localStorage.removeItem(PENDING_MSG_KEY);
      localStorage.removeItem(PENDING_REASON_KEY);
      setShowUpgradeModal(false);
      const email = session.user?.email;
      const restored = messages.length === 0 ? restoreChatHistory(email) : messages;
      sendMessage(pending, restored.length > 0 ? restored : undefined);
    }
  }, [session?.user?.subscriptionStatus]);

  // Auto-save full chat history on every message change
  useEffect(() => {
    if (messages.length === 0) return;
    if (session?.user?.email) {
      // Logged in: save ONLY to per-user key. Clear anon key to prevent
      // chat leaking to a different account on next sign-in.
      localStorage.setItem(chatHistoryKey(session.user.email), JSON.stringify(messages));
      localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
    } else {
      // Not logged in: save to anon key (will be promoted on login)
      localStorage.setItem(CHAT_HISTORY_ANON_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string, restoredMessages?: Message[]) => {
    const text = messageText || input.trim();
    if ((!text && !pendingDocument) || isStreaming) return;

    // Gate behind auth — show login modal if not signed in
    if (!session) {
      pendingMessageRef.current = text;
      // Save full conversation snapshot so it survives the Google OAuth redirect
      if (messages.length > 0) {
        localStorage.setItem(CHAT_HISTORY_ANON_KEY, JSON.stringify(messages));
      }
      localStorage.setItem(PENDING_MSG_KEY, text);
      localStorage.setItem(PENDING_REASON_KEY, "login");
      setInput("");
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "chat", message_length: text.length });
      return;
    }

    // Gate behind subscription — check free tier quota
    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email &&
      hasReachedLimit("msg", session.user.email, FREE_MESSAGE_LIMIT)
    ) {
      // Save full conversation snapshot so it survives the Stripe Checkout redirect
      if (messages.length > 0) {
        localStorage.setItem(chatHistoryKey(session.user.email), JSON.stringify(messages));
      }
      localStorage.setItem(PENDING_MSG_KEY, text);
      localStorage.setItem(PENDING_REASON_KEY, "upgrade");
      setShowUpgradeModal(true);
      trackEvent("upgrade_modal_shown", { trigger: "chat", messages_used: FREE_MESSAGE_LIMIT });
      return;
    }

    // Increment message count for free users
    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email
    ) {
      incrementCount("msg", session.user.email);
    }

    // Track the message
    trackEvent("chat_message_sent", {
      message_length: text.length,
      is_first_message: messages.length === 0,
      subscription_status: session.user?.subscriptionStatus || "free",
      total_messages: messages.length + 1,
      has_document: !!pendingDocument,
    });

    // Build the user message, optionally with document context
    let messageContent = text;
    const attachedDoc = pendingDocument;
    if (attachedDoc) {
      messageContent = `${text}\n\n---UPLOADED DOCUMENT: ${attachedDoc.fileName} (${attachedDoc.fileType.toUpperCase()}${attachedDoc.pageCount ? `, ${attachedDoc.pageCount} pages` : ""})---\n${attachedDoc.extractedText}\n---END DOCUMENT---`;
      setPendingDocument(null);
    }

    const userMessage: Message = {
      role: "user",
      content: messageContent,
      document: attachedDoc || undefined,
    };
    // Use restoredMessages if provided (recovery path — React state may not have updated yet)
    const baseMessages = restoredMessages ?? messages;
    const newMessages: Message[] = [...baseMessages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    // For the API, send plain content (document text is embedded in the content)
    const apiMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
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
    setPendingDocument(null);
    setUploadError(null);
    localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
    if (session?.user?.email) {
      localStorage.removeItem(chatHistoryKey(session.user.email));
    }
  };

  const handlePaperclipClick = () => {
    setUploadError(null);

    // Check auth
    if (!session) {
      localStorage.setItem(PENDING_UPLOAD_KEY, "true");
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "document_upload" });
      return;
    }

    // Check subscription — document upload is Starter+ only, counts toward message limit
    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email &&
      hasReachedLimit("msg", session.user.email, FREE_MESSAGE_LIMIT)
    ) {
      setShowUpgradeModal(true);
      trackEvent("upgrade_modal_shown", { trigger: "document_upload" });
      return;
    }

    // Show privacy notice on first 3 paperclip clicks
    const noticeCount = parseInt(localStorage.getItem(PRIVACY_NOTICE_COUNT_KEY) || "0", 10);
    if (noticeCount < 3) {
      localStorage.setItem(PRIVACY_NOTICE_COUNT_KEY, String(noticeCount + 1));
      setShowPrivacyNotice(true);
      return;
    }

    // Auto-open file picker
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a PDF or Word (.docx) file.");
      return;
    }

    // Validate file size
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File size exceeds 25MB limit.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        setUploadError("Server error while processing your document. Please try again.");
        return;
      }

      if (!res.ok) {
        setUploadError((data.error as string) || "Failed to process document.");
        return;
      }

      trackEvent("document_uploaded", {
        file_type: data.fileType,
        page_count: data.pageCount,
        text_length: data.textLength,
        needs_translation: data.needsTranslation,
        subscription_status: session?.user?.subscriptionStatus || "free",
      });

      const docAttachment: DocumentAttachment = {
        fileName: data.fileName as string,
        fileType: data.fileType as string,
        pageCount: data.pageCount as number | undefined,
        textLength: data.textLength as number,
        extractedText: data.extractedText as string,
        needsTranslation: data.needsTranslation as boolean | undefined,
        wasTranslated: data.wasTranslated as boolean | undefined,
        detectedLanguage: data.detectedLanguage as string | undefined,
      };

      setPendingDocument(docAttachment);
    } catch {
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
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
                        {msg.document && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gold-400/15">
                            <FileText className="w-4 h-4 text-gold-400" />
                            <span className="text-xs text-gold-400 font-medium">{msg.document.fileName}</span>
                            {msg.document.pageCount && (
                              <span className="text-xs text-warm-white/40">{msg.document.pageCount} pages</span>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-warm-white/90 leading-relaxed whitespace-pre-wrap">
                          {msg.document
                            ? msg.content.split("\n\n---UPLOADED DOCUMENT:")[0] || "I've uploaded a document for review."
                            : msg.content}
                        </p>
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
        <div
          className={`border-t border-gold-400/10 bg-navy-700/30 backdrop-blur-sm p-4 transition-colors ${isDragOver ? "bg-gold-400/5 border-gold-400/30" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="max-w-3xl mx-auto">
            {/* Drag overlay */}
            {isDragOver && (
              <div className="flex items-center justify-center gap-2 py-3 mb-3 rounded-xl border-2 border-dashed border-gold-400/40 bg-gold-400/5">
                <Upload className="w-4 h-4 text-gold-400" />
                <span className="text-sm text-gold-400">Drop your document here</span>
              </div>
            )}

            {/* Pending document indicator */}
            {pendingDocument && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-gold-400/10 border border-gold-400/20">
                <FileText className="w-4 h-4 text-gold-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gold-400 font-medium truncate block">{pendingDocument.fileName}</span>
                  {pendingDocument.wasTranslated && (
                    <span className="text-xs text-warm-white/40">Translated from {pendingDocument.detectedLanguage}</span>
                  )}
                </div>
                {pendingDocument.pageCount && (
                  <span className="text-xs text-warm-white/40">{pendingDocument.pageCount} pages</span>
                )}
                <button
                  onClick={() => setPendingDocument(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-warm-white/40 hover:text-warm-white/70 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Upload processing state */}
            {isUploading && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-navy-600/50 border border-gold-400/10">
                <Loader2 className="w-4 h-4 text-gold-400 animate-spin" />
                <span className="text-sm text-warm-white/60">Reading your document...</span>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400 flex-1">{uploadError}</span>
                <button
                  onClick={() => setUploadError(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-red-400/60 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-3 items-end">
              {/* Upload button */}
              <button
                onClick={handlePaperclipClick}
                disabled={isStreaming || isUploading}
                className="w-11 h-11 rounded-xl border border-gold-400/20 text-warm-white/40 hover:text-gold-400 hover:border-gold-400/40 flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Upload document (PDF, DOCX)"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
                className="hidden"
              />

              <div className="flex-1 glass rounded-2xl border border-gold-400/20 focus-within:border-gold-400/50 transition-all overflow-hidden">
                <TextareaAutosize
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingDocument
                    ? "Add context about this document, or just press send..."
                    : "Ask about UAE law... (e.g., 'What are my rights if my employer delays my salary?')"
                  }
                  minRows={1}
                  maxRows={6}
                  className="w-full bg-transparent px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 resize-none focus:outline-none"
                  disabled={isStreaming}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !pendingDocument) || isStreaming}
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

        {/* Privacy Notice Modal */}
        {showPrivacyNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass mx-4 max-w-md rounded-2xl border border-gold-400/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold-400" />
                </div>
                <h3 className="text-lg font-semibold text-warm-white">Your documents are safe</h3>
              </div>
              <div className="space-y-3 text-sm text-warm-white/60 leading-relaxed">
                <p>Your documents are encrypted and only used to analyse your case. They are processed in real-time and not stored permanently.</p>
                <p>We never share your documents with third parties or use them for AI model training.</p>
              </div>
              <button
                onClick={() => {
                  setShowPrivacyNotice(false);
                  fileInputRef.current?.click();
                }}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 font-semibold text-sm hover:shadow-lg hover:shadow-gold-400/30 transition-all"
              >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
      <LoginModal isOpen={showLoginModal} />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
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
