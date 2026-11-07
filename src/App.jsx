import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import AuthModal from "./components/auth/AuthModal";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Sidebar from "./components/sidebar/Sidebar";
import PdfViewer from "./components/pdf/PdfViewer";
import ChatPanel from "./components/chat/ChatPanel";
import { Menu, FileText, MessageSquare, Loader2 } from "lucide-react";

function Workspace() {
  const { user } = useAuth();
  const { mobileTab, setMobileTab, currentDoc } = useWorkspace();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Navigation Header */}
        <header className="lg:hidden h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg"
              title="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm truncate max-w-[140px]">
              {currentDoc?.title || "Knowra"}
            </span>
          </div>

          {/* Segmented Mobile Tab Switch */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMobileTab("pdf")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                mobileTab === "pdf"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => setMobileTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                mobileTab === "chat"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
          </div>
        </header>

        {/* Desktop Split-Screen & Mobile Switcher */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF Viewer Panel: visible on desktop or when mobileTab === 'pdf' */}
          <div
            className={`h-full flex-1 lg:w-1/2 flex flex-col overflow-hidden ${
              mobileTab === "pdf" ? "flex" : "hidden lg:flex"
            }`}
          >
            <ErrorBoundary title="Unable to render PDF document">
              <PdfViewer />
            </ErrorBoundary>
          </div>

          {/* Chat Panel: visible on desktop or when mobileTab === 'chat' */}
          <div
            className={`h-full flex-1 lg:w-1/2 flex flex-col overflow-hidden ${
              mobileTab === "chat" ? "flex" : "hidden lg:flex"
            }`}
          >
            <ErrorBoundary title="Unable to load AI Chat">
              <ChatPanel />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Initializing Knowra...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <WorkspaceProvider>
      <Workspace />
    </WorkspaceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
