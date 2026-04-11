"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
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

/* ── Easing tokens ─────────────────────────────── */
const EASE_OUT  = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

interface DocumentAttachment {
  fileName: string;
  fileType: string;
  pageCount?: number;
  textLength: number;
  extractedText: string;
  needsTranslation?: boolean;
  wasTranslated?: boolean;
  detectedLanguage?: string;
  imageData?: string;
  imageMediaType?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  document?: DocumentAttachment;
}

const suggestedQuestions = [
  { icon: "💼", category: "Employment", questions: ["Was my termination legal?", "How do I calculate my end of service gratuity?", "My employer hasn't paid my salary for 2 months"] },
  { icon: "🏠", category: "Tenancy",    questions: ["My landlord wants to evict me without notice", "Can my landlord increase rent mid-tenancy?", "My security deposit wasn't returned"] },
  { icon: "✈️", category: "Visa & Residency", questions: ["Am I eligible for a Golden Visa?", "What happens if my visa is cancelled?", "How can I transfer my visa?"] },
  { icon: "🏢", category: "Business",   questions: ["How do I start a mainland company in UAE?", "What are the differences between free zone and mainland?", "My business partner is defrauding me"] },
  { icon: "⚖️", category: "Criminal",   questions: ["I was arrested — what are my rights?", "Someone filed a cheque bounce case against me", "How do I report a crime in UAE?"] },
  { icon: "👨‍👩‍👧", category: "Family",   questions: ["How does divorce work in UAE for expats?", "What are my child custody rights?", "How is inheritance handled under UAE law?"] },
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

const PENDING_MSG_KEY         = "sidqo_pending_msg";
const PENDING_REASON_KEY      = "sidqo_pending_reason";
const PENDING_DOC_KEY         = "sidqo_pending_doc";
const PENDING_UPLOAD_KEY      = "sidqo_pending_upload";
const PRIVACY_NOTICE_COUNT_KEY = "sidqo_privacy_notice_count";
const CHAT_HISTORY_ANON_KEY   = "sidqo_chat_anon";
const chatHistoryKey = (email: string) => `sidqo_chat_${email}`;

/* ── Welcome suggestion cards ─────────────────── */
const welcomeCards = [
  { icon: Briefcase, text: "Was my termination legal under UAE Labour Law?", tag: "Employment" },
  { icon: Home,      text: "My landlord wants to increase rent by 30%",       tag: "Tenancy" },
  { icon: Plane,     text: "Am I eligible for the UAE Golden Visa?",          tag: "Immigration" },
  { icon: Scale,     text: "How do I file a case at Dubai Court?",            tag: "Litigation" },
  { icon: Shield,    text: "Someone bounced a cheque on me — what can I do?", tag: "Criminal" },
  { icon: BookOpen,  text: "What are my consumer rights in UAE?",             tag: "Consumer" },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState("");
  const [isStreaming, setIsStreaming]        = useState(false);
  const [copiedId, setCopiedId]             = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState(-1);
  const [showLoginModal, setShowLoginModal]   = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<DocumentAttachment | null>(null);
  const [isUploading, setIsUploading]       = useState(false);
  const [uploadError, setUploadError]       = useState<string | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [isDragOver, setIsDragOver]         = useState(false);

  const pendingMessageRef = useRef<string | null>(null);
  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const hasShownPrivacyNotice = useRef(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      const presets: Record<string, string> = {
        termination:   "My employer just terminated me. Was my termination legal under UAE Labour Law? What are my rights and entitlements?",
        tenant:        "What are my rights as a tenant in UAE? I want to understand my full legal protections regarding rent increases, eviction, and security deposits.",
        "golden-visa": "Am I eligible for the UAE Golden Visa? What are the different categories and requirements?",
        business:      "I want to start a business in UAE. What are my options — mainland vs free zone — and what steps do I need to follow?",
        gratuity:      "Please review my UAE gratuity entitlement. I want to understand my end-of-service gratuity, final settlement, unpaid leave effect, and what I can do if my employer disagrees with the amount.",
        "salary-delay":"My employer is delaying my salary or end-of-service dues in the UAE. What are my rights, how long should I wait, and how do I file a MOHRE complaint step by step?",
      };
      if (presets[q]) setInput(presets[q]);
    }
  }, [searchParams]);

  const restoreChatHistory = (email?: string | null): Message[] => {
    if (email) {
      const emailChat = localStorage.getItem(chatHistoryKey(email));
      if (emailChat) {
        try {
          const saved: Message[] = JSON.parse(emailChat);
          if (Array.isArray(saved) && saved.length > 0) { setMessages(saved); return saved; }
        } catch {}
      }
    }
    const reason = localStorage.getItem(PENDING_REASON_KEY);
    const pendingUpload = localStorage.getItem(PENDING_UPLOAD_KEY);
    const isOwnAnonChat = reason === "login" || !!pendingUpload;
    if (isOwnAnonChat) {
      const anonChat = localStorage.getItem(CHAT_HISTORY_ANON_KEY);
      if (anonChat) {
        try {
          const saved: Message[] = JSON.parse(anonChat);
          if (Array.isArray(saved) && saved.length > 0) {
            if (email) localStorage.setItem(chatHistoryKey(email), anonChat);
            localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
            setMessages(saved);
            return saved;
          }
        } catch {}
      }
    }
    localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
    return [];
  };

  useEffect(() => {
    if (!session) return;
    const email = session.user?.email;
    const restored = messages.length === 0 ? restoreChatHistory(email) : messages;

    const pendingDocStr = localStorage.getItem(PENDING_DOC_KEY);
    if (pendingDocStr) {
      try { const doc = JSON.parse(pendingDocStr); setPendingDocument(doc); localStorage.removeItem(PENDING_DOC_KEY); } catch {}
    }

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

    if (pendingMessageRef.current) {
      const pending = pendingMessageRef.current;
      pendingMessageRef.current = null;
      localStorage.removeItem(PENDING_MSG_KEY);
      localStorage.removeItem(PENDING_REASON_KEY);
      setShowLoginModal(false);
      sendMessage(pending, restored.length > 0 ? restored : undefined);
      return;
    }

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

  // Strip large imageData before persisting to localStorage
  const stripImageData = (msgs: Message[]) =>
    msgs.map((m) =>
      m.document?.imageData
        ? { ...m, document: { ...m.document, imageData: undefined, imageMediaType: undefined } }
        : m
    );

  useEffect(() => {
    if (messages.length === 0) return;
    const serializable = stripImageData(messages);
    if (session?.user?.email) {
      localStorage.setItem(chatHistoryKey(session.user.email), JSON.stringify(serializable));
      localStorage.removeItem(CHAT_HISTORY_ANON_KEY);
    } else {
      localStorage.setItem(CHAT_HISTORY_ANON_KEY, JSON.stringify(serializable));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string, restoredMessages?: Message[]) => {
    const text = messageText || input.trim();
    if ((!text && !pendingDocument) || isStreaming) return;

    if (!session) {
      pendingMessageRef.current = text;
      if (messages.length > 0) localStorage.setItem(CHAT_HISTORY_ANON_KEY, JSON.stringify(stripImageData(messages)));
      localStorage.setItem(PENDING_MSG_KEY, text);
      localStorage.setItem(PENDING_REASON_KEY, "login");
      setInput("");
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "chat", message_length: text.length });
      return;
    }

    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email &&
      hasReachedLimit("msg", session.user.email, FREE_MESSAGE_LIMIT)
    ) {
      if (messages.length > 0) localStorage.setItem(chatHistoryKey(session.user.email!), JSON.stringify(stripImageData(messages)));
      localStorage.setItem(PENDING_MSG_KEY, text);
      localStorage.setItem(PENDING_REASON_KEY, "upgrade");
      setShowUpgradeModal(true);
      trackEvent("upgrade_modal_shown", { trigger: "chat", messages_used: FREE_MESSAGE_LIMIT });
      return;
    }

    if (session.user?.subscriptionStatus !== "active" && session.user?.email) {
      incrementCount("msg", session.user.email);
    }

    trackEvent("chat_message_sent", {
      message_length: text.length,
      is_first_message: messages.length === 0,
      subscription_status: session.user?.subscriptionStatus || "free",
      total_messages: messages.length + 1,
      has_document: !!pendingDocument,
    });

    let messageContent = text;
    const attachedDoc = pendingDocument;
    if (attachedDoc) {
      messageContent = `${text}\n\n---UPLOADED DOCUMENT: ${attachedDoc.fileName} (${attachedDoc.fileType.toUpperCase()}${attachedDoc.pageCount ? `, ${attachedDoc.pageCount} pages` : ""})---\n${attachedDoc.extractedText}\n---END DOCUMENT---`;
      setPendingDocument(null);
    }

    const userMessage: Message = { role: "user", content: messageContent, document: attachedDoc || undefined };
    const baseMessages = restoredMessages ?? messages;
    const newMessages: Message[] = [...baseMessages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    const apiMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.document?.imageData
        ? { document: { imageData: m.document.imageData, imageMediaType: m.document.imageMediaType } }
        : {}),
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
    } catch {
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
    if (session?.user?.email) localStorage.removeItem(chatHistoryKey(session.user.email));
  };

  const handlePaperclipClick = () => {
    setUploadError(null);
    if (!session) {
      localStorage.setItem(PENDING_UPLOAD_KEY, "true");
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "document_upload" });
      return;
    }
    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email &&
      hasReachedLimit("msg", session.user.email, FREE_MESSAGE_LIMIT)
    ) {
      setShowUpgradeModal(true);
      trackEvent("upgrade_modal_shown", { trigger: "document_upload" });
      return;
    }
    const noticeCount = parseInt(localStorage.getItem(PRIVACY_NOTICE_COUNT_KEY) || "0", 10);
    if (noticeCount < 3) {
      localStorage.setItem(PRIVACY_NOTICE_COUNT_KEY, String(noticeCount + 1));
      setShowPrivacyNotice(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg", "image/png", "image/webp", "image/gif",
    ];
    const isImage = file.type.startsWith("image/");
    if (!allowedTypes.includes(file.type)) { setUploadError("Please upload a PDF, Word (.docx), or image file (JPG, PNG, WebP)."); return; }
    if (isImage && file.size > 10 * 1024 * 1024) { setUploadError("Image size exceeds 10MB limit."); return; }
    if (!isImage && file.size > 25 * 1024 * 1024) { setUploadError("File size exceeds 25MB limit."); return; }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      let data: Record<string, unknown>;
      try { data = await res.json(); }
      catch { setUploadError("Server error while processing your document. Please try again."); return; }
      if (!res.ok) { setUploadError((data.error as string) || "Failed to process document."); return; }

      trackEvent("document_uploaded", {
        file_type: data.fileType,
        page_count: data.pageCount,
        text_length: data.textLength,
        needs_translation: data.needsTranslation,
        subscription_status: session?.user?.subscriptionStatus || "free",
      });

      setPendingDocument({
        fileName: data.fileName as string,
        fileType: data.fileType as string,
        pageCount: data.pageCount as number | undefined,
        textLength: data.textLength as number,
        extractedText: data.extractedText as string,
        needsTranslation: data.needsTranslation as boolean | undefined,
        wasTranslated: data.wasTranslated as boolean | undefined,
        detectedLanguage: data.detectedLanguage as string | undefined,
        imageData: data.imageData as string | undefined,
        imageMediaType: data.imageMediaType as string | undefined,
      });
    } catch {
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop       = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); };
  const handleDragOver   = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };

  return (
    <div className="flex h-screen pt-16 bg-[var(--surface-0)]">

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-white/[0.06] bg-[var(--surface-1)]/60 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#D97706] flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-[var(--surface-0)]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Sidqo AI Lawyer</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-[var(--text-muted)]">Online & Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-medium mb-3 px-2">Quick Questions</p>

          <div className="space-y-0.5">
            {suggestedQuestions.map((cat, catIdx) => {
              const isOpen = activeCategory === catIdx;
              return (
                <div key={cat.category}>
                  <button
                    onClick={() => setActiveCategory(isOpen ? -1 : catIdx)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm leading-none">{cat.icon}</span>
                      <span className="text-sm text-[var(--text-secondary)] font-medium">{cat.category}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: EASE_IN_OUT }}
                        className="overflow-hidden"
                      >
                        <div className="ml-2 mt-0.5 mb-1 space-y-0.5">
                          {cat.questions.map((q, qi) => (
                            <motion.button
                              key={q}
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.18, ease: EASE_OUT, delay: qi * 0.04 }}
                              onClick={() => sendMessage(q)}
                              className="w-full text-left text-xs text-[var(--text-muted)] hover:text-[var(--gold)] px-3 py-2 rounded-lg hover:bg-[var(--gold)]/5 transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] border border-transparent hover:border-[var(--gold)]/15 active:scale-[0.97]"
                            >
                              {q}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear chat */}
        <AnimatePresence>
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="p-3 border-t border-white/[0.06]"
            >
              <button
                onClick={clearChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/15 text-red-400/60 hover:bg-red-500/8 hover:text-red-400 transition-[background-color,color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] text-sm active:scale-[0.97]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Conversation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* ── Main Chat Area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[var(--surface-1)]/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#D97706] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[var(--surface-0)]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Sidqo — UAE AI Lawyer</div>
              <div className="text-xs text-[var(--text-muted)]">Powered by Claude Opus · UAE Legal Expert</div>
            </div>
          </div>
          <AnimatePresence>
            {messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={clearChat}
                className="p-2 rounded-xl hover:bg-white/[0.05] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-[background-color,color] duration-150 active:scale-[0.93]"
                title="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="text-center mb-10 mt-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center mx-auto mb-5 gold-glow">
                  <Scale className="w-8 h-8 text-[var(--gold)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">How can I help you today?</h2>
                <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                  Ask me anything about UAE law. I'm trained on UAE Federal Laws, DIFC regulations, and local court precedents.
                </p>
              </motion.div>

              {/* Staggered suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {welcomeCards.map(({ icon: Icon, text, tag }, i) => (
                  <motion.button
                    key={text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.1 + i * 0.055 }}
                    onClick={() => sendMessage(text)}
                    className="bg-[var(--surface-1)] border border-white/[0.06] rounded-xl p-4 text-left flex gap-3 items-start hover:border-[var(--gold)]/20 hover:bg-[var(--gold)]/[0.03] transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/8 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[var(--gold)]/15 transition-[background-color] duration-200">
                      <Icon className="w-4 h-4 text-[var(--gold)]" />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--gold)]/60 font-medium mb-1">{tag}</div>
                      <div className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-[color] duration-200">{text}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.55 }}
                className="text-center text-xs text-[var(--text-muted)]/60 mt-8"
              >
                Or type your own question below. I understand plain English — no legal jargon needed.
              </motion.p>
            </div>
          ) : (
            /* Messages list */
            <div className="max-w-3xl mx-auto space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.97,
                    }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* Assistant avatar */}
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#D97706] flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-[var(--gold)]/10">
                        <Scale className="w-4 h-4 text-[var(--surface-0)]" />
                      </div>
                    )}

                    <div className={`group max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                      {msg.role === "user" ? (
                        /* User bubble */
                        <div className="bg-[var(--gold)]/12 border border-[var(--gold)]/20 rounded-2xl rounded-tr-sm px-4 py-3">
                          {msg.document && (
                            <div className="mb-2 pb-2 border-b border-[var(--gold)]/12">
                              {msg.document.imageData && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={`data:${msg.document.imageMediaType};base64,${msg.document.imageData}`}
                                  alt={msg.document.fileName}
                                  className="max-w-[220px] max-h-[140px] rounded-lg object-cover mb-2"
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[var(--gold)]" />
                                <span className="text-xs text-[var(--gold)] font-medium">{msg.document.fileName}</span>
                                {msg.document.pageCount && (
                                  <span className="text-xs text-[var(--text-muted)]">{msg.document.pageCount} pages</span>
                                )}
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-[var(--text-primary)]/90 leading-relaxed whitespace-pre-wrap">
                            {msg.document
                              ? msg.content.split("\n\n---UPLOADED DOCUMENT:")[0] || "I've uploaded a document for review."
                              : msg.content}
                          </p>
                        </div>
                      ) : (
                        /* Assistant bubble */
                        <div className="bg-[var(--surface-1)] border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-5">
                          {msg.content ? (
                            <>
                              <div className="prose-legal text-sm">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                {isStreaming && idx === messages.length - 1 && (
                                  <span className="inline-block w-0.5 h-4 bg-[var(--gold)] ml-0.5 animate-pulse align-middle" />
                                )}
                              </div>
                              {/* Upload CTA — shown when AI suggests uploading a document */}
                              {!isStreaming && idx === messages.length - 1 && !pendingDocument &&
                                /upload (them|it|document|pdf|word|contract|letter|agreement|screenshots?|here)/i.test(msg.content) && (
                                <motion.button
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: 0.1, ease: EASE_OUT }}
                                  onClick={handlePaperclipClick}
                                  className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/25 text-[var(--gold)] text-xs font-medium hover:bg-[var(--gold)]/18 hover:border-[var(--gold)]/40 transition-[background-color,border-color] duration-150 active:scale-[0.97]"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  Attach Document
                                </motion.button>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-[var(--gold)]/50">
                              <Sparkles className="w-4 h-4 animate-pulse" />
                              <span className="text-sm text-[var(--text-muted)]">Analyzing UAE law...</span>
                            </div>
                          )}

                          {/* Copy action */}
                          <AnimatePresence>
                            {msg.content && !isStreaming && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              >
                                <button
                                  onClick={() => copyMessage(msg.content, idx)}
                                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-[color] duration-150 active:scale-[0.95]"
                                >
                                  <AnimatePresence mode="wait" initial={false}>
                                    {copiedId === idx ? (
                                      <motion.span
                                        key="copied"
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ duration: 0.15, ease: EASE_OUT }}
                                        className="flex items-center gap-1.5 text-emerald-400"
                                      >
                                        <Check className="w-3 h-3" /> Copied
                                      </motion.span>
                                    ) : (
                                      <motion.span
                                        key="copy"
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ duration: 0.15, ease: EASE_OUT }}
                                        className="flex items-center gap-1.5"
                                      >
                                        <Copy className="w-3 h-3" /> Copy response
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Area ─────────────────────────────── */}
        <div
          className={`border-t transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[var(--surface-1)]/30 backdrop-blur-sm p-4 ${
            isDragOver
              ? "border-[var(--gold)]/30 bg-[var(--gold)]/[0.03]"
              : "border-white/[0.06]"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="max-w-3xl mx-auto">

            {/* Drag overlay */}
            <AnimatePresence>
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15, ease: EASE_OUT }}
                  className="flex items-center justify-center gap-2 py-3 mb-3 rounded-xl border-2 border-dashed border-[var(--gold)]/30 bg-[var(--gold)]/[0.04]"
                >
                  <Upload className="w-4 h-4 text-[var(--gold)]" />
                  <span className="text-sm text-[var(--gold)]">Drop your document here</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pending document */}
            <AnimatePresence>
              {pendingDocument && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-[var(--gold)]/8 border border-[var(--gold)]/20"
                >
                  {pendingDocument.imageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:${pendingDocument.imageMediaType};base64,${pendingDocument.imageData}`}
                      alt={pendingDocument.fileName}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--gold)] font-medium truncate block">{pendingDocument.fileName}</span>
                    {pendingDocument.wasTranslated && (
                      <span className="text-xs text-[var(--text-muted)]">Translated from {pendingDocument.detectedLanguage}</span>
                    )}
                  </div>
                  {pendingDocument.pageCount && (
                    <span className="text-xs text-[var(--text-muted)]">{pendingDocument.pageCount} pages</span>
                  )}
                  <button
                    onClick={() => setPendingDocument(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-[background-color,color] duration-150 active:scale-[0.93]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload processing */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-white/[0.06]"
                >
                  <Loader2 className="w-4 h-4 text-[var(--gold)] animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">Reading your document...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload error */}
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400 flex-1">{uploadError}</span>
                  <button
                    onClick={() => setUploadError(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-red-400/60 hover:text-red-400 transition-[background-color,color] duration-150 active:scale-[0.93]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <div className="flex gap-3 items-end">
              {/* Attach button */}
              <button
                onClick={handlePaperclipClick}
                disabled={isStreaming || isUploading}
                title="Upload document or image (PDF, DOCX, JPG, PNG)"
                className="w-11 h-11 rounded-xl border border-white/[0.08] text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.93]"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
                className="hidden"
              />

              {/* Textarea */}
              <div className="flex-1 bg-[var(--surface-1)] rounded-2xl border border-white/[0.08] focus-within:border-[var(--gold)]/40 transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden">
                <TextareaAutosize
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    pendingDocument
                      ? "Add context about this document, or just press send..."
                      : "Ask about UAE law..."
                  }
                  minRows={1}
                  maxRows={6}
                  className="w-full bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 resize-none focus:outline-none"
                  disabled={isStreaming}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !pendingDocument) || isStreaming}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#D97706] text-[var(--surface-0)] flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-[box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_4px_16px_rgba(245,158,11,0.35)] active:scale-[0.93]"
              >
                {isStreaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>

            <p className="text-center text-xs text-[var(--text-muted)]/40 mt-2.5">
              For informational purposes only · Not legal advice · Consult a licensed UAE attorney for serious matters
            </p>
          </div>
        </div>

        {/* ── Privacy Notice Modal ─────────────────── */}
        <AnimatePresence>
          {showPrivacyNotice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="bg-[var(--surface-1)] border border-white/[0.08] mx-4 max-w-md w-full rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Your documents are safe</h3>
                </div>
                <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  <p>Your documents are encrypted and only used to analyse your case. They are processed in real-time and not stored permanently.</p>
                  <p>We never share your documents with third parties or use them for AI model training.</p>
                </div>
                <button
                  onClick={() => { setShowPrivacyNotice(false); fileInputRef.current?.click(); }}
                  className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[#D97706] text-[var(--surface-0)] font-semibold text-sm hover:shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-[box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                >
                  Upload Document
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LoginModal isOpen={showLoginModal} />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--gold)]/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
