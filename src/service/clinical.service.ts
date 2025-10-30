import axios, { AxiosError } from "axios";
import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import type { ApiResponse, Slice } from "../types/common";
import type {
    CollectionKind,
    ClinicalOverview,
    NamedItem,
    StatItem,
    Stats,
    AllergyResponse,
    ConditionResponse,
} from "../types/clinical";

/* ================= Helpers type-safe ================= */

type Rec = Record<string, unknown>;

const asRec = (v: unknown): Rec =>
    typeof v === "object" && v !== null ? (v as Rec) : {};

function unwrapData<T>(data: unknown): T {
    const obj = asRec(data);
    // Ưu tiên payload dạng { data: ... }, nếu không có thì trả thẳng
    if ("data" in obj) return obj["data"] as T;
    return data as T;
}

function toAxiosMessage(err: unknown): string {
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

function isCanceled(err: unknown): boolean {
    // Axios v1: code === 'ERR_CANCELED'
    return axios.isCancel?.(err) || (asRec(err).code === "ERR_CANCELED");
}

/* ================= Overview clinical ================= */

export async function fetchClinicalOverview(signal?: AbortSignal): Promise<ClinicalOverview> {
    try {
        const { data } = await http.get(ENDPOINTS.overviewClinical, { signal });
        return data;
    } catch (err) {
        console.error(toAxiosMessage(err));
        return {};
    }
}

/* ================= Endpoint map by kind ================= */

const URLS = {
    conditions: ENDPOINTS.conditions,
    allergies: ENDPOINTS.allergies,
} as const;

/* ================= Full-cache + paging ================= */
const fullCache: Partial<Record<CollectionKind, NamedItem[]>> = {};

export async function fetchAllergiesPage(
    page: number,
    size = 12,
    signal?: AbortSignal
): Promise<ApiResponse<Slice<AllergyResponse>>> {
    const { data } = await http.get<ApiResponse<Slice<AllergyResponse>>>(ENDPOINTS.allergies.list, {
        params: { page, size },
        signal,
    });
    return data;
}


export async function fetchConditionsPage(
    page: number,
    size = 12,
    signal?: AbortSignal
): Promise<ApiResponse<Slice<ConditionResponse>>> {
    const { data } = await http.get<ApiResponse<Slice<ConditionResponse>>>(ENDPOINTS.conditions.list, {
        params: { page, size },
        signal,
    });
    return data;
}

/* ================= Stats (Top 5) chuẩn hoá ================= */
export async function fetchStats(
    kind: CollectionKind,
    signal?: AbortSignal
): Promise<Stats> {
    try {
        const { data } = await http.get(URLS[kind].stats, { signal });
        const raw = unwrapData<unknown>(data);
        const r = asRec(raw);

        const total =
            (r.total as number | undefined) ??
            (r.count as number | undefined) ??
            (r.totalCount as number | undefined) ??
            (r.total_items as number | undefined) ??
            (r.total_items_count as number | undefined);

        const topArr =
            (r.top as unknown) ??
            r.top5 ??
            r.items ??
            r.list ??
            r.rows ??
            [];

        const top: StatItem[] = Array.isArray(topArr)
            ? (topArr as unknown[]).map<StatItem>((x) => {
                const i = asRec(x);
                const name = String(i.name ?? i.label ?? i.title ?? i.id ?? "");
                const count = Number(i.count ?? i.value ?? i.total ?? 0);
                return { name, count };
            })
            : [];

        return { total, top };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}
/* ================= CRUD + Search ================= */

export async function searchByName(
    kind: CollectionKind,
    name: string,
    signal?: AbortSignal
): Promise<NamedItem[]> {
    try {
        const { data } = await http.get(URLS[kind].search, { params: { name }, signal });
        const unwrapped = unwrapData<unknown>(data);
        const root = asRec(unwrapped);

        // Các khả năng payload:
        // 1) array
        if (Array.isArray(unwrapped)) {
            return (unwrapped as unknown[]).map((it) => {
                const r = asRec(it);
                return {
                    id: String(r.id ?? ""),
                    name: String(r.name ?? ""),
                    description: r.description ? String(r.description) : undefined,
                };
            });
        }

        // 2) { data: array } đã unwrap -> root, thử nhiều nhánh
        const dataArray =
            (root.data as unknown[]) ??
            (asRec(root.data ?? {}).content as unknown[]) ??
            (root.content as unknown[]);

        if (Array.isArray(dataArray)) {
            return dataArray.map((it) => {
                const r = asRec(it);
                return {
                    id: String(r.id ?? ""),
                    name: String(r.name ?? ""),
                    description: r.description ? String(r.description) : undefined,
                };
            });
        }

        return [];
    } catch (err) {
        // bị hủy -> trả rỗng
        if (isCanceled(err)) return [];
        throw new Error(toAxiosMessage(err));
    }
}

export async function createItem(
    kind: CollectionKind,
    item: Pick<NamedItem, "name" | "description">
) {
    try {
        const { data } = await http.post(URLS[kind].create, item);
        // Có thể là ApiResponse<NamedItem> hoặc NamedItem
        const obj = asRec(data);
        const maybeData = obj.data ?? data;
        return unwrapData<NamedItem>(maybeData);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

export async function updateItem(
    kind: CollectionKind,
    id: string,
    item: Pick<NamedItem, "name" | "description">
) {
    try {
        const { data } = await http.put(URLS[kind].update(id), item);
        const obj = asRec(data);
        const maybeData = obj.data ?? data;
        return unwrapData<NamedItem>(maybeData);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

export async function deleteItem(kind: CollectionKind, id: string) {
    try {
        await http.delete(URLS[kind].delete(id));
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** Cho phép trang xoá cache khi cần */
export function clearCollectionCache(kind?: CollectionKind) {
    if (kind) {
        delete fullCache[kind];
    } else {
        delete fullCache.conditions;
        delete fullCache.allergies;
    }
}
