import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getAllDocuments, getDocumentById, deleteDocument } from "../api/document.api";
import {
  askQuestion,
  askQuestionStream,
  getDocumentChatSessions,
  getChatHistory,
  deleteChatSession,
} from "../api/chat.api";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, token } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Chat state
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Citation state for PDF viewer jumping and highlighting
  const [activeCitation, setActiveCitation] = useState({
    pageNumber: 1,
    highlightText: "",
    chunkIndex: null,
    timestamp: 0,
  });

  // Mobile active tab: 'pdf' | 'chat'
  const [mobileTab, setMobileTab] = useState("chat");

  // Polling ref to prevent concurrent polls
  const pollingRef = useRef(null);

  // Fetch all documents for user
  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingDocs(true);
      const res = await getAllDocuments();
      const docs = res?.data || [];
      setDocuments(docs);

      // Auto-select first document if none selected
      setCurrentDoc((prev) => {
        if (!prev && docs.length > 0) return docs[0];
        if (prev) {
          const updated = docs.find((d) => d._id === prev._id);
          return updated || (docs.length > 0 ? docs[0] : null);
        }
        return null;
      });
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setCurrentDoc(null);
      setChatSessions([]);
      setChatMessages([]);
      setActiveChatId(null);
    }
  }, [token, fetchDocuments]);

  // Load chat sessions when currentDoc changes
  const fetchSessions = useCallback(async (docId) => {
    if (!docId) {
      setChatSessions([]);
      setChatMessages([]);
      setActiveChatId(null);
      return;
    }
    try {
      const res = await getDocumentChatSessions(docId);
      const sessions = res?.data || [];
      setChatSessions(sessions);

      if (sessions.length > 0) {
        // Load latest session
        const latest = sessions[0];
        const latestId = latest.chatId || latest._id;
        if (latestId) {
          setActiveChatId(latestId);
          const historyRes = await getChatHistory(latestId);
          setChatMessages(historyRes?.data?.messages || []);
        }
      } else {
        setActiveChatId(null);
        setChatMessages([]);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
  }, []);

  useEffect(() => {
    if (currentDoc?._id) {
      fetchSessions(currentDoc._id);
    }
  }, [currentDoc?._id, fetchSessions]);

  // Real-time Indexing Polling: check every 3s if status is 'uploaded' or 'processing'
  useEffect(() => {
    if (!currentDoc?._id) return;
    const isProcessing =
      currentDoc.status === "uploaded" || currentDoc.status === "processing";

    if (isProcessing) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await getDocumentById(currentDoc._id);
          const updated = res?.data;
          if (updated) {
            if (updated.status !== currentDoc.status) {
              setCurrentDoc(updated);
              setDocuments((prev) =>
                prev.map((d) => (d._id === updated._id ? updated : d))
              );
            }
            if (updated.status === "indexed" || updated.status === "failed") {
              clearInterval(pollingRef.current);
            }
          }
        } catch (err) {
          console.error("Error polling document status:", err);
        }
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentDoc?._id, currentDoc?.status]);

  // Select document
  const selectDocument = (doc) => {
    setCurrentDoc(doc);
    setActiveCitation({
      pageNumber: 1,
      highlightText: "",
      chunkIndex: null,
      timestamp: Date.now(),
    });
  };

  // Select chat session
  const selectChat = async (chatId) => {
    if (!chatId || chatId === "undefined") return;
    try {
      setActiveChatId(chatId);
      const res = await getChatHistory(chatId);
      setChatMessages(res?.data?.messages || []);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  // Start new chat session
  const createNewChat = () => {
    setActiveChatId(null);
    setChatMessages([]);
  };

  // Delete chat session
  const removeChat = async (chatId) => {
    try {
      await deleteChatSession(chatId);
      setChatSessions((prev) => prev.filter((s) => (s.chatId || s._id) !== chatId));
      if (activeChatId === chatId) {
        createNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  // Delete document
  const removeDocument = async (id) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      if (currentDoc?._id === id) {
        const remaining = documents.filter((d) => d._id !== id);
        setCurrentDoc(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  // Send message using real-time SSE streaming
  const sendMessage = async (text) => {
    if (!text.trim() || !currentDoc?._id || isSendingMessage) return;

    const userMsg = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const initialBotMsg = {
      role: "assistant",
      content: "",
      sources: [],
      suggestions: [],
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    // Optimistically show user message and initial streaming bubble
    setChatMessages((prev) => [...prev, userMsg, initialBotMsg]);
    setIsSendingMessage(true);

    let recordedChatId = activeChatId;

    try {
      await askQuestionStream({
        message: text,
        documentId: currentDoc._id,
        chatId: activeChatId,
        onStart: (data) => {
          if (!recordedChatId && data.chatId) {
            recordedChatId = data.chatId;
            setActiveChatId(data.chatId);
            fetchSessions(currentDoc._id);
          }
          if (data.sources) {
            setChatMessages((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              const last = { ...updated[updated.length - 1] };
              last.sources = data.sources;
              updated[updated.length - 1] = last;
              return updated;
            });
          }
        },
        onChunk: (chunkText) => {
          setChatMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content = (last.content || "") + chunkText;
            updated[updated.length - 1] = last;
            return updated;
          });
        },
        onDone: (data) => {
          setChatMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content = data.answer || last.content;
            last.sources = data.sources || last.sources;
            last.suggestions = data.suggestions || [];
            last.isStreaming = false;
            updated[updated.length - 1] = last;
            return updated;
          });

          if (!activeChatId && data.chatId) {
            setActiveChatId(data.chatId);
            fetchSessions(currentDoc._id);
          }
        },
        onError: (err) => {
          console.error("Stream error in sendMessage:", err);
          setChatMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content =
              err.message ||
              "Sorry, an error occurred while streaming the answer.";
            last.isError = true;
            last.isStreaming = false;
            updated[updated.length - 1] = last;
            return updated;
          });
        },
      });
    } catch (err) {
      console.error("Failed to initiate stream:", err);
      setChatMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.content =
          err.message ||
          "Sorry, an error occurred while communicating with server.";
        last.isError = true;
        last.isStreaming = false;
        updated[updated.length - 1] = last;
        return updated;
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Trigger Citation Jump: PDF flips page & highlights snippet
  const triggerCitationJump = (citation) => {
    setActiveCitation({
      pageNumber: citation.pageNumber || 1,
      highlightText: citation.text || "",
      chunkIndex: citation.chunkIndex ?? null,
      timestamp: Date.now(),
    });
    // On mobile screens, automatically switch to PDF viewer tab
    setMobileTab("pdf");
  };

  return (
    <WorkspaceContext.Provider
      value={{
        documents,
        currentDoc,
        loadingDocs,
        fetchDocuments,
        selectDocument,
        removeDocument,
        chatSessions,
        activeChatId,
        chatMessages,
        isSendingMessage,
        selectChat,
        createNewChat,
        removeChat,
        sendMessage,
        activeCitation,
        triggerCitationJump,
        mobileTab,
        setMobileTab,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

