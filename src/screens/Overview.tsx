import React, { useEffect, useMemo, useState } from "react";
import { Users2, Apple } from "lucide-react";
import { fetchOverview } from "../service/overview.service";
import type {
    RawOverview, DailyCountDto, MonthlyCountDto, OverviewUi, Meal
} from "../types/overview";
import "../css/Overview.css";

function StatCard({
    icon, title, value, hint,
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
    title, subtitle, children, className,
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

/* ---------------- Charts ---------------- */
function MiniLineChart({
    data, labels, height = 240,
}: { data: number[]; labels: string[]; height?: number }) {
    const padTop = 8;
    const padBottom = 48;
    const w = 1000;

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
    const axisY = height - padBottom;

    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-44" overflow="visible">
            {/* trục dưới */}
            <line x1="0" y1={axisY} x2={w} y2={axisY} className="axis-line" />

            {/* vùng nền dưới đường */}
            <polyline points={`0,${axisY} ${poly} ${w},${axisY}`} className="area-fill" />

            {/* đường chính */}
            <polyline points={poly} className="line-primary" />

            {/* điểm */}
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" className="dot-primary" />
            ))}

            {/* nhãn dưới */}
            {safeLabels.map((lb, i) => {
                const x = i * step;
                return (
                    <text key={i} x={x} y={height - 10} textAnchor="middle" className="label-small">
                        {lb}
                    </text>
                );
            })}
        </svg>
    );
}

function MiniBarChart({
    labels, data, height = 220,
}: { labels: string[]; data: number[]; height?: number }) {
    const width = 560, padX = 28, padBottom = 30, padTop = 16;
    const maxData = Math.max(...data, 1);
    const niceStep = Math.max(1, Math.ceil(maxData / 4));
    const niceMax = Math.ceil(maxData / niceStep) * niceStep;

    const slotW = (width - padX * 2) / data.length;
    const barW = Math.min(28, slotW * 0.6);

    const yScale = (v: number) => height - padBottom - (v / niceMax) * (height - padBottom - padTop);
    const gridVals = Array.from({ length: 5 }, (_, i) => i * niceStep);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" height={height}>
            {gridVals.map((gv, i) => {
                const y = yScale(gv);
                return (
                    <g key={i}>
                        <line x1={padX} y1={y} x2={width - padX} y2={y} className="grid-line" />
                        <text x={padX - 6} y={y + 4} textAnchor="end" className="grid-tick">
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
                        <text x={cx} y={y - 6} textAnchor="middle" className="bar-value">
                            {v}
                        </text>
                        <text x={cx} y={height - 10} textAnchor="middle" className="bar-xlabel">
                            {labels[i]}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function MiniDonutChart({ items }: { items: { label: string; value: number }[] }) {
    const rawTotal = items.reduce((s, i) => s + i.value, 0);
    const denom = rawTotal === 0 ? 1 : rawTotal;
    const radius = 84, stroke = 28, size = 220;
    let acc = 0;

    return (
        <div className="flex items-center gap-5">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
                {rawTotal > 0 && items.map((it, idx) => {
                    const frac = it.value / denom;
                    const dash = 2 * Math.PI * radius * frac;
                    const gap = 2 * Math.PI * radius - dash;
                    const rot = (acc / denom) * 360;
                    acc += it.value;
                    const p = idx % 6;
                    return (
                        <circle
                            key={idx}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            className={`palette-${p}-stroke`}
                            strokeWidth={stroke}
                            strokeDasharray={`${dash} ${gap}`}
                            transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rot} ${size / 2} ${size / 2})`}
                            strokeLinecap="butt"
                        />
                    );
                })}
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="donut-number">
                    {rawTotal}
                </text>
            </svg>

            <div className="text-sm space-y-2">
                {items.map((it, i) => {
                    const p = i % 6;
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span className={`legend-swatch palette-${p}-bg`} />
                            <span className="legend-label">{it.label}</span>
                            <span className="ml-auto legend-value">{it.value}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------------- Helpers ---------------- */
const toShortVN = (full: string) => {
    const f = (full || "").trim().toLowerCase();
    if (!f) return "";
    if (f.includes("chủ nhật")) return "CN";
    const m = f.match(/thứ\s*(\d+)/);
    return m ? `T${m[1]}` : "";
};
const shortFromDate = (iso: string) => {
    try {
        const wd = new Date(iso + "T00:00:00").getDay();
        return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][wd] || "";
    } catch {
        return "";
    }
};
const monthLabelVN = (m: number) => `Th ${m}`;

/* ---------------- Chuẩn hoá RawOverview -> OverviewUi ---------------- */
function normalize(raw: RawOverview): OverviewUi {
    const dailyRaw = raw.dailyCount || [];
    const defaultWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    const dailyCount: DailyCountDto[] = dailyRaw.map((d, i) => {
        const fromLabel = toShortVN(d.dayLabel);
        const fromDate = shortFromDate(d.date);
        const shortLabel = fromLabel || fromDate || defaultWeek[i] || "";
        return { date: d.date, count: d.total ?? 0, shortLabel };
    });

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

/* ---------------- Overview component (dùng service) ---------------- */
export default function Overview(_props: { meals: Meal[] }) {
    void _props;
    const [ov, setOv] = useState<OverviewUi | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ac = new AbortController();
        setLoading(true);

        fetchOverview(ac.signal)
            .then((res) => setOv(normalize(res)))
            .catch((err: unknown) => {
                console.error("Overview API error:", err);
                setOv(null);
            })
            .finally(() => setLoading(false));

        return () => ac.abort();
    }, []);

    const totalUsers = ov?.totalUsers ?? "…";
    const totalFoods = ov?.totalFoods ?? "…";

    const lineLabels = useMemo(
        () => (ov?.dailyCount ?? []).map((d) => d.shortLabel || ""),
        [ov]
    );
    const lineData = useMemo(
        () => (ov?.dailyCount ?? []).map((d) => d.count),
        [ov]
    );

    const barLabels = useMemo(
        () => (ov?.monthlyCount ?? []).map((m) => m.monthLabel),
        [ov]
    );
    const barData = useMemo(
        () => (ov?.monthlyCount ?? []).map((m) => m.count),
        [ov]
    );

    const donutUserInput = useMemo(
        () => [
            { label: "Quét (scan)", value: ov?.getCountBySource.SCAN ?? 0 },
            { label: "Nhập thủ công", value: ov?.getCountBySource.MANUAL ?? 0 },
        ],
        [ov]
    );

    const donutByMealSlot = useMemo(
        () => [
            { label: "Bữa sáng", value: ov?.getPlanLogCountByMealSlot.BREAKFAST ?? 0 },
            { label: "Bữa trưa", value: ov?.getPlanLogCountByMealSlot.LUNCH ?? 0 },
            { label: "Bữa chiều", value: ov?.getPlanLogCountByMealSlot.DINNER ?? 0 },
            { label: "Bữa phụ", value: ov?.getPlanLogCountByMealSlot.SNACK ?? 0 },
        ],
        [ov]
    );

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
                        labels={barLabels.length ? barLabels : Array.from({ length: 12 }, (_, i) => `Th ${i + 1}`)}
                        data={barData.length ? barData : new Array(12).fill(0)}
                    />
                </Card>
            </div>

            <div className="grid 2xl:grid-cols-2 gap-5">
                <Card title="Tỉ lệ bữa ăn (Theo log kế hoạch)">
                    <MiniDonutChart items={donutByMealSlot} />
                </Card>

                <Card title="Tỉ lệ nguồn nhập (Người dùng)">
                    <MiniDonutChart items={donutUserInput} />
                </Card>
            </div>
        </div>
    );
}
