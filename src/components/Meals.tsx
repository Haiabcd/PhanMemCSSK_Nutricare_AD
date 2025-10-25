import React, { useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search, Apple } from "lucide-react";

/** ------- Types (tối giản, khớp với App) ------- */
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

const uid = () => Math.random().toString(36).slice(2);

/** ------- UI bits gọn cho trang Meals ------- */
function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-slate-700 border-slate-200 bg-white">
            {children}
        </span>
    );
}

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
            className={`px-3 py-1.5 rounded-full text-sm border transition ${active
                    ? "bg-green-600 text-white border-green-600 shadow"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
        >
            {children}
        </button>
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

function ConfirmDialog({
    open,
    title,
    description,
    confirmText = "Xóa",
    cancelText = "Huỷ",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h4 className="text-base font-semibold">{title}</h4>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-slate-600">{description}</p>
                </div>
                <div className="px-5 py-4 flex items-center justify-end gap-3">
                    <button className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
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
                        <button type="button" onClick={pick} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
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
                    <Select
                        value={draft.servingUnit}
                        onChange={(v) => setDraft({ ...draft, servingUnit: v })}
                        placeholder="Chọn đơn vị"
                        options={["tô", "chén", "ly", "đĩa", "phần", "cốc", "cái", "miếng"]}
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

/** ------- Meals (page) ------- */
export default function Meals({
    meals,
    setMeals,
}: {
    meals: Meal[];
    setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
}) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return meals;
        return meals.filter((m) =>
            [m.name, m.description, m.servingUnit, m.slots.join(" ")]
                .filter(Boolean)
                .some((s) => String(s).toLowerCase().includes(q))
        );
    }, [query, meals]);

    const emptyMeal: Meal = {
        id: "",
        name: "",
        description: "",
        image: "",
        servingSize: 1,
        servingUnit: "tô",
        unitWeightGram: undefined,
        cookTimeMin: undefined,
        calories: undefined,
        proteinG: undefined,
        carbG: undefined,
        fatG: undefined,
        fiberG: undefined,
        sodiumMg: undefined,
        sugarMg: undefined,
        slots: [],
    };
    const [draft, setDraft] = useState<Meal>(emptyMeal);
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<string | null>(null);

    const openAdd = () => {
        setDraft({ ...emptyMeal, id: "" });
        setIsEdit(false);
        setOpenModal(true);
    };
    const openEdit = (m: Meal) => {
        setDraft({ ...m });
        setIsEdit(true);
        setOpenModal(true);
    };
    const saveDraft = () => {
        if (!draft.name.trim()) return alert("Vui lòng nhập Tên món ăn");
        if (!draft.servingUnit) draft.servingUnit = "tô";
        setMeals((prev) =>
            isEdit ? prev.map((x) => (x.id === draft.id ? { ...draft } : x)) : [{ ...draft, id: uid() }, ...prev]
        );
        setOpenModal(false);
    };

    const askDelete = (id: string) => {
        setToDelete(id);
        setConfirmOpen(true);
    };
    const doDelete = () => {
        if (toDelete) setMeals((prev) => prev.filter((x) => x.id !== toDelete));
        setConfirmOpen(false);
        setToDelete(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                        placeholder="Tìm món theo tên, mô tả, đơn vị, bữa ăn..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <button
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3.5 py-2.5 hover:bg-green-700 shadow"
                >
                    <Plus size={18} /> Thêm món mới
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((m) => (
                    <div key={m.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
                        {m.image ? (
                            <img src={m.image} alt={m.name} className="h-40 w-full object-cover" />
                        ) : (
                            <div className="h-40 w-full grid place-items-center bg-slate-100 text-slate-400">No image</div>
                        )}

                        <div className="p-4 flex-1 flex flex-col gap-3">
                            <div className="text-base font-semibold text-slate-900 line-clamp-2" title={m.name}>
                                {m.name}
                            </div>

                            <div className="flex flex-wrap gap-2">{m.slots.map((s) => <Badge key={s}>{s}</Badge>)}</div>

                            <div className="mt-auto pt-3 flex items-center justify-end gap-2">
                                <button
                                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={() => openEdit(m)}
                                    title="Chỉnh sửa"
                                >
                                    <Pencil size={16} />
                                    <span className="text-sm">Chỉnh sửa</span>
                                </button>

                                <button
                                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
                                    onClick={() => askDelete(m.id)}
                                    title="Xoá"
                                >
                                    <Trash2 size={16} />
                                    <span className="text-sm">Xoá</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal open={openModal} onClose={() => setOpenModal(false)} title={isEdit ? "Cập nhật món ăn" : "Thêm món ăn"}>
                <MealForm draft={draft} setDraft={setDraft} />
                <div className="mt-5 flex items-center justify-end gap-3">
                    <button className="px-4 py-2 rounded-xl border border-slate-200" onClick={() => setOpenModal(false)}>
                        Huỷ
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={saveDraft}>
                        {isEdit ? "Lưu thay đổi" : "Thêm món"}
                    </button>
                </div>
            </Modal>

            <ConfirmDialog
                open={confirmOpen}
                title="Xác nhận xoá"
                description="Bạn có chắc muốn xóa không?"
                confirmText="Xóa"
                cancelText="Huỷ"
                onConfirm={doDelete}
                onCancel={() => {
                    setConfirmOpen(false);
                    setToDelete(null);
                }}
            />
        </div>
    );
}
