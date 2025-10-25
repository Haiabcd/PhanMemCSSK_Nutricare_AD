import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    LogOut,
    LogIn,
    Plus,
    Pencil,
    Trash2,
    Search,
    UtensilsCrossed,
    Apple,
    Users2,
    BarChart3,
    Brain,
    LayoutDashboard,
} from "lucide-react";

/** NutriCare Admin — single-file React component (đã tối giản) */

// ===== Types =====
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

type User =
    | { uid: string; displayName: string; email?: string; photoURL?: string }
    | null;
type TabKey = "overview" | "meals" | "userStats" | "nutritionStats";

// ===== Helpers =====
const uid = () => Math.random().toString(36).slice(2);
const STORAGE_KEY = "nutricare_admin_meals";

const DEFAULT_MEALS: Meal[] = [
    {
        id: uid(),
        name: "Phở bò",
        description: "Phở nước dùng đậm đà với thịt bò mềm.",
        image:
            "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1600&auto=format&fit=crop",
        servingSize: 1,
        servingUnit: "tô",
        unitWeightGram: 450,
        cookTimeMin: 25,
        calories: 480,
        proteinG: 30,
        carbG: 60,
        fatG: 14,
        fiberG: 3,
        sodiumMg: 1600,
        sugarMg: 5,
        slots: ["Bữa sáng", "Bữa trưa"],
    },
    {
        id: uid(),
        name: "Cơm gà xé",
        description: "Cơm gà luộc/xé, ít mỡ, rau dưa đi kèm.",
        image:
            "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1600&auto=format&fit=crop",
        servingSize: 1,
        servingUnit: "đĩa",
        unitWeightGram: 350,
        cookTimeMin: 35,
        calories: 560,
        proteinG: 35,
        carbG: 75,
        fatG: 12,
        fiberG: 4,
        sodiumMg: 900,
        sugarMg: 6,
        slots: ["Bữa trưa", "Bữa chiều"],
    },
];

// ===== UI bits =====
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
                <div className="p-2.5 rounded-xl bg-green-50 text-green-600 border border-green-100">{icon}</div>
                <div>
                    <div className="text-sm text-slate-500">{title}</div>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                </div>
            </div>
            {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
        </div>
    );
}

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
        <div className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm ${className ?? ""}`}>
            <div className="flex items-baseline justify-between">
                <div className="font-semibold">{title}</div>
                {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

// ===== Charts (SVG) =====
function MiniLineChart({ data, labels, height = 180 }: { data: number[]; labels: string[]; height?: number }) {
    const w = 560;
    const max = Math.max(...data, 1);
    const step = w / Math.max(1, data.length - 1);
    const pts = data.map((v, i) => ({ x: i * step, y: height - (v / max) * (height - 28) - 8 }));
    const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-44">
            <line x1="0" y1={height - 22} x2={w} y2={height - 22} className="stroke-slate-200" />
            <polyline points={`0,${height - 22} ${poly} ${w},${height - 22}`} fill="rgba(34,197,94,0.08)" />
            <polyline points={poly} fill="none" className="stroke-2" style={{ stroke: "#16a34a" }} />
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" style={{ fill: "#16a34a" }} />
            ))}
            {labels.map((lb, i) => {
                const x = i * step;
                return (
                    <text key={i} x={x} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[10px]">
                        {lb}
                    </text>
                );
            })}
        </svg>
    );
}

function MiniBarChart({ labels, data, height = 220 }: { labels: string[]; data: number[]; height?: number }) {
    const width = 560,
        padX = 28,
        padBottom = 30,
        padTop = 16;
    const maxData = Math.max(...data, 1);
    const niceStep = Math.max(1, Math.ceil(maxData / 4));
    const niceMax = Math.ceil(maxData / niceStep) * niceStep;

    const slotW = (width - padX * 2) / data.length;
    const barW = Math.min(28, slotW * 0.6);

    const yScale = (v: number) => height - padBottom - (v / niceMax) * (height - padBottom - padTop);
    const gridVals = Array.from({ length: 5 }, (_, i) => i * niceStep);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
            {gridVals.map((gv, i) => {
                const y = yScale(gv);
                return (
                    <g key={i}>
                        <line x1={padX} y1={y} x2={width - padX} y2={y} className="stroke-slate-200" />
                        <text x={padX - 6} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                            {gv}
                        </text>
                    </g>
                );
            })}

            {data.map((v, i) => {
                const cx = padX + i * slotW + slotW / 2;
                const barH = Math.max(2, (v / niceMax) * (height - padBottom - padTop));
                const x = cx - barW / 2;
                const y = height - padBottom - barH;

                return (
                    <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH} rx="6" className="fill-green-500/80">
                            <title>{`Tháng ${labels[i]}: ${v} món`}</title>
                        </rect>
                        <text x={cx} y={y - 6} textAnchor="middle" className="fill-slate-600 text-[10px] font-medium">
                            {v}
                        </text>
                        <text x={cx} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[10px]">
                            {labels[i]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function MiniDonutChart({ items }: { items: { label: string; value: number }[] }) {
    const total = Math.max(1, items.reduce((s, i) => s + i.value, 0));
    const radius = 70,
        stroke = 26,
        size = 180;
    let acc = 0;
    const palette = ["#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

    return (
        <div className="flex items-center gap-5">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
                {items.map((it, idx) => {
                    const frac = it.value / total;
                    const dash = 2 * Math.PI * radius * frac;
                    const gap = 2 * Math.PI * radius - dash;
                    const rot = (acc / total) * 360;
                    acc += it.value;
                    return (
                        <circle
                            key={idx}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={palette[idx % palette.length]}
                            strokeWidth={stroke}
                            strokeDasharray={`${dash} ${gap}`}
                            transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rot} ${size / 2} ${size / 2})`}
                            strokeLinecap="butt"
                        />
                    );
                })}
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-slate-700 text-sm">
                    {total}
                </text>
            </svg>

            <div className="text-sm space-y-2">
                {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: palette[i % palette.length] }} />
                        <span className="text-slate-600">{it.label}</span>
                        <span className="ml-auto font-medium">{it.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ===== Main =====
export default function App() {
    const [user, setUser] = useState<User>(null);
    const [tab, setTab] = useState<TabKey>("overview");

    const handleGoogleLogin = () =>
        setUser({
            uid: uid(),
            displayName: "Admin NutriCare",
            email: "admin@nutricare.vn",
            photoURL: "https://i.pravatar.cc/100?img=68",
        });
    const handleLogout = () => setUser(null);

    const [meals, setMeals] = useState<Meal[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const data = raw ? (JSON.parse(raw) as Meal[]) : null;
            return Array.isArray(data) && data.length >= 2 ? data : DEFAULT_MEALS;
        } catch {
            return DEFAULT_MEALS;
        }
    });
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    }, [meals]);

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

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDelete, setToDelete] = useState<string | null>(null);
    const askDelete = (id: string) => {
        setToDelete(id);
        setConfirmOpen(true);
    };
    const doDelete = () => {
        if (toDelete) setMeals((prev) => prev.filter((x) => x.id !== toDelete));
        setConfirmOpen(false);
        setToDelete(null);
    };

    if (!user) {
        return (
            <div className="relative h-screen w-screen overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_80%_0%,#d1fae5_0%,transparent_55%),radial-gradient(60%_60%_at_0%_100%,#dbeafe_0%,transparent_60%)]" />
                <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-400/30 blur-3xl" />
                <div className="absolute -bottom-16 -right-16 h-[520px] w-[520px] rounded-full bg-sky-400/30 blur-3xl" />

                <div className="relative z-10 h-full w-full flex items-center justify-center p-6">
                    <div className="w-full max-w-2xl">
                        <div className="rounded-[32px] border border-white/60 bg-white/85 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.1)] overflow-hidden">
                            <div className="pt-14 pb-6 flex flex-col items-center text-center space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-0 blur-2xl bg-emerald-400/40" />
                                    <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 grid place-items-center text-white shadow-lg ring-8 ring-emerald-200/40">
                                        <UtensilsCrossed size={30} />
                                    </div>
                                </div>
                                <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-sky-600 text-transparent bg-clip-text drop-shadow-sm">
                                    NutriCare
                                </div>
                                <div className="text-slate-600 text-base font-medium">Hành trình sức khỏe của bạn bắt đầu từ đây!</div>
                            </div>

                            <div className="px-10 pb-14 text-center">
                                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Xin chào 👋</h1>
                                <p className="mt-3 text-slate-600 text-base leading-relaxed">
                                    Hãy đăng nhập để vào bên trong và quản lý dữ liệu dinh dưỡng của bạn.
                                </p>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="mt-10 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4
                  bg-gradient-to-r from-emerald-600 to-sky-600 text-white hover:from-emerald-700 hover:to-sky-700
                  active:scale-[0.98] transition-all shadow-[0_16px_40px_rgba(16,185,129,0.25)] text-lg font-semibold"
                                >
                                    <LogIn size={20} />
                                    Đăng nhập bằng Google
                                </button>

                                <div className="mt-8 text-xs text-slate-500">Chúng tôi cam kết bảo mật tuyệt đối thông tin của bạn.</div>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-xs text-slate-500">
                            © {new Date().getFullYear()} NutriCare — Powered by your health journey.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const totalMeals = meals.length;

    // ===== Header =====
    const Header = (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
            <div className="w-full flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-emerald-400/35" />
                        <div
                            className="relative h-10 w-10 rounded-2xl grid place-items-center text-white
                 bg-gradient-to-br from-green-500 to-emerald-600 shadow-md
                 ring-4 ring-emerald-200/40"
                            aria-label="NutriCare logo"
                        >
                            <UtensilsCrossed size={20} />
                        </div>
                    </div>
                    <div className="leading-tight">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700/90">NutriCare</div>
                        <div className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                            Quản Lý NutriCare
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-3 pr-2">
                        {user.photoURL && <img src={user.photoURL} alt="avatar" className="h-8 w-8 rounded-full object-cover" />}
                        <div className="text-sm text-slate-600">
                            <div className="font-medium leading-4">{user.displayName}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                    </div>
                    <LogoutButton onClick={handleLogout} />
                </div>
            </div>
        </header>
    );

    const Sidebar = (
        <aside className="w-full sm:w-60 shrink-0">
            <div className="sticky top-[60px] sm:top-[56px] rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur p-3 sm:p-4 shadow-sm">
                <nav className="space-y-2">
                    <SidebarBtn icon={<LayoutDashboard size={18} />} active={tab === "overview"} onClick={() => setTab("overview")}>
                        Tổng quan
                    </SidebarBtn>
                    <SidebarBtn icon={<Apple size={18} />} active={tab === "meals"} onClick={() => setTab("meals")}>
                        Quản lý món ăn
                    </SidebarBtn>
                    <SidebarBtn icon={<Users2 size={18} />} active={tab === "userStats"} onClick={() => setTab("userStats")}>
                        Thống kê người dùng
                    </SidebarBtn>
                    <SidebarBtn icon={<Brain size={18} />} active={tab === "nutritionStats"} onClick={() => setTab("nutritionStats")}>
                        Thống kê dinh dưỡng & món ăn
                    </SidebarBtn>
                </nav>
            </div>
        </aside>
    );

    // ===== Pages =====
    const OverviewPage = (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold mb-1">Tổng quan</h1>
                <p className="text-slate-500 text-sm">Toàn cảnh người dùng, món ăn và kế hoạch dinh dưỡng.</p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <StatCard icon={<Users2 />} title="Tổng người dùng" value={1289} hint="Demo – thay bằng dữ liệu BE" />
                <StatCard icon={<Apple />} title="Tổng số món ăn" value={totalMeals} />
                <StatCard icon={<BarChart3 />} title="Kế hoạch dinh dưỡng đã tạo" value={112} hint="Demo" />
            </div>

            <div className="grid xl:grid-cols-2 gap-5">
                <Card title="Tăng trưởng người dùng" subtitle="7 ngày gần nhất">
                    <MiniLineChart data={[120, 142, 138, 156, 149, 171, 189]} labels={["T2", "T3", "T4", "T5", "T6", "T7", "CN"]} />
                </Card>

                <Card title="Món ăn thêm mới" subtitle="12 tháng gần đây">
                    <MiniBarChart
                        labels={["Th 1", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "Th 8", "Th 9", "Th 10", "Th 11", "Th 12"]}
                        data={[8, 11, 6, 14, 9, 13, 12, 10, 15, 16, 12, 18]}
                    />
                </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-5">
                <Card title="Tỉ lệ bữa ăn (Theo món có sẵn)">
                    <MiniDonutChart
                        items={[
                            { label: "Bữa sáng", value: meals.filter((m) => m.slots.includes("Bữa sáng")).length },
                            { label: "Bữa trưa", value: meals.filter((m) => m.slots.includes("Bữa trưa")).length },
                            { label: "Bữa chiều", value: meals.filter((m) => m.slots.includes("Bữa chiều")).length },
                            { label: "Bữa phụ", value: meals.filter((m) => m.slots.includes("Bữa phụ")).length },
                        ]}
                    />
                </Card>

                <Card title="Tỉ lệ bữa ăn (Người dùng tự nhập)">
                    <MiniDonutChart items={[{ label: "Quét (scan)", value: 120 }, { label: "Nhập thủ công", value: 80 }]} />
                </Card>
            </div>
        </div>
    );

    const MealsPage = (
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

                <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3.5 py-2.5 hover:bg-green-700 shadow">
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
        </div>
    );

    const UserStatsPage = (
        <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
                <StatCard icon={<Users2 />} title="Tổng người dùng" value={1289} />
                <StatCard icon={<LogIn />} title="Người dùng mới (7 ngày)" value={86} hint="Demo" />
            </div>

            <Card title="Phân bổ thời điểm cập nhật" subtitle="Sáng / Trưa / Chiều / Tối">
                <MiniBarChart labels={["Sáng", "Trưa", "Chiều", "Tối"]} data={[320, 410, 280, 210]} />
            </Card>

            <div className="grid xl:grid-cols-2 gap-5">
                <Card title="Tỉ lệ người dùng (Có tài khoản / Bắt đầu ngay)">
                    <MiniDonutChart items={[{ label: "Có tài khoản", value: 780 }, { label: "Bắt đầu ngay", value: 509 }]} />
                </Card>

                <Card title="Tỉ lệ người dùng theo mục tiêu">
                    <MiniDonutChart items={[{ label: "Tăng cân", value: 312 }, { label: "Giảm cân", value: 574 }, { label: "Duy trì cân nặng", value: 403 }]} />
                </Card>
            </div>

            <Card title="Top 5 người dùng ứng dụng nhiều nhất" subtitle="Theo số lượt sử dụng (demo)">
                {(() => {
                    const topUsers = [
                        { name: "Nguyễn Văn A", email: "a@example.com", avatar: "https://i.pravatar.cc/100?img=12", uses: 342 },
                        { name: "Trần Thị B", email: "b@example.com", avatar: "https://i.pravatar.cc/100?img=32", uses: 318 },
                        { name: "Lê Văn C", email: "c@example.com", avatar: "https://i.pravatar.cc/100?img=24", uses: 297 },
                        { name: "Phạm Thu D", email: "d@example.com", avatar: "https://i.pravatar.cc/100?img=47", uses: 281 },
                        { name: "Đỗ Minh E", email: "e@example.com", avatar: "https://i.pravatar.cc/100?img=56", uses: 266 },
                    ];
                    return (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="py-2 pr-2">#</th>
                                        <th className="py-2 pr-2">Người dùng</th>
                                        <th className="py-2 pr-2 text-right">Lượt sử dụng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topUsers.map((u, i) => (
                                        <tr key={u.email} className="border-t border-slate-100">
                                            <td className="py-2 pr-2">
                                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                                                    <span className="font-medium text-slate-900">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 pr-2 text-right font-semibold">{u.uses.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}
            </Card>
        </div>
    );

    const NutriMealStatsPage = (() => {
        const isNum = (n: any) => typeof n === "number" && !Number.isNaN(n);
        const avg = (sum: number, count: number) => Math.round(sum / Math.max(1, count));

        let sumCal = 0,
            cCal = 0;
        let sumP = 0,
            cP = 0,
            sumC = 0,
            cC = 0,
            sumF = 0,
            cF = 0;

        meals.forEach((m) => {
            if (isNum(m.calories)) {
                sumCal += m.calories!;
                cCal++;
            }
            if (isNum(m.proteinG)) {
                sumP += m.proteinG!;
                cP++;
            }
            if (isNum(m.carbG)) {
                sumC += m.carbG!;
                cC++;
            }
            if (isNum(m.fatG)) {
                sumF += m.fatG!;
                cF++;
            }
        });

        const avgCal = avg(sumCal, cCal);
        const avgProtein = avg(sumP, cP);
        const avgCarb = avg(sumC, cC);
        const avgFat = avg(sumF, cF);

        const topCal = [...meals].filter((m) => isNum(m.calories)).sort((a, b) => (b.calories || 0) - (a.calories || 0)).slice(0, 10);
        const topProtein = [...meals].filter((m) => isNum(m.proteinG)).sort((a, b) => (b.proteinG || 0) - (a.proteinG || 0)).slice(0, 10);

        const totalMeals = meals.length;
        const hash = (s: string) => Array.from(s).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
        const newMealsThisWeek = Math.max(0, Math.min(12, Math.floor(totalMeals / 10) + 2));
        const manualCount = meals.filter((m) => Math.abs(hash(m.id)) % 3 !== 0).length;
        const scanAICount = totalMeals - manualCount;

        const withUsage = meals.map((m) => ({ meal: m, uses: 50 + (Math.abs(hash(m.id)) % 300) }));
        const top10Uses = withUsage.sort((a, b) => b.uses - a.uses).slice(0, 10);

        return (
            <div className="space-y-8">
                <div className="space-y-5">
                    <h1 className="text-2xl font-semibold">Thống kê dinh dưỡng</h1>

                    <div className="grid sm:grid-cols-3 xl:grid-cols-4 gap-5">
                        <StatCard icon={<Apple />} title="Calo TB / món" value={`${avgCal} kcal`} />
                        <StatCard icon={<Brain />} title="Protein TB / món" value={`${avgProtein} g`} />
                        <StatCard icon={<BarChart3 />} title="Carb TB / món" value={`${avgCarb} g`} />
                        <StatCard icon={<BarChart3 />} title="Fat TB / món" value={`${avgFat} g`} />
                    </div>

                    <div className="grid xl:grid-cols-2 gap-5">
                        <Card title="Top 10 món nhiều calo nhất" className="min-h-[480px]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-slate-500">
                                        <tr className="text-left">
                                            <th className="py-2 pr-2 w-10">#</th>
                                            <th className="py-2 pr-2">Tên món</th>
                                            <th className="py-2 pr-2 text-right">Calo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCal.map((m, i) => (
                                            <tr key={m.id} className="border-t border-slate-100">
                                                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                                                <td className="py-2 pr-2 font-medium text-slate-900">{m.name}</td>
                                                <td className="py-2 pr-2 text-right">{m.calories} kcal</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <Card title="Top 10 món nhiều protein nhất" className="min-h-[480px]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-slate-500">
                                        <tr className="text-left">
                                            <th className="py-2 pr-2 w-10">#</th>
                                            <th className="py-2 pr-2">Tên món</th>
                                            <th className="py-2 pr-2 text-right">Protein</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProtein.map((m, i) => (
                                            <tr key={m.id} className="border-t border-slate-100">
                                                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                                                <td className="py-2 pr-2 font-medium text-slate-900">{m.name}</td>
                                                <td className="py-2 pr-2 text-right">{m.proteinG} g</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="space-y-5">
                    <h1 className="text-2xl font-semibold">Thống kê món ăn</h1>

                    <div className="grid sm:grid-cols-3 xl:grid-cols-3 gap-5">
                        <StatCard icon={<UtensilsCrossed />} title="Món mới trong tuần" value={newMealsThisWeek} />
                        <StatCard icon={<Apple />} title="Tổng số món" value={totalMeals} />
                        <StatCard icon={<BarChart3 />} title="Nguồn món" value={`${manualCount} thủ công • ${scanAICount} Scan AI`} />
                    </div>

                    <div className="grid xl:grid-cols-2 gap-5">
                        <Card title="Nguồn món người dùng" subtitle="Phân tách theo cách tạo (demo)">
                            <MiniDonutChart items={[{ label: "Nhập thủ công", value: manualCount }, { label: "Scan AI", value: scanAICount }]} />
                        </Card>

                        <Card title="Top 10 món được log nhiều nhất" subtitle="Theo số lượt log (demo)" className="min-h-[480px]">
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
                                        {top10Uses.map((x, i) => (
                                            <tr key={x.meal.id} className="border-t border-slate-100">
                                                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                                                <td className="py-2 pr-2 font-medium text-slate-900">{x.meal.name}</td>
                                                <td className="py-2 pr-2 text-right font-semibold">{x.uses.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    })();

    // ===== Layout =====
    return (
        <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
            <style>{`
          .scrollbar-hide {-ms-overflow-style:none;scrollbar-width:none}
          .scrollbar-hide::-webkit-scrollbar{width:0;height:0;background:transparent}
        `}</style>

            {Header}

            <main className="flex-1 overflow-hidden px-6 py-6 min-h-0">
                <div className="flex h-full gap-4 min-h-0">
                    {Sidebar}
                    <section className="flex-1 relative overflow-auto scrollbar-hide min-h-0">
                        <div className="space-y-5 pb-10">
                            {tab === "overview" && OverviewPage}
                            {tab === "meals" && MealsPage}
                            {tab === "userStats" && UserStatsPage}
                            {tab === "nutritionStats" && NutriMealStatsPage}
                        </div>
                    </section>
                </div>
            </main>

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

            <footer className="text-center text-sm text-slate-500">
                © {new Date().getFullYear()} NutriCare Admin — Hành trình sức khỏe của bạn bắt đầu từ đây.
            </footer>
        </div>
    );
}

// ===== Helpers UI =====
function SidebarBtn({
    icon,
    children,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                "group relative w-full flex items-center rounded-xl px-3 py-2.5 transition-all text-sm",
                active ? "bg-white shadow-sm border border-slate-200 ring-1 ring-slate-200" : "hover:bg-white/60 border border-transparent",
            ].join(" ")}
        >
            <span
                className={[
                    "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-full",
                    "bg-gradient-to-b from-emerald-500 to-sky-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                ].join(" ")}
            />
            <span
                className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-slate-600 transition-all",
                    active
                        ? "bg-gradient-to-br from-emerald-500 to-sky-500 text-white border-transparent shadow-sm"
                        : "bg-slate-50 border-slate-200 group-hover:text-emerald-700",
                ].join(" ")}
            >
                {icon}
            </span>
            <span
                className={[
                    "ml-3 flex-1 text-left font-medium tracking-tight leading-[1.4]",
                    active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900",
                ].join(" ")}
            >
                {children}
            </span>
        </button>
    );
}

function LogoutButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={[
                "group relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5",
                "border border-slate-200 bg-white/70 backdrop-blur text-slate-800",
                "shadow-sm transition-all hover:bg-white hover:shadow-md",
                "focus:outline-none focus:ring-4 focus:ring-emerald-100 active:scale-[0.98]",
            ].join(" ")}
            title="Đăng xuất"
            aria-label="Đăng xuất"
        >
            <span
                className={[
                    "pointer-events-none absolute inset-0 -z-10 rounded-xl",
                    "bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-sky-400/0",
                    "opacity-0 transition-opacity group-hover:opacity-100",
                ].join(" ")}
            />
            <span className={["inline-grid h-6 w-6 place-items-center rounded-lg", "bg-slate-900 text-white transition-transform", "group-hover:scale-105"].join(" ")}>
                <LogOut size={16} />
            </span>
            <span className="font-semibold">Đăng xuất</span>
        </button>
    );
}

// ===== Form bits =====
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
            onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)}
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
function ImagePicker({ value, onPicked, onClear }: { value?: string; onPicked: (dataUrl: string) => void; onClear?: () => void }) {
    const ref = useRef<HTMLInputElement | null>(null);
    const pick = () => ref.current?.click();
    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            onPicked(String(reader.result));
        };
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
                            <button type="button" onClick={onClear} className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100">
                                Xoá ảnh
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button type="button" onClick={pick} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
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
                    <ImagePicker value={draft.image} onPicked={(dataUrl) => setDraft({ ...draft, image: dataUrl })} onClear={() => setDraft({ ...draft, image: "" })} />
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
                    <Select value={draft.servingUnit} onChange={(v) => setDraft({ ...draft, servingUnit: v })} placeholder="Chọn đơn vị" options={["tô", "chén", "ly", "đĩa", "phần", "cốc", "cái", "miếng"]} />
                </div>
                <div className="space-y-2">
                    <Label>Trọng lượng 1 đơn vị</Label>
                    <div className="relative">
                        <TextInput type="number" value={draft.unitWeightGram} onChange={(v) => setDraft({ ...draft, unitWeightGram: v })} placeholder="gram" />
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
