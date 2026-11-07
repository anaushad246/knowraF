import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import MessageBubble from "./MessageBubble";
import {
  Send,
  Sparkles,
  Bot,
  Loader2,
  FileText,
  AlertCircle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

export default function ChatPanel() {
  const {
    currentDoc,
    chatMessages,
    isSendingMessage,
    sendMessage,
    createNewChat,
  } = useWorkspace();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isIndexing =
    currentDoc &&
    (currentDoc.status === "uploaded" || currentDoc.status === "processing");

  const isFailed = currentDoc && currentDoc.status === "failed";

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSendingMessage]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isSendingMessage || isIndexing) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptChip = (chipText) => {
    if (isIndexing || isSendingMessage) return;
    sendMessage(chipText);
  };

  const suggestionChips = [
    "Summarize this document in 3 key points",
    "What are the main topics covered?",
    "Find all important dates or named entities",
    "Give me an executive overview",
  ];

  if (!currentDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-500">
        <MessageSquare className="w-12 h-12 mb-3 text-slate-700" />
        <p className="text-sm font-medium text-slate-400">Select or upload a document to begin chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            AI Assistant
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isIndexing ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Indexing Chunks...</span>
            </div>
          ) : isFailed ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Indexing Failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hybrid Search Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Indexing Banner Alert if still in queue */}
      {isIndexing && (
        <div className="bg-amber-950/40 border-b border-amber-800/50 px-4 py-2.5 text-xs text-amber-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-400" />
          <div>
            <strong className="font-semibold">Processing PDF:</strong> Background worker is chunking & embedding the document with Gemini. Chat will unlock automatically in a few moments.
          </div>
        </div>
      )}

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Ask anything about "{currentDoc.title || currentDoc.originalName}"
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Every answer includes verifiable citations linking back to exact pages in the PDF.
              </p>
            </div>

            {/* Starter Suggestion Chips */}
            <div className="w-full max-w-md pt-2 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-left">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 gap-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    disabled={isIndexing}
                    onClick={() => handlePromptChip(chip)}
                    className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    💡 {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={handleSubmit}
          className="relative bg-slate-900 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl transition-all shadow-inner"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            disabled={isIndexing || isFailed}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isIndexing
                ? "Document is indexing... Please wait."
                : isFailed
                ? "Indexing failed for this document."
                : "Ask a question about this document... (Shift+Enter for new line)"
            }
            className="w-full bg-transparent px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none disabled:opacity-40 disabled:cursor-not-allowed"
          />

          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <span className="text-[10px] text-slate-400">
              Enter to send · Shift+Enter for new line
            </span>

            <button
              type="submit"
              disabled={!input.trim() || isSendingMessage || isIndexing}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

