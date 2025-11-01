// src/service/http.ts
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE, ENDPOINTS } from "../config/api.config";
import type { AdminLoginResponse, TokenPairResponse } from "../types/auth";

export const http = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

const STORAGE_KEY = "admin_auth_tokens";

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

// --- Gắn access token trước mỗi request ---
http.interceptors.request.use((config) => {
    const saved = loadTokens();
    if (saved?.accessToken) {
        config.headers = config.headers ?? {};
        if (!("Authorization" in config.headers)) {
            config.headers["Authorization"] = `Bearer ${saved.accessToken}`;
        }
    }
    return config;
});

// --- Tự refresh khi 401 ---
let isRefreshing = false;
let refreshPromise: Promise<TokenPairResponse> | null = null;

/** Gọi refresh token bằng axios "sạch" (tránh loop) */
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

http.interceptors.response.use(
    (resp) => resp,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

        if (status === 401 && original && !original._retry) {
            original._retry = true;

            try {
                // Nếu chưa có phiên refresh đang chạy → tạo mới
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

                // Chờ refresh (dù request này có khởi tạo hay không)
                const newTokens = await refreshPromise!;
                // Retry request cũ với accessToken mới
                original.headers = original.headers ?? {};
                original.headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
                return http(original);
            } catch (e) {
                // Refresh fail → xoá token & đẩy lỗi ra ngoài để UI điều hướng về Login
                clearTokens();
                return Promise.reject(e);
            } finally {
                // Dọn promise để lần sau có thể refresh tiếp
                if (!isRefreshing) refreshPromise = null;
            }
        }

        // Không phải 401 hoặc đã thử lại rồi → trả lỗi như bình thường
        return Promise.reject(error);
    }
);

export default http;
