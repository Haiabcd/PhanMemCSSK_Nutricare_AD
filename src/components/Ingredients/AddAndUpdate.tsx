import React, { useRef } from "react";
import axios from "axios";
import { Leaf } from "lucide-react";

/* ================= Axios ================= */
const API_BASE = "http://localhost:8080";
const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

/* ========== UI bits (y như bạn đang dùng) ========== */
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
            {!value && <div className="text-xs text-slate-500">Chọn ảnh từ máy của bạn (JPEG/PNG…)</div>}
        </div>
    );
}
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
                            <Leaf size={18} />
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

/* ===== Types ===== */
export type IngredientDraft = {
    id: string;
    name: string;
    description?: string;
    image?: string; // dataURL hoặc URL từ BE
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

/* ===== Form ===== */
function IngredientForm({ draft, setDraft }: { draft: IngredientDraft; setDraft: (v: IngredientDraft) => void }) {
    return (
        <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label required>Tên nguyên liệu</Label>
                    <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Ví dụ: Ức gà" />
                </div>
                <div className="space-y-2">
                    <Label>Ảnh</Label>
                    <ImagePicker
                        value={draft.image}
                        onPicked={(dataUrl) => setDraft({ ...draft, image: dataUrl })}
                        onClear={() => setDraft({ ...draft, image: "" })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Mô tả</Label>
                <textarea
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn về nguyên liệu..."
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
                    <Select
                        value={draft.servingUnit}
                        onChange={(v) => setDraft({ ...draft, servingUnit: v })}
                        placeholder="Chọn đơn vị"
                        options={["tô", "chén", "ly", "đĩa", "phần", "cốc", "cái", "miếng", "G", "ML"]}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Trọng lượng 1 đơn vị</Label>
                    <div className="relative">
                        <TextInput
                            type="number"
                            value={draft.unitWeightGram}
                            onChange={(v) => setDraft({ ...draft, unitWeightGram: v })}
                            placeholder="gram"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">g</span>
                    </div>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
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
        </div>
    );
}

/* ===== Component chính ===== */
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
    draft: IngredientDraft;
    setDraft: (v: IngredientDraft) => void;
    onClose: () => void;
    onSave: (createdOrUpdated: IngredientDraft) => void;
}) {
    const handleSave = async () => {
        if (!draft.name?.trim()) return alert("Vui lòng nhập Tên nguyên liệu");

        // === multipart/form-data theo đúng BE ===
        const fd = new FormData();
        const unit = (draft.servingUnit || "G").toUpperCase(); // Enum bắt buộc (G/ML)

        fd.append("name", draft.name.trim());
        fd.append("unit", unit);

        if (draft.description) fd.append("description", draft.description);
        if (draft.servingUnit) fd.append("servingName", draft.servingUnit);

        // Số 0 vẫn phải gửi
        safeAppend(fd, "servingSizeGram", draft.unitWeightGram, 0);
        safeAppend(fd, "defaultServing", draft.servingSize, 1);
        safeAppend(fd, "cookMinutes", draft.cookTimeMin, 0);

        // per100.*
        safeAppend(fd, "per100.kcal", draft.calories, 0);
        safeAppend(fd, "per100.proteinG", draft.proteinG, 0);
        safeAppend(fd, "per100.carbG", draft.carbG, 0);
        safeAppend(fd, "per100.fatG", draft.fatG, 0);
        safeAppend(fd, "per100.fiberG", draft.fiberG, 0);
        safeAppend(fd, "per100.sodiumMg", draft.sodiumMg, 0);
        safeAppend(fd, "per100.sugarMg", draft.sugarMg, 0);

        // Ảnh: nếu UI đang giữ dataURL thì chuyển sang File rồi append; nếu là URL BE cũ thì bỏ qua
        if (draft.image && draft.image.startsWith("data:")) {
            try {
                const file = await dataURLtoFile(draft.image, "ingredient.jpg");
                fd.append("image", file, file.name);
            } catch (err) {
                console.warn("Không convert được ảnh dataURL:", err);
            }
        }

        try {
            const url =
                isEdit && draft.id ? `/ingredients/${draft.id}` : `/ingredients/save`;
            const method: "post" | "patch" = isEdit && draft.id ? "patch" : "post";

            const res = await api.request({
                url,
                method,
                data: fd, // axios tự set boundary
            });

            // response mẫu đã cung cấp trong đề
            const be = res.data?.data ?? res.data ?? {};

            const mapped: IngredientDraft = {
                id: String(be.id ?? draft.id ?? Math.random().toString(36).slice(2)),
                name: be.name ?? draft.name,
                description: be.description ?? draft.description,
                image: be.imageUrl ?? draft.image,
                servingSize: be.defaultServing ?? draft.servingSize,
                servingUnit: be.servingName ?? be.unit ?? draft.servingUnit,
                unitWeightGram: be.servingSizeGram ?? be.servingGram ?? draft.unitWeightGram,
                cookTimeMin: be.cookMinutes ?? draft.cookTimeMin,
                calories: be.per100?.kcal ?? draft.calories,
                proteinG: be.per100?.proteinG ?? draft.proteinG,
                carbG: be.per100?.carbG ?? draft.carbG,
                fatG: be.per100?.fatG ?? draft.fatG,
                fiberG: be.per100?.fiberG ?? draft.fiberG,
                sodiumMg: be.per100?.sodiumMg ?? draft.sodiumMg,
                sugarMg: be.per100?.sugarMg ?? draft.sugarMg,
                tags: be.tags ?? draft.tags,
                aliases: be.aliases ?? draft.aliases,
            };

            onSave(mapped);
            onClose();
        } catch (e: any) {
            const status = e?.response?.status;
            const body = e?.response?.data;
            alert(status ? `HTTP ${status}: ${body?.message || body?.error || "Dữ liệu không hợp lệ"}` : e?.message);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu"}>
            <IngredientForm draft={draft} setDraft={setDraft} />
            <div className="mt-5 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-xl border border-slate-200" onClick={onClose}>
                    Huỷ
                </button>
                <button className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={handleSave}>
                    {isEdit ? "Lưu thay đổi" : "Thêm nguyên liệu"}
                </button>
            </div>
        </Modal>
    );
}

/* -------- Helpers -------- */
function safeAppend(fd: FormData, key: string, v?: number, fallbackIfUndefined: number = 0) {
    // gửi cả số 0 (0 là hợp lệ). Nếu undefined/null => gửi fallback.
    const val = v !== undefined && v !== null ? v : fallbackIfUndefined;
    fd.append(key, String(val));
}
async function dataURLtoFile(dataUrl: string, filename: string): Promise<File> {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}
