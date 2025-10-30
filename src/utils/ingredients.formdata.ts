import type { IngredientDraft, IngredientBE } from "../types/ingredients";

export function dataURLtoBlob(dataUrl: string): Blob {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

function safeAppend(fd: FormData, key: string, v?: number, fallback = 0) {
    const val = v !== undefined && v !== null ? v : fallback;
    fd.append(key, String(val));
}

/** UI Draft -> FormData theo @ModelAttribute bên BE */
export async function buildIngredientFormData(d: IngredientDraft): Promise<FormData> {
    const fd = new FormData();

    // Các field cơ bản
    fd.append("name", d.name.trim());

    // Unit bắt buộc (G/ML). Nếu UI nhập "g"/"ml" thì chuẩn hoá:
    const unit = (d.servingUnit || d.servingUnit || "G").toUpperCase();
    fd.append("unit", unit);

    if (d.description) fd.append("description", d.description);
    if (d.servingUnit) fd.append("servingName", d.servingUnit);

    safeAppend(fd, "servingSizeGram", d.unitWeightGram, 0);
    safeAppend(fd, "defaultServing", d.servingSize, 1);
    safeAppend(fd, "cookMinutes", d.cookTimeMin, 0);

    // per100.*
    safeAppend(fd, "per100.kcal", d.calories, 0);
    safeAppend(fd, "per100.proteinG", d.proteinG, 0);
    safeAppend(fd, "per100.carbG", d.carbG, 0);
    safeAppend(fd, "per100.fatG", d.fatG, 0);
    safeAppend(fd, "per100.fiberG", d.fiberG, 0);
    safeAppend(fd, "per100.sodiumMg", d.sodiumMg, 0);
    safeAppend(fd, "per100.sugarMg", d.sugarMg, 0);

    // Ảnh: dataURL -> file; URL -> imageUrl
    if (d.image) {
        if (d.image.startsWith("data:")) {
            const blob = dataURLtoBlob(d.image);
            fd.append("image", blob, "ingredient.jpg");
        } else {
            fd.append("imageUrl", d.image);
        }
    }

    return fd;
}

/** BE -> UI Draft (để trả kết quả sau khi create/update) */
export function mapBEToDraft(be: IngredientBE, fallback: IngredientDraft): IngredientDraft {
    return {
        id: String(be.id ?? fallback.id ?? cryptoRandomId()),
        name: be.name ?? fallback.name,
        description: be.description ?? fallback.description,
        image: be.imageUrl ?? fallback.image,
        servingSize: be.defaultServing ?? fallback.servingSize,
        servingUnit: be.servingName ?? be.unit ?? fallback.servingUnit,
        unitWeightGram: be.servingSizeGram ?? be.servingGram ?? fallback.unitWeightGram,
        cookTimeMin: be.cookMinutes ?? fallback.cookTimeMin,
        calories: be.per100?.kcal ?? fallback.calories,
        proteinG: be.per100?.proteinG ?? fallback.proteinG,
        carbG: be.per100?.carbG ?? fallback.carbG,
        fatG: be.per100?.fatG ?? fallback.fatG,
        fiberG: be.per100?.fiberG ?? fallback.fiberG,
        sodiumMg: be.per100?.sodiumMg ?? fallback.sodiumMg,
        sugarMg: be.per100?.sugarMg ?? fallback.sugarMg,
        tags: be.tags ?? fallback.tags,
        aliases: be.aliases ?? fallback.aliases,
    };
}

function cryptoRandomId(): string {
    try {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0].toString(36);
    } catch {
        return Math.random().toString(36).slice(2);
    }
}
