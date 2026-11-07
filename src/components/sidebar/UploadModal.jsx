import React, { useState, useRef } from "react";
import { uploadDocument } from "../../api/document.api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function UploadModal({ isOpen, onClose }) {
  const { fetchDocuments, selectDocument } = useWorkspace();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        setError("Only PDF files are supported");
        return;
      }
      setFile(selected);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (dropped.type !== "application/pdf") {
        setError("Only PDF files are supported");
        return;
      }
      setFile(dropped);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(0);
    setError("");

    try {
      const res = await uploadDocument(file, (percent) => {
        setProgress(percent);
      });

      // Refresh documents list
      await fetchDocuments();
      const uploadedDoc = res?.data;
      const docId = uploadedDoc?._id || uploadedDoc?.documentId;
      if (docId) {
        // Pre-select new document
        selectDocument({
          _id: docId,
          title: uploadedDoc.title,
          status: uploadedDoc.status || "processing",
        });
      }

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to upload document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Upload PDF Document</h2>
              <p className="text-xs text-slate-400">Files are processed into semantic page-aware chunks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            file
              ? "border-indigo-500/60 bg-indigo-950/10"
              : "border-slate-700/80 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
                <FileText className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium text-slate-200">{file.name}</span>
              <span className="text-xs text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="p-3 bg-slate-800/60 rounded-xl text-slate-300">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-sm">
                <span className="font-semibold text-indigo-400">Click to browse</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">PDF files up to 25MB</p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                Uploading & Enqueuing indexing...
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> Start Indexing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

