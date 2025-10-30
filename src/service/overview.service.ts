import http from "./http";
import { ENDPOINTS } from "../config/api.config";
import type { OverviewNutritionDto } from "../types/types";
import type { RawOverview } from "../types/overview";
import type { OverviewUsersResponse } from "../types/users";

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