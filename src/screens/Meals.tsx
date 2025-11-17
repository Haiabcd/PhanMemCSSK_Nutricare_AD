import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Apple,
  BarChart3,
  UtensilsCrossed,
  SearchX,
} from "lucide-react";
import AddAndUpdate from "../components/Meals/AddAndUpdate";
import "../css/Meals.css";
import {
  fetchFoodsPage,
  autocompleteFoods,
  deleteFood,
} from "../service/meals.service";
import { fetchMealsOverview } from "../service/overview.service";
import type { FoodResponse } from "../types/meals";

/* ======================= Small UI atoms ======================= */
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

/** ------- Card / StatCard / MiniDonutChart ------- */
function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm ${
        className ?? ""
      }`}
    >
      <div className="flex items-baseline justify-between">
        <div className="font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
function StatCard({
  icon,
  title,
  value,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  hint?: string;
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
      {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
function MiniDonutChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const rawTotal = items.reduce((s, i) => s + i.value, 0);
  const denom = rawTotal === 0 ? 1 : rawTotal;
  const radius = 70,
    stroke = 26,
    size = 180;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-bg"
          strokeWidth={stroke}
        />
        {rawTotal > 0 &&
          items.map((it, idx) => {
            const frac = it.value / denom;
            const dash = 2 * Math.PI * radius * frac;
            const gap = 2 * Math.PI * radius - dash;
            const rot = (acc / denom) * 360;
            acc += it.value;
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={`stroke-swatch-${idx % 6}`}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rot} ${
                  size / 2
                } ${size / 2})`}
                strokeLinecap="butt"
              />
            );
          })}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-700 text-sm"
        >
          {rawTotal}
        </text>
      </svg>
      <div className="text-sm space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-sm swatch-${i % 6}`}
            />
            <span className="text-slate-600">{it.label}</span>
            <span className="ml-auto font-medium">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================= COMPONENT ======================= */
const ZERO_STATS = {
  newMealsThisWeek: 0,
  totalFoods: 0,
  manual: 0,
  scan: 0,
  plan: 0,
  top10: [] as { name: string; count: number }[],
};

export default function Meals({
  meals,
  setMeals,
}: {
  meals: FoodResponse[];
  setMeals: React.Dispatch<React.SetStateAction<FoodResponse[]>>;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodResponse[]>([]);

  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) =>
      [
        m.name,
        m.description,
        m.servingName,
        (m.mealSlots || []).join(" "),
        (m.tags || []).map((t) => t.nameCode).join(" "),
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [query, meals]);

  const [draft, setDraft] = useState<FoodResponse>({
    id: "",
    name: "",
    description: "",
    imageUrl: "",
    defaultServing: 1,
    servingName: "tô",
    servingGram: 0,
    cookMinutes: 0,
    nutrition: {
      kcal: 0,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      fiberG: 0,
      sodiumMg: 0,
      sugarMg: 0,
    },
    mealSlots: [],
    tags: [],
    ingredients: [],
  });
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [stats, setStats] = useState(ZERO_STATS);
  const loadStats = useCallback(async () => {
    try {
      const s = await fetchMealsOverview();
      setStats({
        newMealsThisWeek: s.countNewFoodsInLastWeek ?? 0,
        totalFoods: s.totalFoods ?? 0,
        manual: s.countLogsFromManualSource ?? 0,
        scan: s.countLogsFromScanSource ?? 0,
        plan: s.countLogsFromPlanSource ?? 0,
        top10: Array.isArray(s.getTop10FoodsFromPlan)
          ? s.getTop10FoodsFromPlan.map((x) => ({
              name: x.name,
              count: x.count,
            }))
          : [],
      });
    } catch (e: unknown) {
      console.error("Stats load error:", e);
      setStats(ZERO_STATS);
    }
  }, []);

  const loadPage = useCallback(
    async (p: number, append = true) => {
      try {
        setIsLoading(true);
        const { items, last } = await fetchFoodsPage(p, 12);
        setIsLast(last);
        setMeals((prev) => (append ? [...prev, ...items] : items));
      } catch (e: unknown) {
        console.error("Load foods page error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [setMeals]
  );
  const reqIdRef = useRef(0);

  useEffect(() => {
    setMeals([]);
    setPage(0);
    loadPage(0, false);
    loadStats();
  }, [loadPage, setMeals, loadStats]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearching(false);
      setSearchResults([]);
      return;
    }

    const myReqId = ++reqIdRef.current;
    setSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const items = await autocompleteFoods(q, 10, controller.signal);
        if (reqIdRef.current === myReqId) {
          setSearchResults(items);
        }
      } catch (e: any) {
        const isAbort =
          e?.name === "AbortError" ||
          e?.code === "ERR_CANCELED" ||
          e?.message?.toLowerCase?.().includes("canceled") ||
          e?.__CANCEL__ === true;

        if (!isAbort) {
          console.error("Search error:", e);
          if (reqIdRef.current === myReqId) setSearchResults([]);
        }
      } finally {
        if (reqIdRef.current === myReqId) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

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
    setQuery("");
    setSearchResults([]);
    setSearching(false);
    setMeals([]);
    setPage(0);
    setIsLast(false);
    loadPage(0, false);
    loadStats();
  };

  const openAdd = () => {
    setDraft({
      id: "",
      name: "",
      description: "",
      imageUrl: "",
      defaultServing: 1,
      servingName: "tô",
      servingGram: 0,
      cookMinutes: 0,
      nutrition: {
        kcal: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        fiberG: 0,
        sodiumMg: 0,
        sugarMg: 0,
      },
      mealSlots: [],
      tags: [],
      ingredients: [],
    });
    setIsEdit(false);
    setOpenModal(true);
  };

  const openEdit = (m: FoodResponse) => {
    setDraft(m);
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
      refresh();
    } catch (e: unknown) {
      console.error("Delete food failed:", e);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const listToRender = query.trim() ? searchResults : filteredLocal;

  const beToVnSlot = (s: string) => {
    switch (s) {
      case "BREAKFAST":
        return "Bữa sáng";
      case "LUNCH":
        return "Bữa trưa";
      case "DINNER":
        return "Bữa chiều";
      case "SNACK":
        return "Bữa phụ";
      default:
        return s;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý món ăn</h1>
        <p className="text-slate-500 text-sm">
          Dữ liệu món ăn được lưu trữ trong hệ thống và có thể được sử dụng khi
          tạo kế hoạch dinh dưỡng cho người dùng.
        </p>
      </div>

      {/* Thống kê */}
      <div className="space-y-5 mt-8">
        <h1 className="text-2xl font-semibold">Thống kê món ăn</h1>

        <div className="grid sm:grid-cols-3 xl:grid-cols-3 gap-5">
          <StatCard
            icon={<UtensilsCrossed />}
            title="Món mới trong tuần"
            value={stats.newMealsThisWeek}
          />
          <StatCard
            icon={<Apple />}
            title="Tổng số món"
            value={stats.totalFoods}
          />
          <StatCard
            icon={<BarChart3 />}
            title="Nguồn món (kế hoạch)"
            value={`${stats.plan} món ăn`}
          />
        </div>
        <div className="grid xl:grid-cols-2 gap-5">
          <Card
            title="Nguồn món người dùng nhập"
            subtitle="Phân tách theo cách tạo"
          >
            <MiniDonutChart
              items={[
                { label: "Nhập thủ công", value: stats.manual },
                { label: "Scan AI", value: stats.scan },
              ]}
            />
          </Card>
          <Card
            title="Top 10 món được log nhiều nhất (kế hoạch)"
            subtitle="Theo số lượt log"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr className="text-left">
                    <th className="py-2 pr-2 w-10">#</th>
                    <th className="py-2 pr-2">Tên món</th>
                    <th className="py-2 pr-2 text-right">Lượt log</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top10.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 text-center text-slate-400"
                      >
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    stats.top10.map((x, i) => (
                      <tr
                        key={`${x.name}-${i}`}
                        className="border-t border-slate-100"
                      >
                        <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                        <td className="py-2 pr-2 font-medium text-slate-900">
                          {x.name}
                        </td>
                        <td className="py-2 pr-2 text-right font-semibold">
                          {x.count.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <h1 className="text-2xl font-semibold">Danh sách món ăn</h1>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
            placeholder="Tìm món theo tên..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {searching ? "Đang tìm…" : `${listToRender?.length ?? 0} kết quả`}
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
            <Plus size={18} /> Thêm món mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listToRender.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-3 text-slate-500 py-10">
            <SearchX size={42} className="text-slate-400" />
            <p className="text-base">Không tìm thấy món ăn nào</p>
            <p className="text-sm text-slate-400">Hãy thử từ khóa khác nhé!</p>
          </div>
        ) : (
          listToRender.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col"
            >
              {m.imageUrl ? (
                <img
                  src={m.imageUrl}
                  alt={m.name}
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
                  title={m.name}
                >
                  {m.name}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(m.mealSlots || []).map((s) => (
                    <Badge key={s}>{beToVnSlot(s)}</Badge>
                  ))}
                </div>

                <div className="mt-auto pt-3 flex items-center justify-end gap-2">
                  <button
                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil size={16} />
                    <span className="text-sm">Chỉnh sửa</span>
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
                    onClick={() => askDelete(m.id)}
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Xoá</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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

      <AddAndUpdate
        open={openModal}
        isEdit={isEdit}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setOpenModal(false)}
        onSave={() => {
          setOpenModal(false);
          refresh();
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
