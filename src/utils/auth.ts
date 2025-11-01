const AUTH_STORAGE_KEY = "admin_auth_tokens";

export function hasAccessToken(): boolean {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw) as { accessToken?: string; accessExpiresAt?: number };
        if (!data?.accessToken) return false;
        return true;
    } catch {
        return false;
    }
}

