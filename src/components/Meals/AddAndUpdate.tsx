// src/components/Meals/AddAndUpdate.tsx
import React, { useRef, useId } from "react";
import { Apple } from "lucide-react";
import type { Meal, MealSlot } from "../../types/meals";
import { createMeal, updateMeal } from "../../service/meals.service";

/** ---- UI nhỏ gọn (đã thêm id/htmlFor/title để a11y) ---- */
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
            type="button"
            title={String(children)}
        >
            {children}
        </button>
    );
}

function Label({
    children,
    required = false,
    htmlFor,
}: {
    children: React.ReactNode;
    required?: boolean;
    htmlFor?: string;
}) {
    return (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );
}

function TextInput({
    value, onChange, placeholder, type = "text", id, title,
}: {
    value: string | number | undefined;
    onChange: (v: string | number | undefined) => void;
    placeholder?: string;
    type?: React.HTMLInputTypeAttribute;
    id?: string;
    title?: string;
}) {
    return (
        <input
            id={id}
            title={title || placeholder || "input"}
            value={value ?? ""}
            onChange={(e) =>
                onChange(
                    type === "number"
                        ? e.target.value === "" ? undefined : Number(e.target.value)
                        : e.target.value
                )
            }
            placeholder={placeholder ?? ""}
            type={type}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
        />
    );
}

function Select({
    value, onChange, options, placeholder, id, title,
}: {
    value?: string;
    onChange: (v?: string) => void;
    options: string[];
    placeholder?: string;
    id?: string;
    title?: string;
}) {
    return (
        <select
            id={id}
            title={title || placeholder || "select"}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-green-100"
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

function ImagePicker({
    value,
    onPicked,
    onClear,
    inputId,
}: {
    value?: string;
    onPicked: (dataUrl: string) => void;
    onClear?: () => void;
    inputId?: string;
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
                            title="Đổi ảnh"
                        >
                            Đổi ảnh…
                        </button>
                        {onClear && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                title="Xoá ảnh"
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
                    title="Chọn tệp"
                >
                    Chọn tệp…
                </button>
            )}
            <input
                ref={ref}
                id={inputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handle}
            />
            {!value && <div className="text-xs text-slate-500">Chọn ảnh từ máy của bạn (JPEG/PNG…)</div>}
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
function NumberInput({
    value, onChange, id, title, placeholder, suffix,
}: {
    value?: number;
    onChange: (n?: number) => void;
    id?: string;
    title?: string;
    placeholder?: string;
    suffix?: string; // "kcal" | "g" | "mg" | "phút" | undefined
}) {
    return (
        <div className="relative">
            <input
                id={id}
                title={title || placeholder || "number"}
                value={value ?? ""}
                onChange={(e) => {
                    const v = e.target.value;
                    onChange(v === "" ? undefined : Number(v));
                }}
                placeholder={placeholder ?? ""}
                inputMode="decimal"
                type="number"
                className="w-full h-11 pr-12 pl-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
            />
            {suffix && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {suffix}
                </span>
            )}
        </div>
    );
}
function MealForm({ draft, setDraft }: { draft: Meal; setDraft: (m: Meal) => void }) {
    const nameId = useId();
    const imgId = useId();
    const descId = useId();
    const servingSizeId = useId();
    const servingUnitId = useId();
    const unitWeightId = useId();

    return (
        <div className="space-y-6">
            {/* Hàng 1: Tên (7) – Ảnh (5) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-7 space-y-2">
                    <Label htmlFor={nameId} required>Tên món ăn</Label>
                    <TextInput
                        id={nameId}
                        title="Tên món ăn"
                        value={draft.name}
                        onChange={(v) => setDraft({ ...draft, name: String(v ?? "") })}
                        placeholder="Ví dụ: Cơm tấm sườn"
                    />
                </div>

                <div className="xl:col-span-5 space-y-2">
                    <Label htmlFor={imgId}>Ảnh</Label>
                    <ImagePicker
                        inputId={imgId}
                        value={draft.image}
                        onPicked={(dataUrl) => setDraft({ ...draft, image: dataUrl })}
                        onClear={() => setDraft({ ...draft, image: "" })}
                    />
                </div>
            </div>

            {/* Hàng 2: Mô tả (12) */}
            <div className="space-y-2">
                <Label htmlFor={descId}>Mô tả</Label>
                <textarea
                    id={descId}
                    title="Mô tả"
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn về món ăn..."
                    className="w-full min-h-[88px] px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                />
            </div>

            {/* Hàng 3: Khẩu phần – Đơn vị – Trọng lượng 1 đơn vị */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label htmlFor={servingSizeId}>Khẩu phần</Label>
                    <NumberInput
                        id={servingSizeId}
                        title="Khẩu phần"
                        value={draft.servingSize}
                        onChange={(v) => setDraft({ ...draft, servingSize: v })}
                        placeholder="1"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={servingUnitId}>Đơn vị khẩu phần</Label>
                    <Select
                        id={servingUnitId}
                        title="Đơn vị khẩu phần"
                        value={draft.servingUnit}
                        onChange={(v) => setDraft({ ...draft, servingUnit: v })}
                        placeholder="Chọn đơn vị"
                        options={["tô", "chén", "ly", "đĩa", "phần", "cốc", "cái", "miếng"]}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={unitWeightId}>Trọng lượng 1 đơn vị</Label>
                    <NumberInput
                        id={unitWeightId}
                        title="Trọng lượng 1 đơn vị"
                        value={draft.unitWeightGram}
                        onChange={(v) => setDraft({ ...draft, unitWeightGram: v })}
                        placeholder="gram"
                        suffix="g"
                    />
                </div>
            </div>

            {/* Hàng 4: Thời gian – Calo – Protein */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label>Thời gian nấu</Label>
                    <NumberInput
                        value={draft.cookTimeMin}
                        onChange={(v) => setDraft({ ...draft, cookTimeMin: v })}
                        placeholder=""
                        suffix="phút"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Calo</Label>
                    <NumberInput
                        value={draft.calories}
                        onChange={(v) => setDraft({ ...draft, calories: v })}
                        placeholder=""
                        suffix="kcal"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Protein</Label>
                    <NumberInput
                        value={draft.proteinG}
                        onChange={(v) => setDraft({ ...draft, proteinG: v })}
                        placeholder=""
                        suffix="g"
                    />
                </div>
            </div>

            {/* Hàng 5: Carb – Fat – Fiber */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label>Carb</Label>
                    <NumberInput
                        value={draft.carbG}
                        onChange={(v) => setDraft({ ...draft, carbG: v })}
                        suffix="g"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fat</Label>
                    <NumberInput
                        value={draft.fatG}
                        onChange={(v) => setDraft({ ...draft, fatG: v })}
                        suffix="g"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fiber</Label>
                    <NumberInput
                        value={draft.fiberG}
                        onChange={(v) => setDraft({ ...draft, fiberG: v })}
                        suffix="g"
                    />
                </div>
            </div>

            {/* Hàng 6: Sodium – Sugar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label>Sodium</Label>
                    <NumberInput
                        value={draft.sodiumMg}
                        onChange={(v) => setDraft({ ...draft, sodiumMg: v })}
                        suffix="mg"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sugar</Label>
                    <NumberInput
                        value={draft.sugarMg}
                        onChange={(v) => setDraft({ ...draft, sugarMg: v })}
                        suffix="mg"
                    />
                </div>
            </div>

            {/* Hàng 7: Bữa ăn */}
            <div className="space-y-2">
                <Label>Bữa ăn (chọn nhiều)</Label>
                <div className="flex flex-wrap gap-2">
                    {(["Bữa sáng", "Bữa trưa", "Bữa chiều", "Bữa phụ"] as MealSlot[]).map((s) => (
                        <PillToggle
                            key={s}
                            active={draft.slots.includes(s)}
                            onClick={() => {
                                const has = draft.slots.includes(s);
                                const next = has ? draft.slots.filter((x) => x !== s) : [...draft.slots, s];
                                setDraft({ ...draft, slots: next });
                            }}
                        >
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
    const handleSave = async () => {
        if (!draft.name?.trim()) {
            alert("Vui lòng nhập Tên món ăn");
            return;
        }
        try {
            const result = isEdit && draft.id
                ? await updateMeal(draft.id, draft)
                : await createMeal(draft);

            onSave(result);
            onClose();
        } catch (e) {
            const msg = (e as { message?: string })?.message || (isEdit ? "Cập nhật món thất bại" : "Tạo món thất bại");
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
