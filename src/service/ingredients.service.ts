import { isAxiosError } from "axios";
import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import type {
    IngredientBE,
    Ingredient,
    IngredientUpdateRequest,
    IngredientResponse,
    IngredientCreationRequest,
} from "../types/ingredients";
import type { IngredientManageResponse} from "../types/overview";
import type { ApiResponse ,Slice} from "../types/types";
/* ===================== helpers: type guards & unwrap ===================== */
function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

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

function toFormDataFromCreation(req: IngredientCreationRequest): FormData {
    const fd = new FormData();
    fd.append("name", req.name);
    fd.append("unit", String(req.unit));
    const p = req.per100;
    if (p?.kcal !== undefined) fd.append("per100.kcal", String(p.kcal));
    if (p?.proteinG !== undefined) fd.append("per100.proteinG", String(p.proteinG));
    if (p?.carbG !== undefined) fd.append("per100.carbG", String(p.carbG));
    if (p?.fatG !== undefined) fd.append("per100.fatG", String(p.fatG));
    if (p?.fiberG !== undefined) fd.append("per100.fiberG", String(p.fiberG));
    if (p?.sodiumMg !== undefined) fd.append("per100.sodiumMg", String(p.sodiumMg));
    if (p?.sugarMg !== undefined) fd.append("per100.sugarMg", String(p.sugarMg));
    for (const a of req.aliases ?? []) {
      if (a && a.trim()) fd.append("aliases", a.trim());
    }
    fd.append("image", req.image, req.image.name || "image.jpg");
    return fd;
}

function toFormDataFromUpdate(req: IngredientUpdateRequest): FormData {
  const fd = new FormData();
  fd.append("name", req.name);
  fd.append("unit", String(req.unit));

  const p = req.per100;
  if (p?.kcal !== undefined) fd.append("per100.kcal", String(p.kcal));
  if (p?.proteinG !== undefined) fd.append("per100.proteinG", String(p.proteinG));
  if (p?.carbG !== undefined) fd.append("per100.carbG", String(p.carbG));
  if (p?.fatG !== undefined) fd.append("per100.fatG", String(p.fatG));
  if (p?.fiberG !== undefined) fd.append("per100.fiberG", String(p.fiberG));
  if (p?.sodiumMg !== undefined) fd.append("per100.sodiumMg", String(p.sodiumMg));
  if (p?.sugarMg !== undefined) fd.append("per100.sugarMg", String(p.sugarMg));
  for (const a of req.aliases ?? []) {
    if (a && a.trim()) fd.append("aliases", a.trim());
  }
  if (req.image instanceof File) {
    fd.append("image", req.image, req.image.name || "image.jpg");
  }
  return fd;
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
  ): Promise<{ items: IngredientResponse[]; last: boolean; number: number }> {
    const url = `${ENDPOINTS.ingredient.all}?page=${page}&size=${size}&sort=createdAt,desc&sort=id,desc`;
  
    try {
      const { data } = await http.get<ApiResponse<Slice<IngredientResponse>>>(url, { signal });
      const slice = data.data; 
      return {
        items: slice.content ?? [],
        last: !!slice.last,
        number: typeof slice.number === "number" ? slice.number : page,
      };
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}
  
/** Xoá nguyên liệu */
export async function deleteIngredient(id: string): Promise<void> {
    try {
        await http.delete(ENDPOINTS.ingredient.delete(id));
    } catch (err) {
        throw new Error(`Xoá thất bại: ${toAxiosMessage(err)}`);
    }
}

/** Stats tổng quan Ingredients */
export async function fetchIngredientsOverview(
    signal?: AbortSignal
  ): Promise<IngredientManageResponse> {
    try {
      const { data } = await http.get<IngredientManageResponse>(
        ENDPOINTS.ingredient.overview,
        { signal }
      );
      return data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}
  

/** Cập nhật nguyên liệu */
export async function updateIngredient(
    id: string,
    payload: IngredientUpdateRequest
  ): Promise<void> {
    try {
      const fd = toFormDataFromUpdate(payload);
      await http.patch<ApiResponse<void> | void>(ENDPOINTS.ingredient.update(id), fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
  }

/** Tạo nguyên liệu mới */
export async function createIngredient(
    payload: IngredientCreationRequest
  ): Promise<void> {
    try {
      const fd = toFormDataFromCreation(payload);
      await http.post<ApiResponse<void> | void>(ENDPOINTS.ingredient.save, fd);
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}
  

/**Auto completed */
export async function autocompleteIngredients(
    keyword: string,
    limit = 10,
    signal?: AbortSignal
): Promise<IngredientResponse[]> {
    try {
        const { data } = await http.get<ApiResponse<IngredientResponse[]>>(
            ENDPOINTS.ingredient.autocomplete,
            { params: { keyword, limit }, signal }
        );
        return data.data;
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}
