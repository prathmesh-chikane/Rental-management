/**
 * @file api-client.ts
 * @description Centralized HTTP client for communicating between Next.js frontend and NestJS backend.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/trishul";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

/**
 * Universal fetch wrapper for backend API endpoints
 * @param method HTTP Method ("GET" | "POST" | "PUT" | "DELETE" | "PATCH")
 * @param endpoint API sub-path (e.g. "/health", "/auth/login", "/properties")
 * @param body Optional JSON body payload
 * @param customHeaders Optional custom request headers
 */
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  body?: unknown,
  customHeaders: Record<string, string> = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  let resData: any = null;
  try {
    resData = await response.json();
  } catch {
    resData = null;
  }

  if (!response.ok) {
    const errorMsg =
      (resData && (Array.isArray(resData.message) ? resData.message.join(", ") : resData.message)) ||
      `Request failed with status code ${response.status}`;
    throw new Error(errorMsg);
  }

  return resData as T;
}

export const api = {
  get: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>("GET", endpoint, undefined, headers),
  post: <T = any>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>("POST", endpoint, body, headers),
  put: <T = any>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>("PUT", endpoint, body, headers),
  patch: <T = any>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>("PATCH", endpoint, body, headers),
  delete: <T = any>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>("DELETE", endpoint, undefined, headers),
};
