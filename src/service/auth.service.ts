import http, { saveTokens, loadTokens, clearTokens } from "./http";
import { ENDPOINTS } from "../config/api.config";
import type { AdminCredentialUpdateRequest, AdminLoginRequest, AdminLoginResponse, RefreshRequest, TokenPairResponse } from "../types/auth";
import type { ApiResponse } from "../types/types";

export async function adminLogin(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
    const res = await http.post<ApiResponse<AdminLoginResponse>>(ENDPOINTS.auths.login, payload);
    const body = res.data;
    if (!body || typeof body !== "object") {
        throw new Error("Phản hồi không hợp lệ từ máy chủ.");
    }
    const data = body.data;
    if (!data?.accessToken) {
        throw new Error("Không nhận được accessToken.");
    }
    console.log("Đăng nhập thành công.", data);
    saveTokens(data);
    return data;
}

export async function fetchNewTokens(): Promise<TokenPairResponse> {
    console.log("Refreshing tokens...");
    const tokens = loadTokens();
    if (!tokens?.refreshToken) throw new Error("Không có refreshToken.");
    const payload: RefreshRequest = { refreshToken: tokens.refreshToken };
    const res = await http.post<ApiResponse<TokenPairResponse>>(ENDPOINTS.auths.refresh, payload);
    const data = res.data?.data;
    if (!data?.accessToken) throw new Error("Refresh token thất bại.");
    return data;
}

export async function adminLogout(): Promise<void> {
    const tokens = loadTokens();
    const refreshToken = tokens?.refreshToken;
    try {
        if (refreshToken) {
            const payload: RefreshRequest = { refreshToken };
            await http.post<ApiResponse<void>>(ENDPOINTS.auths.logout, payload);
        }
    } finally {
        clearTokens();
    }
}

export async function changeAdminCredentials(
    payload: AdminCredentialUpdateRequest
  ): Promise<void> {
    await http.patch<ApiResponse<void>>(ENDPOINTS.auths.changeCredentials, payload);
}