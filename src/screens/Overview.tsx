import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users2, Apple } from "lucide-react";

// ====== Config API ======
const API_URL = "http://localhost:8080/overview";

// ====== Kiểu tối giản cho Meal (đủ dùng cho thống kê ở trang Tổng quan) ======
type Meal = {
    id: string;
    name: string;
    slots: string[];
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
};

// ====== RAW BE types ======
type RawDaily = { dayLabel: string; date: string; total: number };
type RawMonthly = { monthLabel: string; month: number; total: number; yearMonth: string };
type RawOverview = {
    totalUsers: number;
    totalFoods: number;
    dailyCount: RawDaily[];
    monthlyCount: RawMonthly[];
    getCountBySource: { manual?: number; scan?: number; plan?: number };
    getPlanLogCountByMealSlot: Record<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK", number>;
};

// ====== UI-normalized types ======
type DailyCountDto = { date: string; count: number; shortLabel: string };
type MonthlyCountDto = { month: number; count: number; monthLabel: string };
type OverviewUi = {
    totalUsers: number;
    totalFoods: number;
    dailyCount: DailyCountDto[];
    monthlyCount: MonthlyCountDto[];
    getCountBySource: { PLAN: number; SCAN: number; MANUAL: number };
    getPlanLogCountByMealSlot: Record<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK", number>;
};

// ---- UI components ----
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

function MiniLineChart({
    data,
    labels,
    height = 240,
}: {
    data: number[];
    labels: string[];
    height?: number;
}) {
    // === padding để không bị che chữ ===
    const padTop = 8;
    const padBottom = 48; // chừa đáy nhiều hơn cho nhãn
    const w = 1000;

    // nhãn an toàn: nếu rỗng -> T2..CN
    const defaultWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const safeLabels =
        labels && labels.length === data.length
            ? labels.map((lb, i) => lb?.trim() || defaultWeek[i] || "")
            : defaultWeek.slice(0, data.length);

    const max = Math.max(...data, 1);
    const step = w / Math.max(1, data.length - 1);
    const innerH = height - padTop - padBottom;

    const pts = data.map((v, i) => ({
        x: i * step,
        y: padTop + innerH - (v / max) * innerH,
    }));
    const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const axisY = height - padBottom; // trục ngang

    return (
        <svg
            viewBox={`0 0 ${w} ${height}`}
            className="w-full h-44"
            // rất quan trọng để không clip text
            overflow="visible"
        >
            {/* trục dưới */}
            <line x1="0" y1={axisY} x2={w} y2={axisY} className="stroke-slate-200" />

            {/* vùng nền dưới đường */}
            <polyline
                points={`0,${axisY} ${poly} ${w},${axisY}`}
                fill="rgba(34,197,94,0.08)"
            />

            {/* đường */}
            <polyline
                points={poly}
                fill="none"
                className="stroke-2"
                style={{ stroke: "#16a34a" }}
            />

            {/* điểm */}
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" style={{ fill: "#16a34a" }} />
            ))}

            {/* nhãn dưới — luôn hiển thị */}
            {safeLabels.map((lb, i) => {
                const x = i * step;
                return (
                    <text
                        key={i}
                        x={x}
                        y={height - 10}                 // nằm trong viewBox
                        textAnchor="middle"
                        style={{ fill: "#64748b", fontSize: 11 }}
                    >
                        {lb}
                    </text>
                );
            })}
        </svg>
    );
}


function MiniBarChart({
    labels,
    data,
    height = 220,
}: {
    labels: string[];
    data: number[];
    height?: number;
}) {
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
                        <text x={padX - 6} y={y + 4} textAnchor="end" style={{ fill: "#94a3b8", fontSize: 10 }}>
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
                        <text x={cx} y={y - 6} textAnchor="middle" style={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}>
                            {v}
                        </text>
                        <text x={cx} y={height - 10} textAnchor="middle" style={{ fill: "#64748b", fontSize: 10 }}>
                            {labels[i]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function MiniDonutChart({ items }: { items: { label: string; value: number }[] }) {
    const rawTotal = items.reduce((s, i) => s + i.value, 0); // tổng thật
    const denom = rawTotal === 0 ? 1 : rawTotal;            // mẫu số an toàn khi tính cung
    const radius = 84, stroke = 28, size = 220;
    let acc = 0;
    const palette = ["#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

    return (
        <div className="flex items-center gap-5">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* vòng nền xám */}
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />

                {/* chỉ vẽ các cung màu nếu có dữ liệu > 0 */}
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
                                stroke={palette[idx % palette.length]}
                                strokeWidth={stroke}
                                strokeDasharray={`${dash} ${gap}`}
                                transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rot} ${size / 2} ${size / 2})`}
                                strokeLinecap="butt"
                            />
                        );
                    })}

                {/* số ở giữa = tổng thật (có thể là 0) */}
                <text
                    x="50%" y="50%"
                    dominantBaseline="middle" textAnchor="middle"
                    style={{ fill: "#334155", fontSize: 12 }}
                >
                    {rawTotal}
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


// ====== Helpers ======
const toShortVN = (full: string) => {
    const f = (full || "").trim().toLowerCase();
    if (!f) return "";
    if (f.includes("chủ nhật")) return "CN";
    const m = f.match(/thứ\s*(\d+)/); // bắt cả 2 chữ số phòng "Thứ 10" nếu có
    return m ? `T${m[1]}` : "";
};
const shortFromDate = (iso: string) => {
    try {
        const wd = new Date(iso + "T00:00:00").getDay(); // 0..6
        return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][wd] || "";
    } catch {
        return "";
    }
};
const monthLabelVN = (m: number) => `Th ${m}`;

// Chuẩn hoá RawOverview -> OverviewUi
function normalize(raw: RawOverview): OverviewUi {
    // daily: ưu tiên dayLabel -> T2..CN; fallback từ date; cuối cùng fallback theo vị trí
    const dailyRaw = raw.dailyCount || [];
    const defaultWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    const dailyCount: DailyCountDto[] = dailyRaw.map((d, i) => {
        const fromLabel = toShortVN(d.dayLabel);
        const fromDate = shortFromDate(d.date);
        const shortLabel = fromLabel || fromDate || defaultWeek[i] || "";
        return { date: d.date, count: d.total ?? 0, shortLabel };
    });

    // monthly: đủ 12 tháng
    const months: MonthlyCountDto[] = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 0,
        monthLabel: monthLabelVN(i + 1),
    }));
    (raw.monthlyCount || []).forEach((m) => {
        const idx = (m.month ?? 0) - 1;
        if (idx >= 0 && idx < 12) {
            months[idx] = {
                month: m.month,
                count: m.total ?? 0,
                monthLabel: m.monthLabel || monthLabelVN(m.month),
            };
        }
    });

    // nguồn nhập
    const manual = raw.getCountBySource?.manual ?? 0;
    const scan = raw.getCountBySource?.scan ?? 0;
    const plan = raw.getCountBySource?.plan ?? 0;

    return {
        totalUsers: raw.totalUsers ?? 0,
        totalFoods: raw.totalFoods ?? 0,
        dailyCount,
        monthlyCount: months,
        getCountBySource: { PLAN: plan, SCAN: scan, MANUAL: manual },
        getPlanLogCountByMealSlot:
            raw.getPlanLogCountByMealSlot || { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACK: 0 },
    };
}

// ---- Overview component ----
export default function Overview({ meals }: { meals: Meal[] }) {
    const [ov, setOv] = useState<OverviewUi | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        axios
            .get<RawOverview>(API_URL, { timeout: 10000 })
            .then((res) => {
                if (!alive) return;
                setOv(normalize(res.data));
            })
            .catch((e) => {
                console.error("Overview API error:", e);
                if (alive) setOv(null);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const totalUsers = ov?.totalUsers ?? "—";
    const totalFoods = ov?.totalFoods ?? "—";

    // Line: tăng trưởng người dùng 7 ngày (giữ T2..CN)
    const lineLabels: string[] = (ov?.dailyCount ?? []).map((d) => d.shortLabel || "");
    const lineData: number[] = (ov?.dailyCount ?? []).map((d) => d.count);

    // Bar: 12 tháng
    const barLabels = (ov?.monthlyCount ?? []).map((m) => m.monthLabel);
    const barData = (ov?.monthlyCount ?? []).map((m) => m.count);

    // Donut: nguồn nhập (BE)
    const donutUserInput = [
        { label: "Quét (scan)", value: ov?.getCountBySource.SCAN ?? 0 },
        { label: "Nhập thủ công", value: ov?.getCountBySource.MANUAL ?? 0 },
        { label: "Theo kế hoạch", value: ov?.getCountBySource.PLAN ?? 0 },
    ];

    // Donut: bữa ăn theo LOG (BE)
    const donutByMealSlot = [
        { label: "Bữa sáng", value: ov?.getPlanLogCountByMealSlot.BREAKFAST ?? 0 },
        { label: "Bữa trưa", value: ov?.getPlanLogCountByMealSlot.LUNCH ?? 0 },
        { label: "Bữa chiều", value: ov?.getPlanLogCountByMealSlot.DINNER ?? 0 },
        { label: "Bữa phụ", value: ov?.getPlanLogCountByMealSlot.SNACK ?? 0 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold mb-1">Tổng quan</h1>
                <p className="text-slate-500 text-sm">Toàn cảnh người dùng, món ăn và kế hoạch dinh dưỡng.</p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-5">
                <StatCard icon={<Users2 />} title="Tổng người dùng" value={loading ? "…" : totalUsers} hint="Tính toàn hệ thống" />
                <StatCard icon={<Apple />} title="Tổng số món ăn" value={loading ? "…" : totalFoods} hint="Trong CSDL NutriCare" />
            </div>

            <div className="grid 2xl:grid-cols-2 gap-5">
                <Card title="Tăng trưởng người dùng" subtitle="7 ngày gần nhất">
                    <MiniLineChart
                        data={lineData.length ? lineData : [0, 0, 0, 0, 0, 0, 0]}
                        labels={
                            lineLabels.length && lineLabels.some((x) => x)
                                ? lineLabels
                                : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
                        }
                    />
                </Card>

                <Card title="Món ăn thêm mới" subtitle="12 tháng gần đây">
                    <MiniBarChart
                        labels={barLabels.length ? barLabels : Array.from({ length: 12 }, (_, i) => monthLabelVN(i + 1))}
                        data={barData.length ? barData : new Array(12).fill(0)}
                    />
                </Card>
            </div>

            <div className="grid 2xl:grid-cols-2 gap-5">
                <Card title="Tỉ lệ bữa ăn (Theo log kế hoạch từ BE)">
                    <MiniDonutChart items={donutByMealSlot} />
                </Card>

                <Card title="Tỉ lệ nguồn nhập (Người dùng)">
                    <MiniDonutChart items={donutUserInput} />
                </Card>
            </div>
        </div>
    );
}