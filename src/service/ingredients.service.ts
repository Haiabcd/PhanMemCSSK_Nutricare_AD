import axios, { isAxiosError } from "axios";
import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import type {
    IngredientBE,
    Ingredient,
    IngredientsOverview,
    IngredientDraft,
    IngredientResponse,
} from "../types/ingredients";
import type { ApiResponse, PageBE } from "../types/common";
import { buildIngredientFormData, mapBEToDraft } from "../utils/ingredients.formdata";

/* ===================== helpers: type guards & unwrap ===================== */

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

function hasDataProp<T>(x: unknown): x is ApiResponse<T> {
    return isRecord(x) && "data" in x;
}

function hasArrayContentProp<T>(x: unknown): x is { content: T[] } {
    return isRecord(x) && Array.isArray(x.content);
}

function unwrapApi<T>(payload: unknown): T {
    return hasDataProp<T>(payload) ? payload.data : (payload as T);
}

/** Chuẩn hoá lỗi Axios thành message ngắn gọn (không dùng any/require) */
export function toAxiosMessage(err: unknown): string {
    if (isAxiosError(err)) {
        const s = err.response?.status ?? "ERR";
        const d = err.response?.data as unknown;
        let msg = err.message;

        if (typeof d === "string" && d) msg = d;
        else if (isRecord(d)) {
            if (typeof d.message === "string") msg = d.message;
            else if (typeof (d as Record<string, unknown>).error === "string")
                msg = String((d as Record<string, unknown>).error);
        }
        return `HTTP ${s}: ${msg}`;
    }
    return (err as { message?: string })?.message ?? "Lỗi không xác định";
}

/* ===================== mapping ===================== */
export function mapIngredient(be: IngredientBE): Ingredient {
    const kcal = be.per100?.kcal ?? undefined;
    return {
        id: String(be.id),
        name: be.name,
        image: be.imageUrl ?? undefined,
        servingUnit: be.unit ?? undefined,
        unitWeightGram: be.servingSizeGram ?? undefined,
        calories: typeof kcal === "number" ? kcal : undefined,
        kcalPer100g: typeof kcal === "number" ? kcal : undefined,
        description: undefined,
        servingSize: undefined,
        cookTimeMin: undefined,
        proteinG: be.per100?.proteinG ?? undefined,
        carbG: be.per100?.carbG ?? undefined,
        fatG: be.per100?.fatG ?? undefined,
        fiberG: be.per100?.fiberG ?? undefined,
        sodiumMg: be.per100?.sodiumMg ?? undefined,
        sugarMg: be.per100?.sugarMg ?? undefined,
    };
}

/* ===================== services ===================== */

/** Phân trang danh sách Ingredients */
export async function fetchIngredientsPage(
    page: number,
    size: number,
    signal?: AbortSignal
): Promise<{ items: Ingredient[]; last: boolean; number: number }> {
    try {
        const url = `${ENDPOINTS.ingredientsAll}?page=${page}&size=${size}&sort=createdAt,desc&sort=id,desc`;
        const { data } = await http.get<
            ApiResponse<PageBE<IngredientBE>> | PageBE<IngredientBE>
        >(url, { signal });

        const bePage = unwrapApi<PageBE<IngredientBE>>(data);
        const content = Array.isArray(bePage.content) ? bePage.content : [];
        return {
            items: content.map(mapIngredient),
            last: Boolean(bePage.last),
            number: typeof bePage.number === "number" ? bePage.number : page,
        };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** Tìm nguyên liệu theo tên (server-side) */
export async function searchIngredientsByName(
    name: string,
    signal?: AbortSignal
): Promise<Ingredient[]> {
    try {
        const { data } = await http.get(ENDPOINTS.ingredientsSearch, {
            params: { name },
            signal,
        });

        // data có thể là Array<IngredientBE> | ApiResponse<Array<IngredientBE> | PageBE<IngredientBE>> | Page-like
        const root = unwrapApi<unknown>(data);

        if (Array.isArray(root)) {
            return root.map(mapIngredient);
        }
        if (hasArrayContentProp<IngredientBE>(root)) {
            return (root.content as IngredientBE[]).map(mapIngredient);
        }
        // Trường hợp payload là { data: [...] } đã unwrap ở trên; thêm fallback nhẹ
        if (isRecord(root) && Array.isArray(root.data)) {
            return (root.data as IngredientBE[]).map(mapIngredient);
        }

        return [];
    } catch (err) {
        // abort/cancel -> trả mảng rỗng
        if ((err as { name?: string })?.name === "CanceledError") return [];
        if (axios.isCancel?.(err)) return [];
        throw new Error(toAxiosMessage(err));
    }
}

/** Xoá nguyên liệu */
export async function deleteIngredient(id: string): Promise<void> {
    try {
        await http.delete(`${ENDPOINTS.ingredientsBase}/${id}`);
    } catch (err) {
        throw new Error(`Xoá thất bại: ${toAxiosMessage(err)}`);
    }
}

/** Stats tổng quan Ingredients */
export async function fetchIngredientsOverview(
    signal?: AbortSignal
): Promise<IngredientsOverview> {
    try {
        const { data } = await http.get(ENDPOINTS.overviewIngredients, { signal });
        const root = unwrapApi<unknown>(data);

        if (isRecord(root)) {
            const totalRaw =
                (root.countIngredients as number | undefined) ??
                (root.totalIngredients as number | undefined) ??
                0;
            const newRaw =
                (root.countNewIngredientsThisWeek as number | undefined) ??
                (root.countNewIngredientsInLastWeek as number | undefined) ??
                0;

            return { newThisWeek: Number(newRaw) || 0, total: Number(totalRaw) || 0 };
        }

        // fallback an toàn
        return { newThisWeek: 0, total: 0 };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** Tạo nguyên liệu mới */
export async function createIngredient(draft: IngredientDraft): Promise<IngredientDraft> {
    try {
        const fd = await buildIngredientFormData(draft);
        // Theo ENDPOINTS bạn đưa: POST /ingredients (ingredientsBase)
        // (Nếu BE của bạn là /ingredients/save thì đổi sang ENDPOINTS riêng.)
        const { data } = await http.post<ApiResponse<IngredientBE> | IngredientBE>(ENDPOINTS.ingredientsBase, fd);
        const be = (data as ApiResponse<IngredientBE>)?.data ?? (data as IngredientBE);
        return mapBEToDraft(be, draft);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** Cập nhật nguyên liệu */
export async function updateIngredient(id: string, draft: IngredientDraft): Promise<IngredientDraft> {
    try {
        const fd = await buildIngredientFormData(draft);
        const { data } = await http.patch<ApiResponse<IngredientBE> | IngredientBE>(`${ENDPOINTS.ingredientsBase}/${id}`, fd);
        const be = (data as ApiResponse<IngredientBE>)?.data ?? (data as IngredientBE);
        return mapBEToDraft(be, draft);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

export async function autocompleteIngredients(
    keyword: string,
    limit = 10,
    signal?: AbortSignal
): Promise<IngredientResponse[]> {
    try {
        const { data } = await http.get<ApiResponse<IngredientResponse[]>>(
            ENDPOINTS.ingredientsAutocomplete,
            { params: { keyword, limit }, signal }
        );
        return data.data;
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}
