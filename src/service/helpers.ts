import axios, { AxiosError } from "axios";


type Rec = Record<string, unknown>;
export function toAxiosMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const ae = err as AxiosError<unknown>;
        const status = ae.response?.status ?? "ERR";
        const body = ae.response?.data;

        let msg = "Lỗi không xác định";
        if (typeof body === "string" && body) {
            msg = body;
        } else if (body && typeof body === "object") {
            const r = body as Rec;
            msg = String(r.message ?? r.error ?? ae.message ?? msg);
        } else if (ae.message) {
            msg = ae.message;
        }
        return `HTTP ${status}: ${msg}`;
    }
    const e = err as { message?: string };
    return e?.message ?? "Lỗi không xác định";
}

export function isRequestCanceled(err: any): boolean {
    return (
      err?.code === "ERR_CANCELED" ||
      err?.name === "CanceledError" ||
      err?.name === "AbortError" ||
      String(err?.message ?? "")
        .toLowerCase()
        .includes("canceled")
    );
  }

