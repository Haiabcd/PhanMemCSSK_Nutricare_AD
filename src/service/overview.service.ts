import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import type { OverviewNutritionDto } from "../types/types";
import type { MealsManageResponse, RawOverview } from "../types/overview";
import type { OverviewUsersResponse } from "../types/users";
import { toAxiosMessage } from "./helpers";

export async function fetchOverviewNutrition(signal?: AbortSignal): Promise<OverviewNutritionDto> {
    const res = await http.get<OverviewNutritionDto>(ENDPOINTS.overviewNutrition, { signal });
    return res.data;
}

export async function fetchOverview(signal?: AbortSignal): Promise<RawOverview> {
    const { data } = await http.get<RawOverview>(ENDPOINTS.overview, { signal });
    return data;
}

export async function fetchOverviewUsers(signal?: AbortSignal): Promise<OverviewUsersResponse> {
    const { data } = await http.get<OverviewUsersResponse>(ENDPOINTS.overviewUsers, { signal });
    return data;
}

/** Stats tổng quan Meals */
export async function fetchMealsOverview(
    signal?: AbortSignal
  ): Promise<MealsManageResponse> {
    try {
      const { data } = await http.get<MealsManageResponse>(
        ENDPOINTS.overviewMeals,
        { signal }
      );
      return data; 
    } catch (err) {
      throw new Error(toAxiosMessage(err));
    }
  }