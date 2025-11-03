import type { Unit, NutritionResponse, NutritionRequest } from "../types/types";
export type IngredientDraft = {
    id: string;
    name: string;
    description?: string;
    image?: string;         
    servingSize?: number;   
    servingUnit?: string;   
    unitWeightGram?: number; 
    calories?: number;      
    proteinG?: number;
    carbG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    sugarMg?: number;
    cookTimeMin?: number;   
    tags?: string[];
    aliases?: string[];
};

export type Ingredient = IngredientDraft & {
    unit?: string;
    kcalPer100g?: number;
    calories?: number;
};

export type IngredientResponse = {
    id: string;
    name: string;
    per100: NutritionResponse;
    imageUrl: string;
    aliases: string[];
    unit: Unit;
};

export type IngredientCreationRequest = {
    name : string;
    per100 : NutritionRequest;
    image : File;
    aliases : string[];
    unit : Unit;
};

export type IngredientUpdateRequest = {
    name: string;
    per100: NutritionRequest;
    image?: File;  
    aliases: string[];
    unit: Unit;
};