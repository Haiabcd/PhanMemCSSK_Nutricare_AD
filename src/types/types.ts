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

export type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
}; 

export type Unit = "MG" | "G" | "ML" | "L";

export type NutritionResponse= {
    kcal:number;
    proteinG:number;
    carbG:number;
    fatG:number;
    fiberG:number;
    sodiumMg:number;
    sugarMg:number;
};
export type Nutrition = {
    kcal: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    fiberG: number;
    sodiumMg: number;
    sugarMg: number;
};
export type NutritionRequest = Nutrition;

export type Slice<T> = {
    content: T[];
    last: boolean;
     number: number;
};
      
export type TagDto = {
    id: string;
    nameCode: string;
    description: string | null;
};

export type TagCreationRequest = {
    nameCode: string;
    description?: string | null;
};