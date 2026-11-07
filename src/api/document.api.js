import axiosInstance, { API_BASE_URL } from "./axiosInstance";

export const uploadDocument = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("pdf", file);

  const response = await axiosInstance.post("/document/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const getAllDocuments = async () => {
  const response = await axiosInstance.get("/document");
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await axiosInstance.get(`/document/${id}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await axiosInstance.delete(`/document/${id}`);
  return response.data;
};

export const getDocumentFileUrl = (id, token) => {
  const base = `${API_BASE_URL}/document/${id}/file`;
  const authToken = token || localStorage.getItem("knowra_token");
  return authToken ? `${base}?token=${authToken}` : base;
};

export const fetchDocumentBlobUrl = async (id) => {
  const response = await axiosInstance.get(`/document/${id}/file`, {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data);
};
