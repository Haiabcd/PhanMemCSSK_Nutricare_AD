import React, { useRef } from "react";
import axios from "axios";
import { Apple } from "lucide-react";

/** ---- Types ---- */
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

const BASE_URL = "http://localhost:8080";

/** map UI slot -> BE slot */
function mapUiSlotToBE(s: MealSlot): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
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

/** map BE -> UI Meal (dùng khi nhận response) */
function mapFoodToMeal(be: any): Meal {
    const mapSlot = (x: string): MealSlot => {
        switch (x) {
            case "BREAKFAST":
                return "Bữa sáng";
            case "LUNCH":
                return "Bữa trưa";
            case "DINNER":
                return "Bữa chiều";
            default:
                return "Bữa phụ";
        }
    };
    return {
        id: be.id,
        name: be.name,
        description: be.description ?? undefined,
        image: be.imageUrl ?? undefined,
        servingSize: be.defaultServing ?? undefined,
        servingUnit: be.servingName ?? undefined,
        unitWeightGram: be.servingGram ?? undefined,
        cookTimeMin: be.cookMinutes ?? undefined,
        calories: be.nutrition?.kcal ?? undefined,
        proteinG: be.nutrition?.proteinG ?? undefined,
        carbG: be.nutrition?.carbG ?? undefined,
        fatG: be.nutrition?.fatG ?? undefined,
        fiberG: be.nutrition?.fiberG ?? undefined,
        sodiumMg: be.nutrition?.sodiumMg ?? undefined,
        sugarMg: be.nutrition?.sugarMg ?? undefined,
        slots: (be.mealSlots || []).map(mapSlot),
    };
}

/** ---- UI nhỏ gọn ---- */
function PillToggle({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? "bg-green-600 text-white border-green-600 shadow"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
        >
            {children}
        </button>
    );
}

function Label({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="text-sm font-medium text-slate-700">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    value: any;
    onChange: (v: any) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <input
            value={value ?? ""}
            onChange={(e) =>
                onChange(type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)
            }
            placeholder={placeholder}
            type={type}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
        />
    );
}

function Select({
    value,
    onChange,
    options,
    placeholder,
}: {
    value?: string;
    onChange: (v?: string) => void;
    options: string[];
    placeholder?: string;
}) {
    return (
        <select
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-green-100"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

function NumberRow({
    label,
    value,
    setValue,
    suffix,
}: {
    label: string;
    value?: number;
    setValue: (n?: number) => void;
    suffix?: string;
}) {
    return (
        <div className="grid grid-cols-5 items-center gap-3">
            <Label>{label}</Label>
            <div className="col-span-3">
                <TextInput value={value} onChange={setValue} type="number" />
            </div>
            <div className="text-sm text-slate-500">{suffix}</div>
        </div>
    );
}

function ImagePicker({
    value,
    onPicked,
    onClear,
}: {
    value?: string;
    onPicked: (dataUrl: string) => void;
    onClear?: () => void;
}) {
    const ref = useRef<HTMLInputElement | null>(null);
    const pick = () => ref.current?.click();
    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onPicked(String(reader.result));
        reader.readAsDataURL(file);
        e.currentTarget.value = "";
    };
    return (
        <div className="space-y-2">
            {value ? (
                <div className="space-y-2">
                    <img src={value} alt="preview" className="w-full max-h-40 object-cover rounded-xl border" />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={pick}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        >
                            Đổi ảnh…
                        </button>
                        {onClear && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            >
                                Xoá ảnh
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={pick}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                >
                    Chọn tệp…
                </button>
            )}
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
            {!value && <div className="text-xs text-slate-500">Chọn ảnh từ máy của bạn (JPEG/PNG…).</div>}
        </div>
    );
}

/** ---- Modal ---- */
function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative z-10 w-[95vw] max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 grid place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Apple size={18} />
                        </div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        aria-label="Đóng"
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-hide">{children}</div>
            </div>
        </div>
    );
}

/** ---- Form ---- */
function MealForm({ draft, setDraft }: { draft: Meal; setDraft: (m: Meal) => void }) {
    const toggleSlot = (s: MealSlot) => {
        const has = draft.slots.includes(s);
        const next = has ? draft.slots.filter((x) => x !== s) : [...draft.slots, s];
        setDraft({ ...draft, slots: next });
    };
    return (
        <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label required>Tên món ăn</Label>
                    <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Ví dụ: Cơm tấm sườn" />
                </div>
                <div className="space-y-2">
                    <Label>Ảnh</Label>
                    <ImagePicker value={draft.image} onPicked={(dataUrl) => setDraft({ ...draft, image: dataUrl })} onClear={() => setDraft({ ...draft, image: "" })} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Mô tả</Label>
                <textarea
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn về món ăn..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                />
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label>Khẩu phần</Label>
                    <TextInput type="number" value={draft.servingSize} onChange={(v) => setDraft({ ...draft, servingSize: v })} placeholder="1" />
                </div>
                <div className="space-y-2">
                    <Label>Đơn vị khẩu phần</Label>
                    <Select value={draft.servingUnit} onChange={(v) => setDraft({ ...draft, servingUnit: v })} placeholder="Chọn đơn vị" options={["tô", "chén", "ly", "đĩa", "phần", "cốc", "cái", "miếng"]} />
                </div>
                <div className="space-y-2">
                    <Label>Trọng lượng 1 đơn vị</Label>
                    <div className="relative">
                        <TextInput type="number" value={draft.unitWeightGram} onChange={(v) => setDraft({ ...draft, unitWeightGram: v })} placeholder="gram" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">g</span>
                    </div>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
                <NumberRow label="Thời gian nấu" value={draft.cookTimeMin} setValue={(v) => setDraft({ ...draft, cookTimeMin: v })} suffix="phút" />
                <NumberRow label="Calo" value={draft.calories} setValue={(v) => setDraft({ ...draft, calories: v })} suffix="kcal" />
                <NumberRow label="Protein" value={draft.proteinG} setValue={(v) => setDraft({ ...draft, proteinG: v })} suffix="g" />
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
                <NumberRow label="Carb" value={draft.carbG} setValue={(v) => setDraft({ ...draft, carbG: v })} suffix="g" />
                <NumberRow label="Fat" value={draft.fatG} setValue={(v) => setDraft({ ...draft, fatG: v })} suffix="g" />
                <NumberRow label="Fiber" value={draft.fiberG} setValue={(v) => setDraft({ ...draft, fiberG: v })} suffix="g" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
                <NumberRow label="Sodium" value={draft.sodiumMg} setValue={(v) => setDraft({ ...draft, sodiumMg: v })} suffix="mg" />
                <NumberRow label="Sugar" value={draft.sugarMg} setValue={(v) => setDraft({ ...draft, sugarMg: v })} suffix="mg" />
            </div>

            <div className="space-y-2">
                <Label>Bữa ăn (chọn nhiều)</Label>
                <div className="flex flex-wrap gap-2">
                    {["Bữa sáng", "Bữa trưa", "Bữa chiều", "Bữa phụ"].map((s) => (
                        <PillToggle key={s} active={draft.slots.includes(s as MealSlot)} onClick={() => toggleSlot(s as MealSlot)}>
                            {s}
                        </PillToggle>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** ---- Component chính ---- */
export default function AddAndUpdate({
    open,
    isEdit,
    draft,
    setDraft,
    onClose,
    onSave,
}: {
    open: boolean;
    isEdit: boolean;
    draft: Meal;
    setDraft: (m: Meal) => void;
    onClose: () => void;
    onSave: (createdOrUpdated: Meal) => void;
}) {
    // CHỈ thay hành vi lưu: tạo mới (POST /foods/save) hoặc cập nhật (PATCH /foods/{id})
    const handleSave = async () => {
        if (!draft.name?.trim()) return alert("Vui lòng nhập Tên món ăn");

        // Chuẩn bị FormData theo @ModelAttribute multipart/form-data
        const mealSlotsBE = draft.slots.map(mapUiSlotToBE);
        const fd = new FormData();

        fd.append("name", draft.name);
        if (draft.description) fd.append("description", draft.description);
        if (draft.servingUnit) fd.append("servingName", draft.servingUnit);
        fd.append("servingGram", String(draft.unitWeightGram ?? 0));
        fd.append("defaultServing", String(draft.servingSize ?? 1));
        fd.append("cookMinutes", String(draft.cookTimeMin ?? 0));

        // Nutrition (dot-notation để bind object con)
        fd.append("nutrition.kcal", String(draft.calories ?? 0));
        fd.append("nutrition.proteinG", String(draft.proteinG ?? 0));
        fd.append("nutrition.carbG", String(draft.carbG ?? 0));
        fd.append("nutrition.fatG", String(draft.fatG ?? 0));
        fd.append("nutrition.fiberG", String(draft.fiberG ?? 0));
        fd.append("nutrition.sodiumMg", String(draft.sodiumMg ?? 0));
        fd.append("nutrition.sugarMg", String(draft.sugarMg ?? 0));

        // List enum
        mealSlotsBE.forEach((s) => fd.append("mealSlots", s));

        // Ảnh: dataURL -> file; URL -> imageUrl; trống -> không đổi (khi edit)
        if (draft.image) {
            if (draft.image.startsWith("data:")) {
                const blob = dataURLtoBlob(draft.image);
                fd.append("image", blob, "image.jpg"); // field "image" cần khớp FoodCreationRequest
            } else {
                fd.append("imageUrl", draft.image);
            }
        }

        // Các field tuỳ chọn khác
        fd.append("ingredient", "false");

        try {
            const url = isEdit ? `${BASE_URL}/foods/${draft.id}` : `${BASE_URL}/foods/save`;
            const method = isEdit ? "patch" : "post";
            const res = await axios.request({
                url,
                method,
                data: fd,
                withCredentials: false, // endpoint public theo config bạn gửi
                // KHÔNG set Content-Type, để browser tự set boundary của multipart
            });

            const mapped = mapFoodToMeal(res.data?.data ?? {});
            // Nếu dùng ảnh local (dataURL), hiển thị tạm ở UI
            if (draft.image?.startsWith("data:")) {
                mapped.image = draft.image;
            }

            onSave(mapped);

        } catch (e: any) {
            const msg =
                e?.response?.status
                    ? `HTTP ${e.response.status}${e.response.data?.message ? `: ${e.response.data.message}` : ""}`
                    : e?.message ?? (isEdit ? "Cập nhật món thất bại" : "Tạo món thất bại");
            alert(msg);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? "Cập nhật món ăn" : "Thêm món ăn"}>
            <MealForm draft={draft} setDraft={setDraft} />
            <div className="mt-5 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-xl border border-slate-200" onClick={onClose}>
                    Huỷ
                </button>
                <button className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={handleSave}>
                    {isEdit ? "Lưu thay đổi" : "Thêm món"}
                </button>
            </div>
        </Modal>
    );
}

/* -------- Helpers -------- */
function dataURLtoBlob(dataUrl: string): Blob {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
