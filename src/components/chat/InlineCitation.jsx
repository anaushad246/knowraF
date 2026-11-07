import React, { useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Bookmark, ExternalLink } from "lucide-react";

export default function InlineCitation({ citationNumber, source }) {
  const { activeCitation, triggerCitationJump } = useWorkspace();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!source) {
    return (
      <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 mx-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 rounded align-super select-none">
        {citationNumber}
      </span>
    );
  }

  const isCurrentActive =
    activeCitation?.chunkIndex !== null &&
    activeCitation?.chunkIndex === source.chunkIndex &&
    activeCitation?.pageNumber === source.pageNumber;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerCitationJump(source);
  };

  return (
    <span
      className="relative inline-block align-super select-none group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer shadow-sm ${
          isCurrentActive
            ? "bg-amber-400 text-slate-950 border border-amber-300 ring-2 ring-amber-400/40 scale-110"
            : "bg-indigo-600/20 text-indigo-300 hover:text-white hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-400 hover:scale-105"
        }`}
        title={`Jump to Page ${source.pageNumber || 1}`}
      >
        {citationNumber}
      </button>

      {/* Floating Hover Tooltip (NotebookLM Style) */}
      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-left z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Bookmark className="w-3.5 h-3.5" />
              Source [{citationNumber}] · Page {source.pageNumber || 1}
            </span>
            {source.chunkIndex !== undefined && (
              <span className="text-[10px] text-slate-400 font-mono">
                Chunk #{source.chunkIndex}
              </span>
            )}
          </span>

          {source.text && (
            <span className="block text-[11px] text-slate-300 italic line-clamp-3 leading-relaxed mb-2">
              "{source.text.slice(0, 160).trim()}..."
            </span>
          )}

          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400">
            <ExternalLink className="w-3 h-3" /> Click to jump & highlight in PDF
          </span>
        </span>
      )}
    </span>
  );
}

