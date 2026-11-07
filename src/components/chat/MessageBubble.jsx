import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import CitationBadge from "./CitationBadge";
import InlineCitation from "./InlineCitation";
import { parseInlineCitations } from "../../utils/citationParser";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  Loader2,
  ChevronRight,
} from "lucide-react";

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");
  const match = /language-(\w+)/.exec(className || "");

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code snippet:", err);
    }
  };

  if (!inline && (match || codeString.includes("\n"))) {
    return (
      <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
          <span>{match ? match[1] : "code"}</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            title="Copy code snippet"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3 text-xs overflow-x-auto text-slate-200 font-mono leading-relaxed scrollbar-thin">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code
      className="bg-slate-800/80 text-indigo-300 font-mono text-[12px] px-1.5 py-0.5 rounded border border-slate-700/50"
      {...props}
    >
      {children}
    </code>
  );
}

export default function MessageBubble({ message }) {
  const { sendMessage } = useWorkspace();
  const [messageCopied, setMessageCopied] = useState(false);

  const isBot = message.role === "bot" || message.role === "assistant";
  const hasSources =
    isBot && Array.isArray(message.sources) && message.sources.length > 0;
  const hasSuggestions =
    isBot &&
    !message.isStreaming &&
    Array.isArray(message.suggestions) &&
    message.suggestions.length > 0;

  // Transform raw [Page #1, Chunk #2] into clean inline citation links [1](citation:1)
  const formattedContent = useMemo(() => {
    if (!isBot) return message.content;
    return parseInlineCitations(message.content || "", message.sources || []);
  }, [message.content, message.sources, isBot]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  // Custom link renderer: detects citation: URLs and renders NotebookLM-style interactive badge
  const markdownComponents = useMemo(
    () => ({
      code: CodeBlock,
      a({ href, children, ...props }) {
        if (href && href.startsWith("citation:")) {
          const num = parseInt(href.replace("citation:", ""), 10);
          const source = message.sources?.[num - 1];
          return <InlineCitation citationNumber={num} source={source} />;
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline font-medium"
            {...props}
          >
            {children}
          </a>
        );
      },
    }),
    [message.sources]
  );

  return (
    <div className={`group flex gap-3 text-sm ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/20">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm ${
          isBot
            ? message.isError
              ? "bg-red-950/40 border border-red-800/60 text-red-200"
              : "bg-slate-900/90 border border-slate-800 text-slate-200"
            : "bg-indigo-600 text-white rounded-br-none"
        }`}
      >
        {/* Message Content with NotebookLM / Perplexity inline citations */}
        {isBot ? (
          <div>
            {message.isStreaming && !message.content ? (
              <div className="flex items-center gap-2 text-xs text-indigo-400 py-1 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Searching documents & generating answer...</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                <ReactMarkdown components={markdownComponents}>
                  {formattedContent}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse align-middle rounded-xs" />
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Cited Sources Reference Row */}
        {hasSources && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Cited Sources ({message.sources.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <CitationBadge
                  key={source.chunkId || idx}
                  source={source}
                  index={idx + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Smart Follow-up Suggestions (NotebookLM / Perplexity style) */}
        {hasSuggestions && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Suggested Follow-ups:
            </div>
            <div className="flex flex-col gap-1.5">
              {message.suggestions.map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="text-left px-3 py-2 rounded-xl text-xs bg-slate-950/70 hover:bg-indigo-950/50 border border-slate-800/90 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all cursor-pointer flex items-center justify-between group/chip"
                >
                  <span>💡 {suggestion}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/chip:text-indigo-400 transition-transform group-hover/chip:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer with Timestamp & Copy Action */}
        <div className="mt-2.5 pt-1.5 flex items-center justify-between border-t border-slate-800/60 text-[10px]">
          <span className={isBot ? "text-slate-400" : "text-indigo-200"}>
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>

          {/* Copy Message Button (shown once content exists) */}
          {message.content && !message.isStreaming && (
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                isBot
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-700/60"
              }`}
              title="Copy message text"
            >
              {messageCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 opacity-70" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {!isBot && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
