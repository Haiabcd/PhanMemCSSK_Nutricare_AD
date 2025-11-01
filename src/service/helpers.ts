import axios from "axios";

export function toAxiosMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const s = err.response?.status ?? "ERR";
        const d = err.response?.data as unknown; // ❌ không dùng any
        let msg: string = err.message;
        if (typeof d === "string" && d) {
            msg = d;
        } else if (isRecord(d)) {
            if (typeof d.message === "string") msg = d.message;
            else if (typeof d.error === "string") msg = d.error;
        }

        return `HTTP ${s}: ${msg}`;
    }
    if (isErrorLike(err)) return err.message;
    return "Lỗi không xác định";
}

/** ===== helpers type guard ===== */
function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

function isErrorLike(x: unknown): x is { message: string } {
    return isRecord(x) && typeof (x as { message?: unknown }).message === "string";
}
