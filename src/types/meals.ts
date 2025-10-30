export type MealSlot = "Bữa sáng" | "Bữa trưa" | "Bữa chiều" | "Bữa phụ";

export type Meal = {
    id: string;
    name: string;
    description?: string;
    image?: string;
    servingSize?: number;
    servingUnit?: string;
    unitWeightGram?: number;
    cookTimeMin?: number;
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    sugarMg?: number;
    slots: MealSlot[];
};

export type TopItem = { id: string; name: string; logs: number };

export type MealsOverviewDto = {
    newMealsThisWeek: number;
    totalFoods: number;
    manual: number;
    scan: number;
    plan: number;
    top10: TopItem[];
};
export type MealsOverviewBE = {
    countNewFoodsInLastWeek: number;
    totalFoods: number;
    countLogsFromPlanSource: number;
    countLogsFromScanSource: number;
    countLogsFromManualSource: number;
    getTop10FoodsFromPlan: unknown[];
};

/** ====== BE payloads ====== */
export type FoodBE = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    servingName: string | null;
    servingGram: number | null;
    defaultServing: number | null;
    cookMinutes: number | null;
    nutrition: {
        kcal: number | null;
        proteinG: number | null;
        carbG: number | null;
        fatG: number | null;
        fiberG: number | null;
        sodiumMg: number | null;
        sugarMg: number | null;
    } | null;
    mealSlots: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[];
};



