import { API_BASE_URL } from "../constants/apis.constant";
import { getAuthToken } from "../services/auth.service";

async function buildApiError(response) {
  const payload = await parseResponsePayload(response);

  const message = payload?.message || payload?.rawText || "Không thể kết nối đến máy chủ";
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;

  return error;
}

async function parseResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawText);
    } catch {
      return {
        message: "Phản hồi JSON từ máy chủ không hợp lệ.",
        rawText,
      };
    }
  }

  return {
    message: "API không trả về JSON hợp lệ.",
    rawText,
  };
}

export async function fetcher(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body,
  });

  if (!response.ok) {
    throw await buildApiError(response);
  }

  const payload = await parseResponsePayload(response);

  if (payload?.rawText) {
    const error = new Error(`${payload.message} (${response.status}) ${endpoint}`);
    error.status = response.status;
    error.payload = payload;

    throw error;
  }

  return payload;
}
