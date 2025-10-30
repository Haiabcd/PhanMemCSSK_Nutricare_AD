import { isAxiosError } from "axios";
import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import { toAxiosMessage } from "./helpers";
import type { Meal, MealSlot, MealsOverviewDto, TopItem, FoodBE, MealsOverviewBE } from "../types/meals";
import type { ApiResponse, PageBE } from "../types/common";
import { buildMealFormData } from "../utils/food.formdata";

/* ======================= Type guards / helpers ======================= */
function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}
function hasDataProp<T>(x: unknown): x is ApiResponse<T> {
    return isRecord(x) && "data" in x;
}
function hasArrayContentProp<T>(x: unknown): x is { content: T[] } {
    return isRecord(x) && Array.isArray((x as { content?: unknown }).content);
}
function unwrapApi<T>(payload: unknown): T {
    return hasDataProp<T>(payload) ? payload.data : (payload as T);
}
function getNumber(v: unknown, fallback = 0): number {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function cryptoRandomId(): string {
    try {
        const u32 = new Uint32Array(1);
        (globalThis.crypto as Crypto).getRandomValues(u32);
        return u32[0].toString(36);
    } catch {
        return Math.random().toString(36).slice(2);
    }
}

/* ======================= Mappers ======================= */
const mapSlot = (s: FoodBE["mealSlots"][number]): MealSlot => {
    switch (s) {
        case "BREAKFAST": return "Bữa sáng";
        case "LUNCH": return "Bữa trưa";
        case "DINNER": return "Bữa chiều";
        default: return "Bữa phụ";
    }
};

const mapFoodToMeal = (f: FoodBE): Meal => ({
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    image: f.imageUrl ?? undefined,
    servingSize: f.defaultServing ?? undefined,
    servingUnit: f.servingName ?? undefined,
    unitWeightGram: f.servingGram ?? undefined,
    cookTimeMin: f.cookMinutes ?? undefined,
    calories: f.nutrition?.kcal ?? undefined,
    proteinG: f.nutrition?.proteinG ?? undefined,
    carbG: f.nutrition?.carbG ?? undefined,
    fatG: f.nutrition?.fatG ?? undefined,
    fiberG: f.nutrition?.fiberG ?? undefined,
    sodiumMg: f.nutrition?.sodiumMg ?? undefined,
    sugarMg: f.nutrition?.sugarMg ?? undefined,
    slots: (f.mealSlots || []).map(mapSlot),
});

function normalizeTop(items: unknown[]): TopItem[] {
    const result: TopItem[] = [];
    for (const it of items) {
        if (!isRecord(it)) continue;
        const idSrc = it.id ?? it.foodId ?? it.mealId ?? (isRecord(it.food) ? it.food.id : undefined) ?? it.itemId ?? undefined;
        const nameSrc = it.name ?? it.foodName ?? it.title ?? (isRecord(it.food) ? it.food.name : undefined) ?? it.mealName ?? "—";
        const logsSrc = it.logs ?? it.count ?? it.total ?? it.uses ?? it.numLogs ?? 0;
        const id = String(idSrc ?? cryptoRandomId());
        const name = String(nameSrc ?? "—");
        const logs = getNumber(logsSrc, 0);
        if (name && id) result.push({ id, name, logs });
    }
    return result.slice(0, 10);
}
function isCanceled(err: unknown): boolean {
    if (isAxiosError(err) && (err.code === "ERR_CANCELED" || err.message.toLowerCase().includes("canceled"))) return true;
    const name = (err as { name?: string })?.name;
    return name === "CanceledError";
}

/* ======================= Services ======================= */

// Trang tất cả món (phân trang)
export async function fetchFoodsPage(page: number, size: number): Promise<{
    meals: Meal[];
    last: boolean;
    number: number;
}> {
    try {
        const url = `${ENDPOINTS.foodsAll}?page=${page}&size=${size}&sort=createdAt,desc&sort=id,desc`;
        const { data } = await http.get<ApiResponse<PageBE<FoodBE>> | PageBE<FoodBE>>(url);
        const bePage = unwrapApi<PageBE<FoodBE>>(data);
        const content = Array.isArray(bePage.content) ? bePage.content : [];
        return {
            meals: content.map(mapFoodToMeal),
            last: Boolean(bePage.last),
            number: typeof bePage.number === "number" ? bePage.number : page,
        };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

// Tìm món theo tên (server-side)
export async function searchFoodsByName(name: string, signal?: AbortSignal): Promise<Meal[]> {
    try {
        const { data } = await http.get<ApiResponse<unknown> | unknown>(ENDPOINTS.foodsSearch, { params: { name }, signal });
        const root = unwrapApi<unknown>(data);

        if (Array.isArray(root)) return (root as FoodBE[]).map(mapFoodToMeal);
        if (hasArrayContentProp<FoodBE>(root)) return (root.content as FoodBE[]).map(mapFoodToMeal);
        if (isRecord(root) && Array.isArray(root.data)) return (root.data as FoodBE[]).map(mapFoodToMeal);

        return [];
    } catch (err: unknown) {
        if (isCanceled(err)) return [];
        throw new Error(toAxiosMessage(err));
    }
}

// Xoá món
export async function deleteFood(id: string): Promise<void> {
    try {
        await http.delete(ENDPOINTS.foodsById(id));
    } catch (err) {
        throw new Error(`Xoá thất bại: ${toAxiosMessage(err)}`);
    }
}

// Thống kê overview/meals
export async function fetchMealsOverview(signal?: AbortSignal): Promise<MealsOverviewDto> {
    try {
        const { data } = await http.get<ApiResponse<unknown> | unknown>(ENDPOINTS.overviewMeals, { signal });
        const root = unwrapApi<unknown>(data);

        const be: MealsOverviewBE = isRecord(root)
            ? (root as MealsOverviewBE)
            : {
                countNewFoodsInLastWeek: 0,
                totalFoods: 0,
                countLogsFromPlanSource: 0,
                countLogsFromScanSource: 0,
                countLogsFromManualSource: 0,
                getTop10FoodsFromPlan: [],
            };

        return {
            newMealsThisWeek: getNumber(be.countNewFoodsInLastWeek, 0),
            totalFoods: getNumber(be.totalFoods, 0),
            manual: getNumber(be.countLogsFromManualSource, 0),
            scan: getNumber(be.countLogsFromScanSource, 0),
            plan: getNumber(be.countLogsFromPlanSource, 0),
            top10: normalizeTop(be.getTop10FoodsFromPlan ?? []),
        };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** Tạo món ăn (multipart/form-data @ModelAttribute) */
export async function createMeal(draft: Meal): Promise<Meal> {
    try {
        const fd = buildMealFormData(draft);
        const { data } = await http.post<ApiResponse<FoodBE> | FoodBE>(ENDPOINTS.foodsSave, fd);
        const be = unwrapApi<FoodBE>(data);
        const mapped = mapFoodToMeal(be ?? ({} as FoodBE));
        if (draft.image?.startsWith("data:")) mapped.image = draft.image;
        return mapped;
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** Cập nhật món ăn (multipart/form-data @ModelAttribute) */
export async function updateMeal(id: string, draft: Meal): Promise<Meal> {
    try {
        const fd = buildMealFormData(draft);
        const { data } = await http.patch<ApiResponse<FoodBE> | FoodBE>(ENDPOINTS.foodsById(id), fd);
        const be = unwrapApi<FoodBE>(data);
        const mapped = mapFoodToMeal(be ?? ({} as FoodBE));
        if (draft.image?.startsWith("data:")) mapped.image = draft.image;
        return mapped;
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}
