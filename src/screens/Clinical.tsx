import React, { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Activity, AlertTriangle } from "lucide-react";
import axios from "axios";

/** ====== Giữ đúng kiểu & UI như trang Meals ====== */
type ApiResponse<T> = { code: number; message: string; data: T };
type PageBE<T> = { content: T[]; size: number; number: number; last: boolean };

type NamedItem = { id: string; name: string; description?: string | null; createdAt?: string };
type StatItem = { name: string; count: number };
type Stats = { total?: number; top: StatItem[] };

/** ====== API client (có interceptor 401, giữ nguyên UI) ====== */
const BASE_URL = "http://localhost:8080";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
    // withCredentials: true, // bật nếu BE dùng cookie phiên
});

// Gắn Bearer token từ localStorage nếu có
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

// Refresh-token khi 401 (1 lần), rồi retry (nếu BE có /auth/refresh)
let isRefreshing = false;
let waiters: Array<(t: string | null) => void> = [];

async function refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
    const res = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
    );
    const newToken = (res.data?.accessToken ?? res.data?.data?.accessToken) as string;
    if (!newToken) throw new Error("INVALID_REFRESH_RESPONSE");
    localStorage.setItem("accessToken", newToken);
    return newToken;
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config || {};
        const status = error?.response?.status;

        if (status === 401 && !original._retry) {
            if (isRefreshing) {
                const token = await new Promise<string | null>((resolve) => waiters.push(resolve));
                if (token) {
                    original._retry = true;
                    original.headers = original.headers ?? {};
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                }
            } else {
                original._retry = true;
                isRefreshing = true;
                try {
                    const newToken = await refreshAccessToken();
                    waiters.forEach((cb) => cb(newToken));
                    waiters = [];
                    isRefreshing = false;
                    original.headers = original.headers ?? {};
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return api(original);
                } catch {
                    waiters.forEach((cb) => cb(null));
                    waiters = [];
                    isRefreshing = false;
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                }
            }
        }
        return Promise.reject(error);
    }
);

function toAxiosMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const s = err.response?.status ?? "ERR";
        const d = err.response?.data as any;
        const msg =
            s === 401
                ? "Chưa đăng nhập hoặc phiên đã hết hạn"
                : (typeof d === "string" && d) ||
                (d && typeof d.message === "string" && d.message) ||
                (d && typeof d.error === "string" && d.error) ||
                err.message;
        return `HTTP ${s}: ${msg}`;
    }
    return (err as any)?.message ?? "Lỗi không xác định";
}

/** Tổng nhỏ cạnh tiêu đề (UI only) */
function TotalPill({
    label,
    value,
    loading = false,
}: {
    label: string;
    value?: number;
    loading?: boolean;
}) {
    return (
        <span className="ml-2 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
            {label}:{" "}
            {loading ? (
                <span className="inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : typeof value === "number" ? (
                <span className="tabular-nums">{value.toLocaleString()}</span>
            ) : (
                <span>—</span>
            )}
        </span>
    );
}

/** Dialog xác nhận xoá */
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

/** Modal thêm/chỉnh sửa (UI như Meals) */
function EditModal({
    open,
    title,
    draft,
    setDraft,
    onClose,
    onSave,
    isSaving = false,
}: {
    open: boolean;
    title: string;
    draft: NamedItem;
    setDraft: React.Dispatch<React.SetStateAction<NamedItem>>;
    onClose: () => void;
    onSave: () => void;
    isSaving?: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
            <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h4 className="text-base font-semibold">{title}</h4>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Tên</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-green-100"
                            placeholder="VD: Đái tháo đường tuýp 2 / Dị ứng hải sản"
                            value={draft.name}
                            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Mô tả (tuỳ chọn)</label>
                        <textarea
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-green-100"
                            placeholder="Ghi chú thêm…"
                            rows={3}
                            value={draft.description ?? ""}
                            onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                        />
                    </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Đóng
                    </button>
                    <button
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-2"
                        onClick={onSave}
                        disabled={isSaving || !draft.name.trim()}
                    >
                        {isSaving && (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full" />
                        )}
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}

/** ====== API endpoints (đổi nếu BE khác tên) ====== */
type CollectionKind = "conditions" | "allergies";
const URLS = {
    conditions: {
        stats: "/conditions/stats",
        list: "/conditions/all",
        search: "/conditions/search",
        create: "/conditions",
        update: (id: string) => `/conditions/${id}`,
        delete: (id: string) => `/conditions/${id}`,
    },
    allergies: {
        stats: "/allergies/stats",
        list: "/allergies/all",
        search: "/allergies/search",
        create: "/allergies",
        update: (id: string) => `/allergies/${id}`,
        delete: (id: string) => `/allergies/${id}`,
    },
} as const;

/** ====== Cấu hình tải hết dữ liệu (client-side) ====== */
const PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 500;     // kích thước mỗi lượt tải từ BE khi gom toàn bộ
const MAX_PAGES_GUARD = 500;   // chặn vòng lặp vô hạn nếu BE lỗi last=false mãi

// cache full theo từng kind để cắt trang ở FE
const fullCache: Partial<Record<CollectionKind, NamedItem[]>> = {};

/** Gom toàn bộ dữ liệu từ BE, dù /all vẫn phân trang hay trả mảng/Page lẫn lộn */
async function fetchAllPages(kind: CollectionKind): Promise<NamedItem[]> {
    // nếu đã có cache -> dùng luôn
    if (fullCache[kind]) return fullCache[kind]!;

    // TH1: thử gọi không có page/size (một số BE cho /all full)
    try {
        const res = await api.get(URLS[kind].list);
        const raw = (res.data as any)?.data ?? res.data;
        if (Array.isArray(raw)) {
            // mảng full
            // khử trùng lặp theo id (nếu có)
            const map = new Map<string, NamedItem>();
            for (const it of raw) map.set(it.id, it);
            const arr = Array.from(map.values());
            fullCache[kind] = arr;
            return arr;
        }
        if (Array.isArray(raw?.content)) {
            // Page nhưng có content -> có thể là page đầu, ta vẫn gom thêm ở bước TH2
            // Nhét tạm để đỡ chờ, rồi gom đủ bằng vòng lặp tiếp.
            fullCache[kind] = raw.content as NamedItem[];
        }
    } catch {
        // bỏ qua — sẽ sang TH2
    }

    // TH2: gom bằng paginate page/size cho chắc chắn
    const byId = new Map<string, NamedItem>();
    // nếu có content sẵn từ TH1 thì nạp vào map
    if (fullCache[kind]) {
        for (const it of fullCache[kind]!) byId.set(it.id, it);
    }

    let page = 0;
    let last = false;
    let pages = 0;

    while (!last && pages < MAX_PAGES_GUARD) {
        const url = `${URLS[kind].list}?page=${page}&size=${MAX_PAGE_SIZE}&sort=createdAt,desc&sort=id,desc`;
        const res = await api.get(url);
        const raw = (res.data as any)?.data ?? res.data;

        if (Array.isArray(raw)) {
            // BE trả mảng (không phân trang) — đã lấy full, gộp và kết thúc
            for (const it of raw) byId.set(it.id, it);
            last = true;
        } else {
            const pg: PageBE<NamedItem> | undefined =
                raw?.content ? raw :
                    raw?.data?.content ? raw.data :
                        raw;

            const list: NamedItem[] = Array.isArray(pg?.content) ? pg!.content : [];
            for (const it of list) byId.set(it.id, it);

            // tiêu chí dừng: pg.last hoặc số item < MAX_PAGE_SIZE
            last = !!pg?.last || list.length < MAX_PAGE_SIZE;
        }

        page += 1;
        pages += 1;
    }

    const all = Array.from(byId.values());
    fullCache[kind] = all;
    return all;
}

/** Trang hoá theo client cache */
async function fetchPage(kind: CollectionKind, page: number, size: number = PAGE_SIZE) {
    try {
        const full = await fetchAllPages(kind);
        const start = page * size;
        const slice = full.slice(start, start + size);
        const last = start + size >= full.length;
        return { items: slice, last, number: page };
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

async function fetchStats(kind: CollectionKind): Promise<Stats> {
    try {
        const res = await api.get(URLS[kind].stats);
        const payload = res.data as ApiResponse<Stats> | Stats;
        return (payload as any).data ?? (payload as Stats);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

async function searchByName(kind: CollectionKind, name: string, signal?: AbortSignal): Promise<NamedItem[]> {
    try {
        const res = await api.get(URLS[kind].search, { params: { name }, signal });
        const raw = (res.data as any)?.data ?? res.data;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw?.data?.content)) return raw.data.content;
        if (Array.isArray(raw?.content)) return raw.content;
        return [];
    } catch (err) {
        if (axios.isCancel(err) || (err as any)?.name === "CanceledError") return [];
        throw new Error(toAxiosMessage(err));
    }
}

async function createItem(kind: CollectionKind, item: Pick<NamedItem, "name" | "description">) {
    try {
        const res = await api.post(URLS[kind].create, item);
        const payload = res.data as ApiResponse<NamedItem> | NamedItem;
        return (payload as any).data ?? (payload as NamedItem);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}
async function updateItem(kind: CollectionKind, id: string, item: Pick<NamedItem, "name" | "description">) {
    try {
        const res = await api.put(URLS[kind].update(id), item);
        const payload = res.data as ApiResponse<NamedItem> | NamedItem;
        return (payload as any).data ?? (payload as NamedItem);
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}
async function deleteItem(kind: CollectionKind, id: string) {
    try {
        await api.delete(URLS[kind].delete(id));
    } catch (err) {
        throw new Error(toAxiosMessage(err));
    }
}

/** ====== Khối collection (DS + tìm kiếm + Tổng UI + Thêm/Chỉnh sửa/Xoá) ====== */
function CollectionBlock({ kind, title, icon }: { kind: CollectionKind; title: string; icon: React.ReactNode }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [items, setItems] = useState<NamedItem[]>([]);
    const [page, setPage] = useState(0);
    const [isLast, setIsLast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<NamedItem[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Modal Thêm/Chỉnh sửa
    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState<NamedItem | null>(null);
    const [draft, setDraft] = useState<NamedItem>({ id: "", name: "", description: "" });
    const [saving, setSaving] = useState(false);

    const loadStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            const s = await fetchStats(kind);
            setStats(s);
        } catch {
            /* im lặng theo yêu cầu UI */
        } finally {
            setLoadingStats(false);
        }
    }, [kind]);

    const loadPageCb = useCallback(
        async (p: number, append = true) => {
            try {
                setIsLoading(true);
                setListError(null);
                const { items: newItems, last } = await fetchPage(kind, p, PAGE_SIZE);
                setIsLast(last);
                setItems((prev) => (append ? [...prev, ...newItems] : newItems));
            } catch (e: any) {
                const msg = toAxiosMessage(e);
                setListError(msg);
                if (/HTTP 401/.test(msg)) setIsLast(true); // dừng cuộn khi phiên hết hạn
            } finally {
                setIsLoading(false);
            }
        },
        [kind]
    );

    useEffect(() => {
        // reset khi đổi tab
        setItems([]);
        setPage(0);
        setIsLast(false);
        setQuery("");
        setSearchResults([]);
        setSearching(false);
        setSearchError(null);
        delete fullCache[kind]; // clear cache để luôn lấy dữ liệu mới

        loadStats();
        loadPageCb(0, false);
    }, [kind, loadStats, loadPageCb]);

    // search debounce
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setSearching(false);
            setSearchResults([]);
            setSearchError(null);
            return;
        }
        setSearching(true);
        setSearchError(null);
        const controller = new AbortController();
        const t = setTimeout(async () => {
            try {
                const rs = await searchByName(kind, q, controller.signal);
                setSearchResults(rs);
            } catch (e: any) {
                setSearchError(toAxiosMessage(e));
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [query, kind]);

    // infinite scroll (chặn bắn trùng)
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const pagingBusyRef = useRef(false);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries.some((e) => e.isIntersecting);
                if (!visible) return;
                if (pagingBusyRef.current || isLoading || isLast || query) return;

                pagingBusyRef.current = true;
                const next = page + 1;
                setPage(next);
                loadPageCb(next, true).finally(() => {
                    pagingBusyRef.current = false;
                });
            },
            { root: null, threshold: 0.1, rootMargin: "800px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [isLoading, isLast, query, page, loadPageCb]);

    const listToRender = query.trim() ? searchResults : items;

    const refresh = () => {
        if (isLoading) return;
        setQuery("");
        setSearchResults([]);
        setSearching(false);
        setSearchError(null);
        setItems([]);
        setPage(0);
        setIsLast(false);
        delete fullCache[kind];
        loadStats();
        loadPageCb(0, false);
    };

    const askDelete = (id: string) => {
        setToDelete(id);
        setConfirmOpen(true);
    };
    const doDelete = async () => {
        if (!toDelete) return;
        try {
            setDeleting(true);
            await deleteItem(kind, toDelete);
            setItems((prev) => prev.filter((x) => x.id !== toDelete));
            if (fullCache[kind]) {
                fullCache[kind] = fullCache[kind]!.filter((x) => x.id !== toDelete);
            }
            loadStats();
        } catch (e: any) {
            alert(toAxiosMessage(e) ?? "Xoá thất bại");
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
            setToDelete(null);
        }
    };

    // Thêm / Chỉnh sửa
    const openAdd = () => {
        setEditing(null);
        setDraft({ id: "", name: "", description: "" });
        setOpenModal(true);
    };
    const openEdit = (it: NamedItem) => {
        setEditing(it);
        setDraft({ id: it.id, name: it.name, description: it.description ?? "" });
        setOpenModal(true);
    };
    const save = async () => {
        try {
            setSaving(true);
            const payload = { name: draft.name.trim(), description: (draft.description ?? "").trim() || null };
            if (editing) {
                const updated = await updateItem(kind, editing.id, payload);
                setItems((prev) => prev.map((x) => (x.id === editing.id ? updated : x)));
                if (fullCache[kind]) fullCache[kind] = fullCache[kind]!.map((x) => (x.id === editing.id ? updated : x));
            } else {
                const created = await createItem(kind, payload);
                setItems((prev) => [created, ...prev]);
                if (fullCache[kind]) fullCache[kind] = [created, ...fullCache[kind]!];
            }
            setOpenModal(false);
            setEditing(null);
            loadStats();
        } catch (e: any) {
            alert(toAxiosMessage(e) ?? "Lưu thất bại");
        } finally {
            setSaving(false);
        }
    };

    /** Tổng (UI only) */
    const totalValue =
        typeof stats?.total === "number"
            ? stats.total
            : !query && isLast
                ? items.length
                : undefined;
    const totalLabel = kind === "conditions" ? "Tổng bệnh nền" : "Tổng dị ứng";

    return (
        <div className="space-y-3">
            {/* Header + actions + Tổng UI */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-emerald-50 text-emerald-700 p-2">{icon}</div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <TotalPill label={totalLabel} value={totalValue} loading={loadingStats} />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50"
                        disabled={isLoading}
                        title="Làm mới"
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
                        <Plus size={18} /> Thêm {kind === "conditions" ? "bệnh nền" : "dị ứng"}
                    </button>
                </div>
            </div>

            {/* Tìm kiếm */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-700 mb-3">Tìm theo tên</div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                        placeholder={`Nhập tên ${kind === "conditions" ? "bệnh nền" : "dị ứng"}…`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                            {searching ? "Đang tìm…" : searchError ? "Lỗi tìm" : `${listToRender.length} kết quả`}
                        </div>
                    )}
                </div>
            </div>

            {/* Danh sách */}
            {!query && listError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
                    Lỗi tải danh sách: {listError}
                </div>
            )}
            {query && searchError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
                    Lỗi tìm kiếm: {searchError}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listToRender.map((it) => (
                    <div key={it.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
                        <div className="p-4 flex-1 flex flex-col gap-2">
                            <div className="text-base font-semibold text-slate-900 line-clamp-2" title={it.name}>
                                {it.name}
                            </div>
                            {it.description ? <div className="text-sm text-slate-600 line-clamp-3">{it.description}</div> : null}
                            <div className="mt-auto pt-3 flex items-center justify-end gap-2">
                                <button
                                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={() => openEdit(it)}
                                    title="Chỉnh sửa"
                                >
                                    <Pencil size={16} />
                                    <span className="text-sm">Chỉnh sửa</span>
                                </button>
                                <button
                                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
                                    onClick={() => askDelete(it.id)}
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

            {/* Sentinel */}
            <div ref={sentinelRef} className="h-8" />

            {/* Modals */}
            <EditModal
                open={openModal}
                title={`${editing ? "Chỉnh sửa" : "Thêm"} ${kind === "conditions" ? "bệnh nền" : "dị ứng"}`}
                draft={draft}
                setDraft={setDraft}
                onClose={() => setOpenModal(false)}
                onSave={save}
                isSaving={saving}
            />
            <ConfirmDialog
                open={confirmOpen}
                title="Xác nhận xoá"
                description="Bạn có chắc muốn xóa không?"
                onConfirm={doDelete}
                onCancel={() => !deleting && setConfirmOpen(false)}
                isBusy={deleting}
            />
        </div>
    );
}

/** ====== Trang RIÊNG: Bệnh nền & Dị ứng ====== */
export default function ClinicalPage() {
    // Top 5 (để dưới cùng trang)
    const [condStats, setCondStats] = useState<Stats | null>(null);
    const [allergStats, setAllergStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const loadBottomStats = useCallback(async () => {
        try {
            setLoading(true);
            setErr(null);
            const [s1, s2] = await Promise.all([api.get(URLS.conditions.stats), api.get(URLS.allergies.stats)]);
            const cond = ((s1.data as any)?.data ?? s1.data) as Stats;
            const allerg = ((s2.data as any)?.data ?? s2.data) as Stats;
            setCondStats(cond);
            setAllergStats(allerg);
        } catch (e: any) {
            setErr(toAxiosMessage(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBottomStats();
    }, [loadBottomStats]);

    const renderTopCard = (title: string, s: Stats | null) => (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">{title}</div>
                {err && <span className="text-xs text-rose-600">Không tải được</span>}
            </div>
            {loading ? (
                <div className="text-slate-500 text-sm">Đang tải…</div>
            ) : !s || s.top.length === 0 ? (
                <div className="text-slate-400 text-sm">Chưa có dữ liệu</div>
            ) : (
                <ul className="space-y-2">
                    {s.top.slice(0, 5).map((t, idx) => {
                        const total = typeof s.total === "number" ? s.total : 0;
                        const pct = total > 0 ? Math.round((t.count * 1000) / total) / 10 : 0;
                        return (
                            <li key={idx} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 text-right text-slate-500">{idx + 1}.</span>
                                    <span className="font-medium">{t.name}</span>
                                </div>
                                <div className="text-sm text-slate-600">
                                    {t.count.toLocaleString()} <span className="text-slate-400">({pct}%)</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Quản lý bệnh nền và Dị ứng</h1>
                <p className="text-slate-500 text-sm">
                    Quản lý các bệnh nền và dị ứng thường gặp ở bệnh nhân để theo dõi và chăm sóc sức khỏe hiệu quả hơn.
                </p>
            </div>
            {/* Bệnh nền */}
            <CollectionBlock kind="conditions" title="Bệnh nền" icon={<Activity size={18} />} />

            {/* Dị ứng (sát hơn) */}
            <div className="mt-2">
                <CollectionBlock kind="allergies" title="Dị ứng" icon={<AlertTriangle size={18} />} />
            </div>

            {/* TOP 5: gom nằm cuối trang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTopCard("Top 5 bệnh nền xuất hiện nhiều nhất", condStats)}
                {renderTopCard("Top 5 dị ứng xuất hiện nhiều nhất", allergStats)}
            </div>

            {/* Dòng trạng thái “Đã hết dữ liệu” CHUNG cho toàn trang (UI) */}
            <div className="text-slate-400 text-sm text-center py-6">Đã hết dữ liệu</div>
        </div>
    );
}
