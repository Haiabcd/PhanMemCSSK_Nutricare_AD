// src/types.ts
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
