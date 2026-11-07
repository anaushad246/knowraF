import React from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Bookmark, Sparkles } from "lucide-react";

export default function CitationBadge({ source, index }) {
  const { activeCitation, triggerCitationJump } = useWorkspace();

  const isCurrentActive =
    activeCitation?.chunkIndex !== null &&
    activeCitation?.chunkIndex === source.chunkIndex &&
    activeCitation?.pageNumber === source.pageNumber;

  return (
    <button
      type="button"
      onClick={() => triggerCitationJump(source)}
      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
        isCurrentActive
          ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/20"
          : "bg-slate-900/80 text-slate-300 hover:text-indigo-200 hover:bg-indigo-950/40 border-slate-800 hover:border-indigo-500/40"
      }`}
      title={source.text ? source.text.slice(0, 160) + "..." : "Click to view page in PDF viewer"}
    >
      {index !== undefined && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
          {index}
        </span>
      )}
      <Bookmark
        className={`w-3 h-3 ${
          isCurrentActive ? "text-amber-400 fill-amber-400" : "text-slate-400 group-hover:text-indigo-400"
        }`}
      />
      <span>
        Page {source.pageNumber || 1}
        {source.chunkIndex !== undefined && (
          <span className="opacity-70 font-mono text-[10px] ml-1">
            · Chunk #{source.chunkIndex}
          </span>
        )}
      </span>
      {source.score !== undefined && (
        <span className="text-[9px] opacity-50 font-mono">
          ({Math.round(source.score * 100)}%)
        </span>
      )}
    </button>
  );
}
