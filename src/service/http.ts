// src/service/http.ts
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE, ENDPOINTS } from "../config/api.config";
import type { AdminLoginResponse, TokenPairResponse } from "../types/auth";

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

const STORAGE_KEY = "admin_auth_tokens";

/* ================= Tokens Helpers ================= */
export function saveTokens(tokens: AdminLoginResponse) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  http.defaults.headers.common["Authorization"] = `Bearer ${tokens.accessToken}`;
}

export function loadTokens(): AdminLoginResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminLoginResponse) : null;
  } catch {
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
  delete http.defaults.headers.common["Authorization"];
}

export function setAccessToken(token?: string) {
  if (token) http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete http.defaults.headers.common["Authorization"];
}

/* ================= Utilities ================= */
const AUTH_WHITELIST_PATHS = ["/auths/login", "/auths/refresh", "/auths/logout"];

function getPathname(url?: string): string {
  if (!url) return "";
  try {
    return url.startsWith("http") ? new URL(url).pathname : url;
  } catch {
    return url;
  }
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// Decode exp từ accessToken (không cần lib)
function decodeJwtExp(token?: string): number | undefined {
  if (!token) return undefined;
  try {
    const [, payload] = token.split(".");
    if (!payload) return undefined;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const exp = json?.exp;
    return typeof exp === "number" ? exp : undefined;
  } catch {
    return undefined;
  }
}

/* ================= Refresh (axios sạch) ================= */
async function callRefresh(): Promise<TokenPairResponse> {
  const tokens = loadTokens();
  if (!tokens?.refreshToken) throw new Error("Không có refreshToken.");

  const bare = axios.create({ baseURL: API_BASE, timeout: 10000 });
  const res = await bare.post<{ message: string; data: TokenPairResponse }>(
    ENDPOINTS.auths.refresh,
    { refreshToken: tokens.refreshToken }
  );
  const data = res.data?.data;
  if (!data?.accessToken) throw new Error("Refresh token thất bại.");
  return data;
}

/* ================= Interceptors ================= */
// Pre-refresh trong request interceptor (serialize)
let isRefreshing = false;
let refreshPromise: Promise<TokenPairResponse> | null = null;

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const path = getPathname(config.url);
  const isAuthEndpoint = AUTH_WHITELIST_PATHS.some((p) => path.includes(p));

  // Auth endpoints: không gắn Authorization / không refresh
  if (isAuthEndpoint) {
    if (config.headers && "Authorization" in config.headers) {
      delete (config.headers as any)["Authorization"];
    }
    return config;
  }

  // Với endpoint bảo vệ: nếu access sắp/đã hết hạn → refresh trước khi gửi
  const saved = loadTokens();
  const accessExp = saved?.accessExpiresAt ?? 0;
  const refreshExp = saved?.refreshExpiresAt ?? 0;

  const accessExists = !!saved?.accessToken;
  const refreshExists = !!saved?.refreshToken;

  // buffer 5 giây tránh cạnh biên đồng hồ
  const needAccessRefresh = accessExists && nowSec() >= accessExp - 5;
  const refreshStillValid = refreshExists && nowSec() < refreshExp - 5;

  if (needAccessRefresh && refreshStillValid) {
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = callRefresh()
          .then((newTokens) => {
            // Lưu & set header mặc định
            saveTokens(newTokens as AdminLoginResponse);
            setAccessToken(newTokens.accessToken);
            return newTokens;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }
      await refreshPromise;
    } catch (e) {
      // Refresh fail → xoá token để UI điều hướng login
      clearTokens();
      return Promise.reject(e);
    } finally {
      if (!isRefreshing) refreshPromise = null;
    }
  }

  // Gắn Authorization sau khi đã đảm bảo token còn hạn / đã refresh
  const latest = loadTokens();
  if (latest?.accessToken) {
    config.headers = config.headers ?? {};
    if (!("Authorization" in config.headers)) {
      config.headers["Authorization"] = `Bearer ${latest.accessToken}`;
    }
  }

  return config;
});

// Response interceptor: fallback khi token hết hạn giữa chừng (không dựa mã lỗi)
http.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean;
    }) | undefined;
    const status = error.response?.status;

    const path = getPathname(original?.url);
    const isAuthEndpoint = AUTH_WHITELIST_PATHS.some((p) => path.includes(p));
    if (isAuthEndpoint) {
      // Login/refresh/logout: trả lỗi thẳng cho UI
      return Promise.reject(error);
    }

    // Fallback nhỏ: nếu 401 và token có vẻ đã hết hạn (giữa chừng) → thử refresh & retry 1 lần
    if (status === 401 && original && !original._retry) {
      const saved = loadTokens();
      const accessExpDecoded = decodeJwtExp(saved?.accessToken);
      const refreshExp = saved?.refreshExpiresAt ?? 0;

      const skew = 10; // lệch giờ cho phép
      const accessLooksExpired =
        accessExpDecoded !== undefined && nowSec() >= accessExpDecoded - skew;
      const refreshStillValid =
        !!saved?.refreshToken && nowSec() < refreshExp - 5;

      if (accessLooksExpired && refreshStillValid) {
        original._retry = true;
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = callRefresh()
              .then((newTokens) => {
                saveTokens(newTokens as AdminLoginResponse);
                setAccessToken(newTokens.accessToken);
                return newTokens;
              })
              .finally(() => {
                isRefreshing = false;
              });
          }
          const newTokens = await refreshPromise!;
          original.headers = original.headers ?? {};
          original.headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
          return http(original);
        } catch (e) {
          clearTokens();
          return Promise.reject(e);
        } finally {
          if (!isRefreshing) refreshPromise = null;
        }
      }
    }

    // Mọi lỗi khác: trả nguyên cho UI (để hiện đúng message BE, ví dụ "Mật khẩu không đúng")
    return Promise.reject(error);
  }
);

export default http;
