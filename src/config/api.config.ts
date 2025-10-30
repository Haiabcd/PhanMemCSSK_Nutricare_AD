const RAW_API_BASE =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";

export const API_BASE = RAW_API_BASE.replace(/\/$/, "");

export const ENDPOINTS = {
    overview: `${API_BASE}/overview`,
    overviewNutrition: `${API_BASE}/overview/nutrition`,
    overviewUsers: `${API_BASE}/overview/users`,
    overviewMeals: `${API_BASE}/overview/meals`,

    // ===== Foods / Meals =====
    foods: `${API_BASE}/foods`,
    foodsAll: `${API_BASE}/foods/all`,
    foodsSearch: `${API_BASE}/foods/search`,
    foodsSave: `${API_BASE}/foods/save`,
    foodsById: (id: string) => `${API_BASE}/foods/${id}`,

    // ===== Clinical =====
    overviewClinical: `${API_BASE}/overview/clinical`,
    conditions: {
        list: `${API_BASE}/conditions/all`,
        stats: `${API_BASE}/conditions/stats`,
        search: `${API_BASE}/conditions/search`,
        create: `${API_BASE}/conditions`,
        update: (id: string) => `${API_BASE}/conditions/${id}`,
        delete: (id: string) => `${API_BASE}/conditions/${id}`,
    },
    allergies: {
        list: `${API_BASE}/allergies/all`,
        stats: `${API_BASE}/allergies/stats`,
        search: `${API_BASE}/allergies/search`,
        create: `${API_BASE}/allergies`,
        update: (id: string) => `${API_BASE}/allergies/${id}`,
        delete: (id: string) => `${API_BASE}/allergies/${id}`,
    },

    // ===== Ingredients =====
    ingredientsAll: `${API_BASE}/ingredients/all`,
    ingredientsSearch: `${API_BASE}/ingredients/search`,
    ingredientsBase: `${API_BASE}/ingredients`,
    overviewIngredients: `${API_BASE}/overview/ingredients`,
} as const;
