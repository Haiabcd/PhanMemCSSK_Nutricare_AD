import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AddAndUpdate from "../components/AddAndUpdate";

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

                            <div className="flex flex-wrap gap-2">
                                {m.slots.map((s) => (
                                    <Badge key={s}>{s}</Badge>
                                ))}
                            </div>

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

            <AddAndUpdate
                open={openModal}
                isEdit={isEdit}
                draft={draft}
                setDraft={setDraft}
                onClose={() => setOpenModal(false)}
                onSave={saveDraft}
            />

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
