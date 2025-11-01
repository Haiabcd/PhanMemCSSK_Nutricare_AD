export type AdminLoginRequest = {
    username: string;
    passwordHash: string;
};

export type RefreshRequest = {
    refreshToken: string;
}
export type TokenPairResponse = {
    tokenType: string;
    accessToken: string;
    accessExpiresAt: number;
    refreshToken: string;
    refreshExpiresAt: number;
};
export type AdminLoginResponse = TokenPairResponse;