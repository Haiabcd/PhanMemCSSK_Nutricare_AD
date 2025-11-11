import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Pencil, Trash2, Search, Leaf, SearchX } from "lucide-react";
import AddAndUpdate from "../components/Ingredients/AddAndUpdate";
import type { IngredientResponse, Ingredient } from "../types/ingredients";
import type { IngredientManageResponse } from "../types/overview";
import {
  fetchIngredientsOverview,
  fetchIngredientsPage,
  autocompleteIngredients,
  deleteIngredient,
} from "../service/ingredients.service";
/* ======================= helpers ======================= */
function cryptoRandomId(): string {
  try {
    const u32 = new Uint32Array(1);
    (globalThis.crypto as Crypto).getRandomValues(u32);
    return u32[0].toString(36);
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

type AnyItem = IngredientResponse | Ingredient;

function getId(it: AnyItem): string {
  return (it as any).id ? String((it as any).id) : cryptoRandomId();
}
function getName(it: AnyItem): string {
  return (it as any).name ?? "";
}
function getImageUrl(it: AnyItem): string | undefined {
  // IngredientResponse.imageUrl | Ingredient.image
  return (it as any).imageUrl ?? (it as any).image ?? undefined;
}
function getServingUnit(it: AnyItem): string | undefined {
  // IngredientResponse.unit | Ingredient.servingUnit
  return (it as any).unit ?? (it as any).servingUnit ?? undefined;
}
function getKcalPer100(it: AnyItem): number | undefined {
  // IngredientResponse.per100?.kcal | Ingredient.kcalPer100g | Ingredient.calories
  const fromPer100 = (it as any).per100?.kcal;
  if (typeof fromPer100 === "number") return fromPer100;
  const k100 = (it as any).kcalPer100g;
  if (typeof k100 === "number") return k100;
  const cal = (it as any).calories;
  if (typeof cal === "number") return cal;
  return undefined;
}

/* ======================= UI Bits ======================= */
function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-green-50 text-green-600 border border-green-100">
          {icon}
        </div>
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={isBusy ? undefined : onCancel}
      />
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

/* ======================= Page ======================= */
const ZERO_STATS: IngredientManageResponse = {
  countIngredients: 0,
  countNewIngredientsThisWeek: 0,
};

export default function Ingredients() {
  // ===== Stats =====
  const [stats, setStats] = useState(ZERO_STATS);

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchIngredientsOverview();
      setStats(s);
    } catch (e: unknown) {
      console.error("Stats load error:", e);
      setStats(ZERO_STATS);
    }
  }, []);

  // ===== List (paging + search) =====
  const [items, setItems] = useState<IngredientResponse[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AnyItem[]>([]);

  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) =>
      [getName(m), getServingUnit(m)]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [query, items]);

  const loadPage = useCallback(async (p: number, append = true) => {
    try {
      setIsLoading(true);

      const { items: newItems, last } = await fetchIngredientsPage(p, 12);
      setIsLast(last);
      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
    } catch (e: unknown) {
      console.error("Page load error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // first load
    setItems([]);
    setPage(0);
    setIsLast(false);
    loadPage(0, false);
    loadStats();
  }, [loadPage, loadStats]);

  // Server-side search with debounce
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearching(false);
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const list = await autocompleteIngredients(q, 20, controller.signal);
        setSearchResults(list as AnyItem[]);
      } catch (e: unknown) {
        console.error("Search error:", e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const refresh = () => {
    if (isLoading) return;
    setQuery("");
    setSearchResults([]);
    setSearching(false);

    setItems([]);
    setPage(0);
    setIsLast(false);
    loadPage(0, false);
    loadStats();
  };

  // infinite load (only when not searching)
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

  // ===== Add/Edit modal state =====
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AnyItem | null>(null);

  const openAdd = () => {
    setSelectedItem(null);
    setIsEdit(false);
    setOpenModal(true);
  };
  const openEdit = (item: AnyItem) => {
    setSelectedItem(item);
    setIsEdit(true);
    setOpenModal(true);
  };

  // delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const askDelete = (id: string) => {
    setToDelete(id);
    setConfirmOpen(true);
  };
  const doDelete = async () => {
    if (!toDelete) return;
    try {
      setIsDeleting(true);
      await deleteIngredient(toDelete);
      // Xoá local, hoặc có thể gọi refresh()
      setItems((prev) => prev.filter((x) => getId(x) !== toDelete));
    } catch (e: unknown) {
      console.error("Delete error:", e);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const listToRender: AnyItem[] = query.trim()
    ? (searchResults as AnyItem[])
    : (filteredLocal as AnyItem[]);

  return (
    <div className="space-y-4">
      {/* ===== Stats ===== */}
      <div>
        <h1 className="text-2xl font-semibold">Quản lý nguyên liệu</h1>
        <p className="text-slate-500 text-sm">
          Nguyên liệu dùng để cấu thành món ăn và tính macro dinh dưỡng.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <StatCard
          icon={<Leaf />}
          title="Nguyên liệu mới trong tuần"
          value={stats.countNewIngredientsThisWeek}
        />
        <StatCard
          icon={<Leaf />}
          title="Tổng nguyên liệu"
          value={stats.countIngredients}
        />
      </div>

      {/* ===== List header ===== */}
      <h2 className="text-2xl font-semibold">Danh sách nguyên liệu</h2>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
            placeholder="Tìm nguyên liệu theo tên..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {searching ? "Đang tìm…" : `${listToRender.length} kết quả`}
            </div>
          )}
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
            <Plus size={18} /> Thêm nguyên liệu
          </button>
        </div>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listToRender.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-3 text-slate-500 py-10">
            <SearchX size={42} className="text-slate-400" />
            <p className="text-base">Không tìm thấy nguyên liệu nào</p>
            <p className="text-sm text-slate-400">Hãy thử từ khóa khác nhé!</p>
          </div>
        ) : (
          listToRender.map((it) => {
            const id = getId(it);
            const name = getName(it);
            const img = getImageUrl(it);
            const unit = getServingUnit(it);
            const kcal100 = getKcalPer100(it);

            return (
              <div
                key={id}
                className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col"
              >
                {img ? (
                  <img
                    src={img}
                    alt={name}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 w-full grid place-items-center bg-slate-100 text-slate-400">
                    No image
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div
                    className="text-base font-semibold text-slate-900 line-clamp-2"
                    title={name}
                  >
                    {name}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {unit && <Badge>Đơn vị: {unit}</Badge>}
                    {typeof kcal100 === "number" && (
                      <Badge>{kcal100} kcal/100g</Badge>
                    )}
                  </div>

                  <div className="mt-auto pt-3 flex items-center justify-end gap-2">
                    <button
                      className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => openEdit(it)}
                    >
                      <Pencil size={16} />
                      <span className="text-sm">Chỉnh sửa</span>
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
                      onClick={() => askDelete(id)}
                    >
                      <Trash2 size={16} />
                      <span className="text-sm">Xoá</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* sentinel */}
      <div ref={loadMoreRef} className="h-8" />
      {!query && (
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
      )}

      {/* Add/Edit modal */}
      <AddAndUpdate
        open={openModal}
        isEdit={isEdit}
        initialItem={selectedItem}
        onClose={() => setOpenModal(false)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xoá"
        description="Bạn có chắc muốn xóa nguyên liệu này không?"
        onConfirm={doDelete}
        onCancel={() => !isDeleting && setConfirmOpen(false)}
        isBusy={isDeleting}
      />
    </div>
  );
}
