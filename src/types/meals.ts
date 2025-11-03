import type { Nutrition, NutritionResponse, TagDto } from "./types";


export type TopItem = { id: string; name: string; logs: number };

/** ====== BE payloads ====== */
export type RecipeIngredientResponse={
    ingredientId: string;
    name: string;
    unit: string;
    imageUrl: string | null;
    quantity: number;
}

export type FoodResponse = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    servingName: string | null;
    servingGram: number | null;
    defaultServing: number | null;
    cookMinutes: number | null;
    nutrition: NutritionResponse | null;
    mealSlots: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[];
    tags: TagDto[];
    ingredients:RecipeIngredientResponse[];
};

export type FoodCreationRequest = {
    name: string;
    description?: string;
    defaultServing: number;
    servingName: string;
    servingGram: number;
    cookMinutes: number;
    nutrition: {
        kcal: number;
        proteinG: number;
        carbG: number;
        fatG: number;
        fiberG: number;
        sodiumMg: number;
        sugarMg: number;
    };
    mealSlots: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[];
    tags: string[];
    image: File;
    ingredients: {
        ingredientId: string;
        quantity: number;
    }[];
}

export type FoodPatchRequest = {
    name: string; 
    description?: string;
    defaultServing: number; 
    servingName?: string; 
    servingGram: number; 
    cookMinutes: number;
    nutrition: {
      kcal: number;
      proteinG: number;
      carbG: number;
      fatG: number;
      fiberG: number;
      sodiumMg: number;
      sugarMg: number;
    };
    mealSlots: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[]; 
    tags: string[]; 
    image?: File; 
    ingredients: {
      ingredientId: string;
      quantity: number;
    }[];
};

export type SuggestionAI = {
    image?: File;     
    dishName: string;  
    nutrition: Nutrition; 
  };