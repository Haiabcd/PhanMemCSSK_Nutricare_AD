export type MealSlot = "Bữa sáng" | "Bữa trưa" | "Bữa chiều" | "Bữa phụ";
export type Meal = {
    id: string;
    name: string;
    description?: string;
    image?: string; // URL
    servingSize?: number; // e.g., 1, 2
    servingUnit?: string; // tô/chén/ly/đĩa/...
    unitWeightGram?: number; // gram per 1 unit
    cookTimeMin?: number; // minutes
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    sugarMg?: number;
    slots: MealSlot[]; // selectable multiple
};
export type User = { uid: string; displayName: string; email?: string; photoURL?: string } | null;
export type TabKey = "overview" | "meals" | "userStats" | "nutritionStats" | "mealStats";