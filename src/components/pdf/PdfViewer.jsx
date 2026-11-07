import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { fetchDocumentBlobUrl } from "../../api/document.api";
import PdfToolbar from "./PdfToolbar";
import {
  Loader2,
  AlertCircle,
  FileQuestion,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set worker source locally via Vite asset bundling
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PdfViewer() {
  const { token } = useAuth();
  const { currentDoc, activeCitation } = useWorkspace();

  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingBlob, setLoadingBlob] = useState(false);

  const containerRef = useRef(null);

  // Measure container width for responsive page sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Jump to page when activeCitation updates (Stage 1 Jump)
  useEffect(() => {
    if (activeCitation?.pageNumber) {
      setCurrentPage(activeCitation.pageNumber);
    }
  }, [activeCitation?.pageNumber, activeCitation?.timestamp]);

  // Reset page & load document blob
  useEffect(() => {
    setCurrentPage(1);
    setNumPages(null);
    setPdfError(null);

    let active = true;
    let localUrl = null;

    if (!currentDoc?._id) {
      setBlobUrl(null);
      return;
    }

    // Always download authenticated PDF blob via Axios backend streaming
    // (Bypasses Cloudinary restricted raw delivery 401s and CORS limitations)
    setLoadingBlob(true);
    fetchDocumentBlobUrl(currentDoc._id)
      .then((url) => {
        if (active) {
          localUrl = url;
          setBlobUrl(url);
          setPdfError(null);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("PDF blob load error:", err);
          setPdfError(
            err.response?.status === 401
              ? "Authentication expired. Please log in again."
              : "Failed to load PDF file from server."
          );
        }
      })
      .finally(() => {
        if (active) setLoadingBlob(false);
      });

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [currentDoc?._id, currentDoc?.fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF load error:", err);
    setPdfError("Failed to render PDF document.");
  };

  // Stage 2: Highlight matching citation text on the active page
  const textRenderer = useCallback(
    (textItem) => {
      const isTargetPage = currentPage === activeCitation?.pageNumber;
      const highlight = activeCitation?.highlightText;

      if (!isTargetPage || !highlight || !textItem.str.trim()) {
        return textItem.str;
      }

      // Extract significant keywords (length >= 4) from the citation text
      const cleanWords = highlight
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length >= 4);

      if (cleanWords.length === 0) {
        return textItem.str;
      }

      const uniqueWords = Array.from(new Set(cleanWords)).slice(0, 20);
      const pattern = new RegExp(`\\b(${uniqueWords.join("|")})\\b`, "gi");

      const parts = textItem.str.split(pattern);

      return parts.map((part, i) => {
        const isMatch = uniqueWords.some(
          (w) => w.toLowerCase() === part.toLowerCase()
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-amber-300 text-slate-950 font-bold px-0.5 rounded shadow-sm"
          >
            {part}
          </mark>
        ) : (
          part
        );
      });
    },
    [currentPage, activeCitation?.pageNumber, activeCitation?.highlightText]
  );

  if (!currentDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/50">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">No Document Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select a document from the left sidebar or upload a new PDF to view it alongside your AI chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden border-r border-slate-800/80">
      {/* Top Toolbar */}
      <PdfToolbar
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        onPageChange={(page) => setCurrentPage(Math.max(1, Math.min(page, numPages || 1)))}
        onZoomIn={() => setScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100))}
        onZoomOut={() => setScale((prev) => Math.max(0.6, Math.round((prev - 0.15) * 100) / 100))}
        onResetZoom={() => setScale(1.0)}
        docTitle={currentDoc.title || currentDoc.originalName}
      />

      {/* Citation active banner notification */}
      {activeCitation?.chunkIndex !== null && activeCitation?.chunkIndex !== undefined && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Showing source citation for <strong>Page {activeCitation.pageNumber}</strong> (Chunk #{activeCitation.chunkIndex})
          </span>
          {currentDoc.fileUrl && (
            <a
              href={currentDoc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-200 flex items-center gap-1 hover:underline"
            >
              Open Original <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* PDF Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-950/60 scrollbar-thin"
      >
        {loadingBlob ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-medium">Fetching document stream...</span>
          </div>
        ) : pdfError ? (
          <div className="m-auto p-6 max-w-md bg-red-950/40 border border-red-800/60 rounded-2xl text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-200">{pdfError}</p>
            {currentDoc.fileUrl && (
              <a
                href={currentDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-xl"
              >
                Open in external tab <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : (
          blobUrl && (
            <Document
              file={blobUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              error={
                <div className="m-auto p-6 max-w-md bg-red-950/40 border border-red-800/60 rounded-2xl text-center">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-red-200">Failed to render PDF document</p>
                </div>
              }
              loading={
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <span className="text-xs font-medium">Rendering PDF pages...</span>
                </div>
              }
            >
              {numPages && (
                <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white">
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    width={containerWidth ? Math.min(containerWidth - 48, 750) : undefined}
                    customTextRenderer={textRenderer}
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                  />
                </div>
              )}
            </Document>
          )
        )}
      </div>
    </div>
  );
}
