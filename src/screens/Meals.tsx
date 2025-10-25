import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
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

/* =======================
 * [API] Kiểu dữ liệu từ BE
 * ======================= */
type FoodBE = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    servingName: string | null;
    servingGram: number | null;
    defaultServing: number | null;
    cookMinutes: number | null;
    nutrition: {
        kcal: number | null;
        proteinG: number | null;
        carbG: number | null;
        fatG: number | null;
        fiberG: number | null;
        sodiumMg: number | null;
        sugarMg: number | null;
    };
    mealSlots: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[];
};

type PageBE<T> = {
    content: T[];
    pageable: { pageNumber: number; pageSize: number };
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    empty: boolean;
};

type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
};

/* =======================
 * [API] Cấu hình & helpers
 * ======================= */
const BASE_URL = "http://localhost:8080";

const mapSlot = (s: FoodBE["mealSlots"][number]): MealSlot => {
    switch (s) {
        case "BREAKFAST":
            return "Bữa sáng";
        case "LUNCH":
            return "Bữa trưa";
        case "DINNER":
            return "Bữa chiều"; // theo UI hiện tại
        case "SNACK":
        default:
            return "Bữa phụ";
    }
};

const mapFoodToMeal = (f: FoodBE): Meal => ({
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    image: f.imageUrl ?? undefined,
    servingSize: f.defaultServing ?? undefined,
    servingUnit: f.servingName ?? undefined,
    unitWeightGram: f.servingGram ?? undefined,
    cookTimeMin: f.cookMinutes ?? undefined,
    calories: f.nutrition?.kcal ?? undefined,
    proteinG: f.nutrition?.proteinG ?? undefined,
    carbG: f.nutrition?.carbG ?? undefined,
    fatG: f.nutrition?.fatG ?? undefined,
    fiberG: f.nutrition?.fiberG ?? undefined,
    sodiumMg: f.nutrition?.sodiumMg ?? undefined,
    sugarMg: f.nutrition?.sugarMg ?? undefined,
    slots: (f.mealSlots || []).map(mapSlot),
});

async function fetchFoodsPage(page: number, size: number): Promise<{
    meals: Meal[];
    last: boolean;
    number: number;
}> {
    const url =
        `${BASE_URL}/foods/all` +
        `?page=${page}&size=${size}&sort=createdAt,desc&sort=id,desc`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as ApiResponse<PageBE<FoodBE>>;
    const bePage = json.data;

    return {
        meals: bePage.content.map(mapFoodToMeal),
        last: bePage.last,
        number: bePage.number,
    };
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

    /* =======================
     * [API] Trạng thái load
     * ======================= */
    const [page, setPage] = useState(0);
    const [size] = useState(12); // đổi 2 để test giống response mẫu
    const [isLoading, setIsLoading] = useState(false);
    const [isLast, setIsLast] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPage = useCallback(
        async (p: number, append = true) => {
            try {
                setIsLoading(true);
                setError(null);
                const { meals: newMeals, last } = await fetchFoodsPage(p, size);
                setIsLast(last);
                setMeals((prev) => (append ? [...prev, ...newMeals] : newMeals));
            } catch (e: any) {
                setError(e?.message ?? "Lỗi tải dữ liệu");
            } finally {
                setIsLoading(false);
            }
        },
        [setMeals, size]
    );

    // Lần đầu vào: load trang 0, replace dữ liệu cũ
    useEffect(() => {
        setMeals([]); // clear trước khi load mới
        setPage(0);
        loadPage(0, /* append */ false);
    }, [loadPage, setMeals]);

    // ====== Auto load khi chạm cuối trang (IntersectionObserver) ======
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.some((e) => e.isIntersecting);
                // Chỉ auto load khi không tìm kiếm để tránh gọi trang mới lúc đang filter
                if (visible && !isLoading && !isLast && !query) {
                    const next = page + 1;
                    setPage(next);
                    loadPage(next, /* append */ true);
                }
            },
            {
                root: null,
                threshold: 0.1,
                rootMargin: "200px", // prefetch sớm khi gần chạm đáy
            }
        );

        io.observe(el);
        return () => {
            io.unobserve(el);
            io.disconnect();
        };
    }, [isLoading, isLast, query, page, loadPage]);

    const refresh = () => {
        if (isLoading) return;
        setMeals([]);
        setPage(0);
        setIsLast(false);
        loadPage(0, /* append */ false);
    };

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

    // Lưu local; nếu có API POST/PUT thì gọi API rồi refresh()
    const saveDraft = () => {
        if (!draft.name.trim()) return alert("Vui lòng nhập Tên món ăn");
        if (!draft.servingUnit) draft.servingUnit = "tô";
        setMeals((prev) =>
            isEdit ? prev.map((x) => (x.id === draft.id ? { ...draft } : x)) : [{ ...draft, id: uid() }, ...prev]
        );
        setOpenModal(false);
    };

    // Xoá local; nếu có API DELETE `/foods/{id}` thì gọi rồi refresh()
    const askDelete = (id: string) => {
        setToDelete(id);
        setConfirmOpen(true);
    };
    const doDelete = async () => {
        try {
            // await fetch(`${BASE_URL}/foods/${toDelete}`, { method: "DELETE" });
            if (toDelete) setMeals((prev) => prev.filter((x) => x.id !== toDelete));
        } catch (e: any) {
            alert(e?.message ?? "Xoá thất bại");
        } finally {
            setConfirmOpen(false);
            setToDelete(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header actions */}
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50"
                        title="Làm mới từ server"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full" />
                        ) : null}
                        <span>Làm mới</span>
                    </button>

                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3.5 py-2.5 hover:bg-green-700 shadow"
                    >
                        <Plus size={18} /> Thêm món mới
                    </button>
                </div>
            </div>

            {/* Error */}
            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
                    Lỗi tải dữ liệu: {error}
                </div>
            ) : null}

            {/* Grid cards */}
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

            {/* Sentinel cho auto-load + trạng thái */}
            <div ref={loadMoreRef} className="h-8" />

            <div className="flex items-center justify-center py-4">
                {isLoading ? (
                    <div className="inline-flex items-center gap-2 text-slate-500">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full" />
                        Đang tải...
                    </div>
                ) : isLast ? (
                    <div className="text-slate-400 text-sm">Đã hết dữ liệu</div>
                ) : (
                    <div className="text-slate-400 text-sm">Kéo xuống để tải thêm…</div>
                )}
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
