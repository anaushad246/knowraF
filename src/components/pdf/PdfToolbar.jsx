import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
} from "lucide-react";

export default function PdfToolbar({
  currentPage,
  numPages,
  scale,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  docTitle,
}) {
  return (
    <div className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
      {/* Title */}
      <div className="flex items-center gap-2 truncate max-w-[200px] sm:max-w-xs">
        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="truncate font-medium text-slate-200" title={docTitle}>
          {docTitle || "Document"}
        </span>
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2 py-1 rounded-lg">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs px-1 text-slate-200">
          {currentPage} <span className="text-slate-400">/</span> {numPages || "--"}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!numPages || currentPage >= numPages}
          className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-2 py-1 rounded-lg">
        <button
          onClick={onZoomOut}
          disabled={scale <= 0.6}
          className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetZoom}
          className="font-mono text-[11px] px-1.5 hover:text-indigo-400 cursor-pointer"
          title="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          disabled={scale >= 2.5}
          className="p-1 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

