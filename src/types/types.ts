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

export type FoodTopKcal = { name: string; kcal: number };
export type FoodTopProtein = { name: string; proteinG: number };


export type EnergyBin = {
    label: string;
    minKcal: number | null;
    maxKcal: number | null;
    count: number;
};
export type EnergyHistogramDto = {
    bins: EnergyBin[];
    total: number;
    maxBinCount: number;
};

export type OverviewNutritionDto = {
    countFoodsUnder300Kcal: number;
    countFoodsOver800Kcal: number;
    countFoodsWithComplete5: number;
    totalFoods: number;
    getDataCompletenessRate: number; // %
    getTop10HighestKcalFoods: FoodTopKcal[];
    getTop10HighestProteinFoods: FoodTopProtein[];
    getEnergyHistogramFixed: EnergyHistogramDto;
};

