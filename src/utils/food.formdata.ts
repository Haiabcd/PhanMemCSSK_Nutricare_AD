import type { Meal, MealSlot } from "../types/meals";

export function dataURLtoBlob(dataUrl: string): Blob {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

/** UI → BE enum */
export function mapUiSlotToBE(s: MealSlot): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
    switch (s) {
        case "Bữa sáng":
            return "BREAKFAST";
        case "Bữa trưa":
            return "LUNCH";
        case "Bữa chiều":
            return "DINNER";
        default:
            return "SNACK";
    }
}

/** Tạo FormData theo yêu cầu @ModelAttribute bên BE */
export function buildMealFormData(draft: Meal): FormData {
    const fd = new FormData();

    fd.append("name", draft.name);
    if (draft.description) fd.append("description", draft.description);
    if (draft.servingUnit) fd.append("servingName", draft.servingUnit);
    fd.append("servingGram", String(draft.unitWeightGram ?? 0));
    fd.append("defaultServing", String(draft.servingSize ?? 1));
    fd.append("cookMinutes", String(draft.cookTimeMin ?? 0));

    // Nutrition (dot-notation)
    fd.append("nutrition.kcal", String(draft.calories ?? 0));
    fd.append("nutrition.proteinG", String(draft.proteinG ?? 0));
    fd.append("nutrition.carbG", String(draft.carbG ?? 0));
    fd.append("nutrition.fatG", String(draft.fatG ?? 0));
    fd.append("nutrition.fiberG", String(draft.fiberG ?? 0));
    fd.append("nutrition.sodiumMg", String(draft.sodiumMg ?? 0));
    fd.append("nutrition.sugarMg", String(draft.sugarMg ?? 0));

    // Enum list
    draft.slots.map(mapUiSlotToBE).forEach((s) => fd.append("mealSlots", s));

    // Ảnh: dataURL -> file; URL -> imageUrl (không đồng thời)
    if (draft.image) {
        if (draft.image.startsWith("data:")) {
            const blob = dataURLtoBlob(draft.image);
            fd.append("image", blob, "image.jpg");
        } else {
            fd.append("imageUrl", draft.image);
        }
    }

    // Field tùy chọn khác trên BE
    fd.append("ingredient", "false");

    return fd;
}
