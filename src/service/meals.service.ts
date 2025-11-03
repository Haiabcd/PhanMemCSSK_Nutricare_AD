import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import { toAxiosMessage } from "./helpers";
import type { SuggestionAI, FoodCreationRequest, FoodResponse, FoodPatchRequest} from "../types/meals";
import type { ApiResponse, Slice } from "../types/types";

/** Phân trang danh sách Foods (Slice<FoodResponse>) */
export async function fetchFoodsPage(
    page: number,
    size: number,
    signal?: AbortSignal
  ): Promise<{ items: FoodResponse[]; last: boolean; number: number }> {
    const url = `${ENDPOINTS.foods.list}?page=${page}&size=${size}&sort=createdAt,desc&sort=id,desc`;
    try {
      const { data } = await http.get<ApiResponse<Slice<FoodResponse>>>(url, { signal });
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
  
/** Autocomplete Foods */
export async function autocompleteFoods(
    keyword: string,
    limit = 10,
    signal?: AbortSignal
  ): Promise<FoodResponse[]> {
    try {
      const { data } = await http.get<ApiResponse<FoodResponse[]>>(
        ENDPOINTS.foods.autocomplete,
        { params: { keyword, limit }, signal }
      );
      return data.data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/**Viết mô tả món ăn */
export async function suggestDescription(
    req: SuggestionAI,
    signal?: AbortSignal
  ): Promise<string> {
    try {
      const fd = new FormData();
      if (req.image) fd.append("image", req.image);
      fd.append("dishName", req.dishName);
      fd.append("nutrition.kcal", String(req.nutrition.kcal));
      fd.append("nutrition.proteinG", String(req.nutrition.proteinG));
      fd.append("nutrition.carbG", String(req.nutrition.carbG));
      fd.append("nutrition.fatG", String(req.nutrition.fatG));
      fd.append("nutrition.fiberG", String(req.nutrition.fiberG));
      fd.append("nutrition.sodiumMg", String(req.nutrition.sodiumMg));
      fd.append("nutrition.sugarMg", String(req.nutrition.sugarMg));
  
      const { data } = await http.post<string>(
        ENDPOINTS.ai.descriptionSuggestion,
        fd,
        { headers: { "Content-Type": "multipart/form-data" }, signal }
      );
  
      return typeof data === "string" ? data : String(data ?? "");
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/** Xoá Food theo ID */
export async function deleteFood(id: string): Promise<void> {
    try {
      await http.delete<ApiResponse<void>>(ENDPOINTS.foods.delete(id));
    } catch (err) {
      throw new Error(`Xoá thất bại: ${toAxiosMessage(err)}`);
    }
}


/** Tạo Food mới (multipart/form-data) */
function toFormDataFromFoodCreation(req: FoodCreationRequest): FormData {
  const fd = new FormData();
  fd.append("name", req.name);
  if (req.description) fd.append("description", req.description);
  fd.append("defaultServing", String(req.defaultServing));
  fd.append("servingName", req.servingName);
  fd.append("servingGram", String(req.servingGram)); 
  fd.append("cookMinutes", String(req.cookMinutes));
  fd.append("nutrition.kcal", String(req.nutrition.kcal));
  fd.append("nutrition.proteinG", String(req.nutrition.proteinG));
  fd.append("nutrition.carbG", String(req.nutrition.carbG));
  fd.append("nutrition.fatG", String(req.nutrition.fatG));
  fd.append("nutrition.fiberG", String(req.nutrition.fiberG));
  fd.append("nutrition.sodiumMg", String(req.nutrition.sodiumMg));
  fd.append("nutrition.sugarMg", String(req.nutrition.sugarMg));
  for (const slot of req.mealSlots ?? []) {
    if (slot) fd.append("mealSlots", slot);
  }
  for (const tag of req.tags ?? []) {
    if (tag && tag.trim()) fd.append("tags", tag.trim());
  }
  (req.ingredients ?? []).forEach((ing, i) => {
    fd.append(`ingredients[${i}].ingredientId`, ing.ingredientId);
    fd.append(`ingredients[${i}].quantity`, String(ing.quantity));
  });
  fd.append("image", req.image, req.image.name || "image.jpg");

  return fd;
}


export async function createFood(payload: FoodCreationRequest): Promise<FoodResponse> {
    try {
      const fd = toFormDataFromFoodCreation(payload);
      const { data } = await http.post<ApiResponse<FoodResponse>>(ENDPOINTS.foods.create, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
  }


  function toFormDataFromFoodPatch(req: FoodPatchRequest): FormData {
    const fd = new FormData();
    fd.append("name", req.name);
    fd.append("defaultServing", String(req.defaultServing));
    fd.append("servingGram", String(req.servingGram));
    fd.append("cookMinutes", String(req.cookMinutes));
    if (req.description !== undefined) fd.append("description", req.description ?? "");
    if (req.servingName !== undefined && req.servingName !== null && req.servingName !== "") {
      fd.append("servingName", req.servingName);
    }
    if (req.image) {
      fd.append("image", req.image, req.image.name || "image.jpg");
    }
    fd.append("nutrition.kcal", String(req.nutrition.kcal));
    fd.append("nutrition.proteinG", String(req.nutrition.proteinG));
    fd.append("nutrition.carbG", String(req.nutrition.carbG));
    fd.append("nutrition.fatG", String(req.nutrition.fatG));
    fd.append("nutrition.fiberG", String(req.nutrition.fiberG));
    fd.append("nutrition.sodiumMg", String(req.nutrition.sodiumMg));
    fd.append("nutrition.sugarMg", String(req.nutrition.sugarMg));
    (req.mealSlots ?? []).forEach((slot) => slot && fd.append("mealSlots", slot));
    (req.tags ?? []).forEach((tag) => tag && fd.append("tags", tag));
    (req.ingredients ?? []).forEach((ing, i) => {
      fd.append(`ingredients[${i}].ingredientId`, ing.ingredientId);
      fd.append(`ingredients[${i}].quantity`, String(ing.quantity));
    });
  
    return fd;
  }

/** Gọi PATCH /foods/{id} (multipart/form-data) */
export async function updateFood(id: string, payload: FoodPatchRequest): Promise<void> {
  try {
    const fd = toFormDataFromFoodPatch(payload);
    await http.patch<ApiResponse<void>>(ENDPOINTS.foods.update(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}