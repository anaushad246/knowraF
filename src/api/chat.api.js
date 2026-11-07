import axiosInstance, { API_BASE_URL } from "./axiosInstance";

export const askQuestion = async ({ message, documentId, chatId }) => {
  const payload = { message, documentId };
  if (chatId) {
    payload.chatId = chatId;
  }
  const response = await axiosInstance.post("/chat/ask", payload);
  return response.data;
};

/**
 * Real-time SSE streaming for RAG query
 */
export const askQuestionStream = async ({
  message,
  documentId,
  chatId,
  onStart,
  onChunk,
  onDone,
  onError,
}) => {
  const token = localStorage.getItem("knowra_token");
  const url = `${API_BASE_URL}/chat/stream`;

  const payload = { message, documentId };
  if (chatId) payload.chatId = chatId;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errData = {};
      try {
        errData = await response.json();
      } catch {}
      throw new Error(
        errData.message || `Request failed with status ${response.status}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === "start" && onStart) {
              onStart(data);
            } else if (data.type === "chunk" && onChunk) {
              onChunk(data.text);
            } else if (data.type === "done" && onDone) {
              onDone(data);
            } else if (data.type === "error" && onError) {
              onError(new Error(data.message));
            }
          } catch (e) {
            console.warn("Failed to parse SSE line:", trimmed, e);
          }
        }
      }
    }
  } catch (error) {
    if (onError) onError(error);
    else throw error;
  }
};

export const getDocumentChatSessions = async (documentId) => {
  const response = await axiosInstance.get(`/chat/${documentId}/sessions`);
  return response.data;
};

export const getChatHistory = async (chatId) => {
  const response = await axiosInstance.get(`/chat/${chatId}/history`);
  return response.data;
};

export const deleteChatSession = async (chatId) => {
  const response = await axiosInstance.delete(`/chat/${chatId}`);
  return response.data;
};
