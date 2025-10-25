import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AddAndUpdate from "../components/AddAndUpdate";
import axios from "axios";

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

/** ------- Badge ------- */
function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-slate-700 border-slate-200 bg-white">
            {children}
        </span>
    );
}

/** ------- ConfirmDialog ------- */
function ConfirmDialog({
    open,
    title,
    description,
    confirmText = "Xóa",
    cancelText = "Huỷ",
    onConfirm,
    onCancel,
    isBusy = false,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isBusy?: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={isBusy ? undefined : onCancel} />
            <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h4 className="text-base font-semibold">{title}</h4>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-slate-600">{description}</p>
                </div>
                <div className="px-5 py-4 flex items-center justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                        onClick={onCancel}
                        disabled={isBusy}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 inline-flex items-center gap-2"
                        onClick={onConfirm}
                        disabled={isBusy}
                    >
                        {isBusy && (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ======================= API ======================= */
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
    size: number;
    number: number;
    last: boolean;
};

type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
};

const BASE_URL = "http://localhost:8080";
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
});

function toAxiosMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const s = err.response?.status ?? "ERR";
        const d = err.response?.data as any;
        const msg =
            (typeof d === "string" && d) ||
            (d && typeof d.message === "string" && d.message) ||
            (d && typeof d.error === "string" && d.error) ||
            err.message;
        return `HTTP ${s}: ${msg}`;
    }
    return (err as any)?.message ?? "Lỗi không xác định";
}

const mapSlot = (s: FoodBE["mealSlots"][number]): MealSlot => {
    switch (s) {
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

async function fetchFoodsPage(page: number, size: number) {
    try {
        const url = `/foods/all?page=${page}&size=${size}&sort=createdAt,desc&sort=id,desc`;
        const res = await api.get(url);
        const be = res.data as ApiResponse<PageBE<FoodBE>>;
        const bePage = be.data;
        return {
            meals: bePage.content.map(mapFoodToMeal),
            last: bePage.last,
            number: bePage.number,
        };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

async function deleteFood(id: string) {
    try {
        await api.delete(`/foods/${id}`);
    } catch (err) {
        throw new Error(`Xoá thất bại: ${toAxiosMessage(err)}`);
    }
}

/* ======================= COMPONENT ======================= */
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

    const [draft, setDraft] = useState<Meal>({
        id: "",
        name: "",
        description: "",
        image: "",
        servingSize: 1,
        servingUnit: "tô",
        slots: [],
    });
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLast, setIsLast] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPage = useCallback(
        async (p: number, append = true) => {
            try {
                setIsLoading(true);
                setError(null);
                const { meals: newMeals, last } = await fetchFoodsPage(p, 12);
                setIsLast(last);
                setMeals((prev) => (append ? [...prev, ...newMeals] : newMeals));
            } catch (e: any) {
                setError(e?.message ?? "Lỗi tải dữ liệu");
            } finally {
                setIsLoading(false);
            }
        },
        [setMeals]
    );

    useEffect(() => {
        setMeals([]);
        setPage(0);
        loadPage(0, false);
    }, [loadPage, setMeals]);

    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.some((e) => e.isIntersecting);
                if (visible && !isLoading && !isLast && !query) {
                    const next = page + 1;
                    setPage(next);
                    loadPage(next, true);
                }
            },
            { root: null, threshold: 0.1, rootMargin: "200px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [isLoading, isLast, query, page, loadPage]);

    const refresh = () => {
        if (isLoading) return;
        // Xoá filter để không bị ẩn kết quả sau khi load lại
        setQuery("");

        // Reset phân trang + trạng thái
        setMeals([]);
        setPage(0);
        setIsLast(false);

        // Gọi lại trang đầu từ server
        loadPage(0, /* append */ false);
    };


    const openAdd = () => {
        setDraft({
            id: "",
            name: "",
            description: "",
            image: "",
            servingSize: 1,
            servingUnit: "tô",
            slots: [],
        });
        setIsEdit(false);
        setOpenModal(true);
    };
    const openEdit = (m: Meal) => {
        setDraft({ ...m });
        setIsEdit(true);
        setOpenModal(true);
    };

    const askDelete = (id: string) => {
        setToDelete(id);
        setConfirmOpen(true);
    };
    const doDelete = async () => {
        if (!toDelete) return;
        try {
            setIsDeleting(true);
            await deleteFood(toDelete);
            setMeals((prev) => prev.filter((x) => x.id !== toDelete));
        } catch (e: any) {
            alert(e?.message ?? "Xoá thất bại");
        } finally {
            setIsDeleting(false);
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
                        {isLoading && (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full" />
                        )}
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

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
                    Lỗi tải dữ liệu: {error}
                </div>
            )}

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
                onSave={(saved) => {
                    setMeals((prev) =>
                        isEdit
                            ? prev.map((x) => (x.id === saved.id ? saved : x)) // cập nhật tại chỗ
                            : [saved, ...prev]                                  // thêm mới lên đầu
                    );
                    setOpenModal(false); // đóng modal, không reload trang
                }}
            />


            <ConfirmDialog
                open={confirmOpen}
                title="Xác nhận xoá"
                description="Bạn có chắc muốn xóa không?"
                onConfirm={doDelete}
                onCancel={() => !isDeleting && setConfirmOpen(false)}
                isBusy={isDeleting}
            />
        </div>
    );
}
