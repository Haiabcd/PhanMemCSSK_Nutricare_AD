import type { Unit } from "../types/types";
export type IngredientDraft = {
    id: string;
    name: string;
    description?: string;
    image?: string;         // dataURL hoặc URL BE
    servingSize?: number;   // defaultServing
    servingUnit?: string;   // servingName | unit
    unitWeightGram?: number; // servingSizeGram
    calories?: number;      // per100.kcal
    proteinG?: number;
    carbG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    sugarMg?: number;
    cookTimeMin?: number;   // cookMinutes
    tags?: string[];
    aliases?: string[];
};

export type IngredientBE = {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    unit?: string | null;
    servingName?: string | null;
    servingSizeGram?: number | null;
    servingGram?: number | null;

    defaultServing?: number | null;
    cookMinutes?: number | null;

    per100?: {
        kcal?: number | null;
        proteinG?: number | null;
        carbG?: number | null;
        fatG?: number | null;
        fiberG?: number | null;
        sodiumMg?: number | null;
        sugarMg?: number | null;
    } | null;

    tags?: string[] | null;
    aliases?: string[] | null;
};

export type Ingredient = IngredientDraft & {
    unit?: string;
    kcalPer100g?: number;
    calories?: number;
};


export type IngredientsOverview = {
    newThisWeek: number;
    total: number;
};

export type IngredientResponse = {
    id: string;
    name: string;
    imageUrl: string;
    servingName: string;
    servingSizeGram: number;
    aliases: string[];
    unit: Unit;
};
