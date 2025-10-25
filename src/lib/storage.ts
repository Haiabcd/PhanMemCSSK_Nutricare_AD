import type { Meal } from "../types";
export const STORAGE_KEY = "nutricare_admin_meals";
export const uid = () => Math.random().toString(36).slice(2);
export const DEFAULT_MEALS: Meal[] = [
    {
        id: uid(),
        name: "Phở bò",
        description: "Phở nước dùng đậm đà với thịt bò mềm.",
        image: "https://images.unsplash.com/photo-1604908176997-43162b7a2f22?q=80&w=1600&auto=format&fit=crop",
        servingSize: 1,
        servingUnit: "tô",
        unitWeightGram: 450,
        cookTimeMin: 25,
        calories: 480,
        proteinG: 30,
        carbG: 60,
        fatG: 14,
        fiberG: 3,
        sodiumMg: 1600,
        sugarMg: 5,
        slots: ["Bữa sáng", "Bữa trưa"],
    },
    {
        id: uid(),
        name: "Cơm gà xé",
        description: "Cơm gà luộc/xé, ít mỡ, rau dưa đi kèm.",
        image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1600&auto=format&fit=crop",
        servingSize: 1,
        servingUnit: "đĩa",
        unitWeightGram: 350,
        cookTimeMin: 35,
        calories: 560,
        proteinG: 35,
        carbG: 75,
        fatG: 12,
        fiberG: 4,
        sodiumMg: 900,
        sugarMg: 6,
        slots: ["Bữa trưa", "Bữa chiều"],
    },
];
export function loadMeals(): Meal[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Meal[]) : DEFAULT_MEALS;
    } catch {
        return DEFAULT_MEALS;
    }
}
export function saveMeals(meals: Meal[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
}