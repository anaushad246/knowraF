import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import UploadModal from "./UploadModal";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  MessageSquare,
  LogOut,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const {
    documents,
    currentDoc,
    selectDocument,
    removeDocument,
    chatSessions,
    activeChatId,
    selectChat,
    createNewChat,
    removeChat,
    loadingDocs,
  } = useWorkspace();

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* App Logo / Brand */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 flex items-center gap-1.5 tracking-tight">
                Knowra
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v2.0
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="p-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Upload New PDF
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin">
          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Documents
              </span>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                {documents.length}
              </span>
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-6 text-slate-500 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-500">
                No documents uploaded yet. Upload a PDF to begin chatting!
              </div>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => {
                  const isSelected = currentDoc?._id === doc._id;
                  const isProcessing =
                    doc.status === "uploaded" || doc.status === "processing";

                  return (
                    <div
                      key={doc._id}
                      onClick={() => selectDocument(doc)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                        isSelected
                          ? "bg-slate-800/90 text-slate-100 border border-indigo-500/40 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                        ) : doc.status === "failed" ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-indigo-400" : "text-slate-500"
                            }`}
                          />
                        )}
                        <div className="truncate">
                          <p className="truncate font-medium">{doc.title || doc.originalName}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            {isProcessing ? (
                              <span className="text-amber-400 animate-pulse">Indexing chunks...</span>
                            ) : (
                              <span>{doc.totalChunks || 0} chunks</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${doc.title}" and all its chats?`)) {
                            removeDocument(doc._id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-all"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Sessions Section for Current Document */}
          {currentDoc && (
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Conversations
                </span>
                <button
                  onClick={createNewChat}
                  className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-indigo-950/40 border border-indigo-500/20"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              {chatSessions.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-slate-900/30 border border-slate-800 text-[11px] text-slate-400">
                  No previous conversations for this doc.
                </div>
              ) : (
                <div className="space-y-1">
                  {chatSessions.map((session, index) => {
                    const sessionId = session.chatId || session._id || `session-${index}`;
                    const isSelected = activeChatId === sessionId;
                    return (
                      <div
                        key={sessionId}
                        onClick={() => selectChat(sessionId)}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                          isSelected
                            ? "bg-indigo-950/40 text-indigo-200 border border-indigo-500/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{session.title || "Conversation"}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeChat(sessionId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-all"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}

