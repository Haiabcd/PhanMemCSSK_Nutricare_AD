
import type { TagDto , TagCreationRequest,ApiResponse} from "../types/types";
import { ENDPOINTS } from "../config/api.config";
import http from "./http";
import { toAxiosMessage } from "./helpers";
import { isRequestCanceled } from "./helpers";


/** Autocomplete tags (không phân biệt hoa thường và dấu) */
export async function fetchTagsAutocomplete(
    q: string,
    limit = 10,
    signal?: AbortSignal
  ): Promise<TagDto[]> {
    try {
      const { data } = await http.get<TagDto[]>(ENDPOINTS.tags.autocomplete, {
        params: { q, limit },
        signal,
      });
      return data;
    } catch (err) {
      if (isRequestCanceled(err)) return [];
      throw new Error(toAxiosMessage(err));
    }
  }

/** Tạo Tag */
export async function createTag(
  payload: TagCreationRequest,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {
  try {
    const { data } = await http.post<ApiResponse<void>>(
      ENDPOINTS.tags.save,
      payload,
      { signal }
    );
    return data;
  } catch (err) {
    throw new Error(toAxiosMessage(err));
  }
}