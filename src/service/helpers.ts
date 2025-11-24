import axios, { AxiosError } from "axios";

type Rec = Record<string, unknown>;

export function toAxiosMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const ae = err as AxiosError<unknown>;
        const status = ae.response?.status;
        const body = ae.response?.data;
        // 1) Body là object: ưu tiên field message / error
        if (body && typeof body === "object") {
            const r = body as Rec;
            const msgFromBody =
                (typeof r.message === "string" && r.message.trim()) ||
                (typeof r.error === "string" && r.error.trim());

            if (msgFromBody) {
                return msgFromBody;
            }
        }
        // 2) Body là string (BE trả text thuần)
        if (typeof body === "string" && body.trim()) {
            return body.trim();
        }
        // 3) Fallback: dùng ae.message nếu có
        if (ae.message) {
            if (ae.message.toLowerCase().includes("network error")) {
                return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.";
            }
            return ae.message;
        }
        // 4) Fallback cuối cùng theo status code
        if (typeof status === "number") {
            if (status >= 500) {
                return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
            }
            if (status === 404) {
                return "Không tìm thấy tài nguyên yêu cầu.";
            }
            if (status === 401 || status === 403) {
                return "Bạn không có quyền thực hiện thao tác này.";
            }
        }

        return "Có lỗi xảy ra. Vui lòng thử lại.";
    }
    const e = err as { message?: string };
    return e?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.";
}

export function isRequestCanceled(err: any): boolean {
    return (
        err?.code === "ERR_CANCELED" ||
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        String(err?.message ?? "").toLowerCase().includes("canceled")
    );
}
