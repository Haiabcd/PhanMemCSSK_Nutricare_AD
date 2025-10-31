import React, { useEffect, useState, useCallback } from "react";
import type { NamedItem, Stats, ClinicalOverview, CollectionKind } from "../types/clinical";
import {
    fetchClinicalOverview,
    fetchStats,
    searchByName,
    createItem,
    updateItem,
    deleteItem,
    fetchAllergiesPage,
    fetchConditionsPage,
    clearCollectionCache,
} from "../service/clinical.service";
import { Plus, Pencil, Trash2, Search, Activity, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

/* ========= helpers ========= */
function errorMessage(err: unknown): string {
    if (err && typeof err === "object") {
        const maybeMsg = (err as { message?: string }).message;
        if (typeof maybeMsg === "string" && maybeMsg.length) return maybeMsg;
    }
    return "Đã xảy ra lỗi";
}

/** ====== UI bits ====== */
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

function FieldHintError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs text-red-600 mt-1">{message}</p>;
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

/** ===== Modal xem chi tiết (Xem thêm) ===== */
type UIItem = NamedItem & { role?: string; description?: string };
function DetailModal({
    open,
    item,
    onClose,
}: {
    open: boolean;
    item?: UIItem | null;
    onClose: () => void;
}) {
    if (!open || !item) return null;
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-[92vw] max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-base font-semibold">{item.name}</h4>
                    <button
                        className="h-8 w-8 grid place-items-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        onClick={onClose}
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>
                <div className="px-5 py-4 space-y-3">
                    {item.role && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 text-xs">
                            Vai trò/Mô tả: <span className="font-medium">{item.role}</span>
                        </div>
                    )}
                    {item.description ? (
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{item.description}</p>
                    ) : (
                        <p className="text-sm text-slate-500">Không có mô tả chi tiết.</p>
                    )}
                </div>
                <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
                    <button className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

/** ===== EditModal: chỉ còn 1 ô Tên + validate realtime ===== */
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
    const name = draft?.name ?? "";
    const nameError = !name.trim() ? "Vui lòng nhập tên" : undefined;

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
            <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h4 className="text-base font-semibold">{title}</h4>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Tên</label>
                        <input
                            className={`mt-1 w-full rounded-xl px-3 py-2 focus:outline-none focus:ring-4 border ${nameError ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:ring-green-100"
                                }`}
                            placeholder="VD: Đái tháo đường tuýp 2 / Dị ứng hải sản"
                            value={name}
                            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                            aria-invalid={Boolean(nameError)}
                        />
                        <FieldHintError message={nameError} />
                    </div>
                    {/* Không có ô mô tả trong modal thêm/sửa */}
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
                        disabled={isSaving || Boolean(nameError)}
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

/** ====== Block danh sách (Conditions/Allergies) ====== */
function CollectionBlock({
    kind,
    title,
    icon,
    totalOverride,
    loadingTotalOverride = false,
    onMutate,
}: {
    kind: CollectionKind;
    title: string;
    icon: React.ReactNode;
    totalOverride?: number;
    loadingTotalOverride?: boolean;
    onMutate?: () => void;
}) {
    const [stats, setStatsState] = useState<Stats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [items, setItems] = useState<UIItem[]>([]);
    const [page, setPage] = useState(0);
    const [isLast, setIsLast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<UIItem[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [editing, setEditing] = useState<NamedItem | null>(null);
    const [draft, setDraft] = useState<NamedItem>({ id: "", name: "" });
    const [saving, setSaving] = useState(false);

    // Modal xem thêm
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<UIItem | null>(null);

    const openDetail = (it: UIItem) => {
        setDetailItem(it);
        setDetailOpen(true);
    };

    // ===== Dùng fetchStats như cũ =====
    const loadStatsCb = useCallback(async () => {
        try {
            setLoadingStats(true);
            const s = await fetchStats(kind);
            setStatsState(s);
        } finally {
            setLoadingStats(false);
        }
    }, [kind]);

    // ===== Hàm gọi trang theo kind bằng API mới =====
    const loadPageCb = useCallback(
        async (p: number) => {
            try {
                setIsLoading(true);
                setListError(null);

                if (kind === "allergies") {
                    const res = await fetchAllergiesPage(p, 12);
                    const slice = res.data;
                    const mapped: UIItem[] = slice.content.map((x: any) => ({
                        id: String(x.id),
                        name: x.name,
                        role: x.role ?? x.description ?? "",        // map an toàn
                        description: x.description ?? "",           // dùng cho xem thêm
                    }));
                    setItems(mapped);
                    setIsLast(Boolean(slice.last) || mapped.length < 12);
                } else {
                    const res = await fetchConditionsPage(p, 12);
                    const slice = res.data;
                    const mapped: UIItem[] = slice.content.map((x: any) => ({
                        id: String(x.id),
                        name: x.name,
                        role: x.role ?? x.description ?? "",
                        description: x.description ?? "",
                    }));
                    setItems(mapped);
                    setIsLast(Boolean(slice.last) || mapped.length < 12);
                }
            } catch (e: unknown) {
                const msg = errorMessage(e);
                setListError(msg);
                if (/HTTP 401/.test(msg)) setIsLast(true);
                setItems([]);
            } finally {
                setIsLoading(false);
            }
        },
        [kind]
    );

    // init + reset khi đổi kind
    useEffect(() => {
        setItems([]);
        setPage(0);
        setIsLast(false);
        setQuery("");
        setSearchResults([]);
        setSearching(false);
        setSearchError(null);
        clearCollectionCache(kind);

        loadStatsCb();
        loadPageCb(0);
    }, [kind, loadStatsCb, loadPageCb]);

    // debounce search
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
        const t = window.setTimeout(async () => {
            try {
                const rs = await searchByName(kind, q, controller.signal);
                setSearchResults(
                    rs.map((x: any) => ({
                        id: x.id,
                        name: x.name,
                        role: x.role ?? x.description ?? "",
                        description: x.description ?? "",
                    }))
                );
            } catch (e: unknown) {
                setSearchError(errorMessage(e));
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => {
            window.clearTimeout(t);
            controller.abort();
        };
    }, [query, kind]);

    // ===== Phân trang bằng nút Prev/Next =====
    const goPrev = () => {
        if (isLoading || page === 0) return;
        const p = page - 1;
        setPage(p);
        loadPageCb(p);
    };

    const goNext = () => {
        if (isLoading || isLast) return;
        const p = page + 1;
        setPage(p);
        loadPageCb(p);
    };

    // Làm mới trang hiện tại
    const refresh = () => {
        if (isLoading) return;
        setQuery("");
        setSearchResults([]);
        setSearching(false);
        setSearchError(null);
        clearCollectionCache(kind);
        loadStatsCb();
        loadPageCb(page);
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
            await loadStatsCb();
            onMutate?.();
            loadPageCb(page);
        } catch (e: unknown) {
            alert(errorMessage(e));
        } finally {
            setDeleting(false);
            setConfirmOpen(false);
            setToDelete(null);
        }
    };

    const openAdd = () => {
        setEditing(null);
        setDraft({ id: "", name: "" });
        setOpenModal(true);
    };
    const openEdit = (it: NamedItem) => {
        setEditing(it);
        setDraft({ id: it.id, name: it.name });
        setOpenModal(true);
    };
    const save = async () => {
        try {
            setSaving(true);
            const payload = { name: draft.name.trim() };
            if (!payload.name) return;

            if (editing) {
                const updated = await updateItem(kind, editing.id, payload);
                setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
            } else {
                const created = await createItem(kind, payload);
                setItems((prev) => [{ ...created }, ...prev].slice(0, 12));
            }
            setOpenModal(false);
            setEditing(null);
            await loadStatsCb();
            onMutate?.();
        } catch (e: unknown) {
            alert(errorMessage(e));
        } finally {
            setSaving(false);
        }
    };

    const totalValue =
        typeof totalOverride === "number"
            ? totalOverride
            : typeof stats?.total === "number"
                ? (stats.total as number)
                : undefined;

    const totalLabel = kind === "conditions" ? "Tổng bệnh nền" : "Tổng dị ứng";

    const data = query ? searchResults : items;

    return (
        <div className="space-y-3">
            {/* Header + actions + Tổng */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-emerald-50 text-emerald-700 p-2">{icon}</div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <TotalPill label={totalLabel} value={totalValue} loading={loadingStats || loadingTotalOverride} />
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

            {/* Search */}
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
                            {searching ? "Đang tìm…" : searchError ? "Lỗi tìm" : `${(query ? searchResults.length : items.length)} kết quả`}
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
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
                {data.map((it) => (
                    <div
                        key={it.id}
                        className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col"
                    >
                        {/* Giữ chiều cao đồng đều: khối nội dung có min-h + clamp 4 dòng */}
                        <div className="p-4 flex-1 flex flex-col">
                            {/* Tên */}
                            <div className="text-base font-semibold text-slate-900 line-clamp-2" title={it.name}>
                                {it.name}
                            </div>

                            {/* Role/Mô tả ngắn: clamp 4, chiều cao cố định để các thẻ đều nhau */}
                            <div className="mt-2 text-sm text-slate-600">
                                {it.role ? (
                                    <>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-0.5 text-[12px]">
                                            Vai trò/Mô tả
                                        </div>
                                        <p
                                            className="mt-2 line-clamp-4"
                                            title={it.role}
                                            style={{ minHeight: "4.5rem" /* ~ 4 dòng */ }}
                                        >
                                            {it.role}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-slate-400" style={{ minHeight: "4.5rem" }}>
                                        Chưa có mô tả
                                    </p>
                                )}
                            </div>

                            {/* Actions: dồn xuống đáy để thẻ cao đều */}
                            <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                                <button
                                    className="px-3 py-2 rounded-lg inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700"
                                    onClick={() => openDetail(it)}
                                    title="Xem thêm"
                                >
                                    <span className="text-sm">Xem thêm</span>
                                </button>

                                <div className="flex items-center gap-2">
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
                    </div>
                ))}
            </div>

            {/* Pagination controls */}
            {!query && (
                <div className="pt-3 flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
                        <button
                            onClick={goPrev}
                            disabled={isLoading || page === 0}
                            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Trang trước"
                            title="Trang trước"
                        >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 group-hover:border-slate-300">
                                <ChevronLeft size={18} />
                            </span>
                            <span className="text-sm font-medium hidden sm:inline">Trước</span>
                        </button>

                        <div className="mx-1 min-w-[90px] text-center text-sm text-slate-600">
                            Trang <span className="font-semibold text-slate-900">{page + 1}</span>
                        </div>

                        <button
                            onClick={goNext}
                            disabled={isLoading || isLast}
                            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Trang sau"
                            title="Trang sau"
                        >
                            <span className="text-sm font-medium hidden sm:inline">Sau</span>
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 group-hover:border-slate-300">
                                <ChevronRight size={18} />
                            </span>
                        </button>
                    </div>
                </div>
            )}

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

            <DetailModal open={detailOpen} item={detailItem} onClose={() => setDetailOpen(false)} />
        </div>
    );
}

/** ====== Trang chính ClinicalPage ====== */
export default function ClinicalPage() {
    const [overview, setOverview] = useState<ClinicalOverview>({});
    const [loadingOverview, setLoadingOverview] = useState(false);

    const [condStats, setCondStats] = useState<Stats | null>(null);
    const [allergStats, setAllergStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);

    const loadOverview = useCallback(async () => {
        setLoadingOverview(true);
        const data = await fetchClinicalOverview();
        setOverview(data);
        setLoadingOverview(false);
    }, []);

    const loadBottomStats = useCallback(async () => {
        try {
            setLoading(true);
            const [cond, allerg] = await Promise.all([fetchStats("conditions"), fetchStats("allergies")]);
            setCondStats(cond);
            setAllergStats(allerg);
        } catch (e) {
            console.error("Failed to load bottom stats:", e);
            setCondStats({ total: 0, top: [] });
            setAllergStats({ total: 0, top: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
        loadBottomStats();
    }, [loadOverview, loadBottomStats]);

    const renderTopCard = (title: string, s: Stats | null) => {
        const arr = Array.isArray(s?.top) ? s!.top : [];
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">{title}</div>
                </div>
                {loading ? (
                    <div className="text-slate-500 text-sm">Đang tải…</div>
                ) : arr.length === 0 ? (
                    <div className="text-slate-400 text-sm">Chưa có dữ liệu</div>
                ) : (
                    <ul className="space-y-2">
                        {arr.slice(0, 5).map((t, idx) => {
                            const total = typeof s?.total === "number" ? (s!.total as number) : 0;
                            const pct = total > 0 ? Math.round((t.count * 1000) / total) / 10 : 0;
                            return (
                                <li key={t.name + idx} className="flex items-center justify-between gap-3">
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
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Quản lý bệnh nền và Dị ứng</h1>
                <p className="text-slate-500 text-sm">
                    Quản lý các bệnh nền và dị ứng thường gặp ở bệnh nhân để theo dõi và chăm sóc sức khỏe hiệu quả hơn.
                </p>
            </div>

            {/* Bệnh nền */}
            <CollectionBlock
                kind="conditions"
                title="Bệnh nền"
                icon={<Activity size={18} />}
                totalOverride={overview.getTotalConditions}
                loadingTotalOverride={loadingOverview}
                onMutate={loadOverview}
            />

            {/* Dị ứng */}
            <div className="mt-2">
                <CollectionBlock
                    kind="allergies"
                    title="Dị ứng"
                    icon={<AlertTriangle size={18} />}
                    totalOverride={overview.getTotalAllergies}
                    loadingTotalOverride={loadingOverview}
                    onMutate={loadOverview}
                />
            </div>

            {/* TOP 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTopCard("Top 5 bệnh nền xuất hiện nhiều nhất", condStats)}
                {renderTopCard("Top 5 dị ứng xuất hiện nhiều nhất", allergStats)}
            </div>

            <div className="text-slate-400 text-sm text-center py-6">Đã hết dữ liệu</div>
        </div>
    );
}
