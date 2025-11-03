
import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import type { ApiResponse, Slice } from "../types/types";
import type {
    AllergyResponse,
    ConditionResponse,
    AllergyRequest,
    ConditionRequest,
    ClinicalResponse,
    CreationRuleAI,
    NutritionRuleUpdateDto,
} from "../types/clinical";
import { toAxiosMessage } from "./helpers";


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
export async function fetchStats(signal?: AbortSignal): Promise<ClinicalResponse> {
    try {
      const { data } = await http.get<ClinicalResponse>(ENDPOINTS.overviewClinical, { signal });
      return data;
    } catch (err) {
      console.error("Fetch stats error:", toAxiosMessage(err));
      return {
        top5Condition: [],
        top5Allergy: [],
        getTotalAllergies: 0,
        getTotalConditions: 0,
      };
    }
}

/** Tạo bệnh nền */
export async function createCondition(
    payload: ConditionRequest
  ): Promise<ApiResponse<void>> {
    try {
      const { data } = await http.post<ApiResponse<void>>(
        ENDPOINTS.conditions.create, 
        payload
      );
      return data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}
  
/** Tạo dị ứng */
export async function createAllergy(
    payload: AllergyRequest
): Promise<ApiResponse<void>> {
    try {
      const { data } = await http.post<ApiResponse<void>>(
        ENDPOINTS.allergies.create, 
        payload
      );
      return data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/** Cập nhật bênh nền */
export async function updateCondition(
    id: string,
    payload: ConditionRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<void>> {
    try {
      const { data } = await http.put<ApiResponse<void>>(
        ENDPOINTS.conditions.update(id),
        payload,
        { signal }
      );
      return data; 
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}
  
/** Cập nhật dị ứng */
export async function updateAllergy(
    id: string,
    payload: AllergyRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<void>> {
    try {
      const { data } = await http.put<ApiResponse<void>>(
        ENDPOINTS.allergies.update(id),
        payload,
        { signal }
      );
      return data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/**Xóa bệnh nền */
export async function deleteCondition(id: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.conditions.delete(id));
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}
  
/**Xóa dị ứng */
export async function deleteAllergy(id: string): Promise<void> {
    try {
      await http.delete(ENDPOINTS.allergies.delete(id));
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/**Tìm theo tên bệnh nền */
export async function searchConditionsByName(
    name: string,
    page = 0,
    size = 20,
    signal?: AbortSignal
  ): Promise<ApiResponse<Slice<ConditionResponse>>> {
    try {
      const { data } = await http.get<ApiResponse<Slice<ConditionResponse>>>(
        ENDPOINTS.conditions.search,
        { params: { name, page, size }, signal }
      );
      return data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/**Tìm theo tên dị ứng*/
export async function searchAllergiesByName(
    name: string,
    page = 0,
    size = 20,
    signal?: AbortSignal
  ): Promise<ApiResponse<Slice<AllergyResponse>>> {
    try {
      const { data } = await http.get<ApiResponse<Slice<AllergyResponse>>>(
        ENDPOINTS.allergies.search,
        { params: { name, page, size }, signal }
      );
      return data;
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
}

/** Thêm rule*/
export async function addRuleAI(
  payload: CreationRuleAI,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  try {
    const { data } = await http.post<ApiResponse<void>>(
      ENDPOINTS.ai.addRule,
      payload,
      { signal }
    );
    return data;
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}
/**Xóa quy tắc */
export async function deleteNutritionRule(id: string): Promise<void> {
  try {
    await http.delete(ENDPOINTS.nutritionRules.delete(id));
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}

/** Cập nhật quy tắc dinh dưỡng */
export async function updateNutritionRule(
  id: string,
  payload: NutritionRuleUpdateDto,
  signal?: AbortSignal
): Promise<void> {
  try {
    await http.put<ApiResponse<void>>(
      ENDPOINTS.nutritionRules.update(id),
      payload,
      { signal }
    );
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}

/** Lấy dị ứng theo id */
export async function getAllergyById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<AllergyResponse>> {
  try {
    const { data } = await http.get<ApiResponse<AllergyResponse>>(
      ENDPOINTS.allergies.detail(id),
      { signal }
    );
    return data;
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}

/** Lấy bệnh nền theo id */
export async function getConditionById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<ConditionResponse>> {
  try {
    const { data } = await http.get<ApiResponse<ConditionResponse>>(
      ENDPOINTS.conditions.detail(id),
      { signal }
    );
    return data;
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}