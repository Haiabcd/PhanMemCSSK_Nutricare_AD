import React from "react";
import { Users2, Apple, BarChart3 } from "lucide-react";

// Kiểu tối giản cho Meal (đủ dùng cho thống kê ở trang Tổng quan)
type Meal = {
    id: string;
    name: string;
    slots: string[];
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
};

// ---- UI nhỏ gọn dùng riêng cho Overview (copy tối thiểu để tránh phụ thuộc) ----
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
        <div
            className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm ${className ?? ""
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

// Chart mini (SVG) — phiên bản gọn cho Overview
function MiniLineChart({
    data,
    labels,
    height = 180,
}: {
    data: number[];
    labels: string[];
    height?: number;
}) {
    const w = 560;
    const max = Math.max(...data, 1);
    const step = w / Math.max(1, data.length - 1);
    const pts = data.map((v, i) => ({
        x: i * step,
        y: height - (v / max) * (height - 28) - 8,
    }));
    const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-44">
            <line
                x1="0"
                y1={height - 22}
                x2={w}
                y2={height - 22}
                className="stroke-slate-200"
            />
            <polyline
                points={`0,${height - 22} ${poly} ${w},${height - 22}`}
                fill="rgba(34,197,94,0.08)"
            />
            <polyline points={poly} fill="none" className="stroke-2" style={{ stroke: "#16a34a" }} />
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" style={{ fill: "#16a34a" }} />
            ))}
            {labels.map((lb, i) => {
                const x = i * step;
                return (
                    <text
                        key={i}
                        x={x}
                        y={height - 6}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px]"
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

    const yScale = (v: number) =>
        height - padBottom - (v / niceMax) * (height - padBottom - padTop);
    const gridVals = Array.from({ length: 5 }, (_, i) => i * niceStep);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
            {gridVals.map((gv, i) => {
                const y = yScale(gv);
                return (
                    <g key={i}>
                        <line
                            x1={padX}
                            y1={y}
                            x2={width - padX}
                            y2={y}
                            className="stroke-slate-200"
                        />
                        <text
                            x={padX - 6}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-slate-400 text-[10px]"
                        >
                            {gv}
                        </text>
                    </g>
                );
            })}

            {data.map((v, i) => {
                const cx = padX + i * slotW + slotW / 2;
                const barH = Math.max(
                    2,
                    (v / niceMax) * (height - padBottom - padTop)
                );
                const x = cx - barW / 2;
                const y = height - padBottom - barH;

                return (
                    <g key={i}>
                        <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={barH}
                            rx="6"
                            className="fill-green-500/80"
                        >
                            <title>{`Tháng ${labels[i]}: ${v} món`}</title>
                        </rect>
                        <text
                            x={cx}
                            y={y - 6}
                            textAnchor="middle"
                            className="fill-slate-600 text-[10px] font-medium"
                        >
                            {v}
                        </text>
                        <text
                            x={cx}
                            y={height - 10}
                            textAnchor="middle"
                            className="fill-slate-500 text-[10px]"
                        >
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
                        <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{ background: palette[i % palette.length] }}
                        />
                        <span className="text-slate-600">{it.label}</span>
                        <span className="ml-auto font-medium">{it.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---- Overview component ----
export default function Overview({ meals }: { meals: Meal[] }) {
    const totalMeals = meals.length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold mb-1">Tổng quan</h1>
                <p className="text-slate-500 text-sm">
                    Toàn cảnh người dùng, món ăn và kế hoạch dinh dưỡng.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <StatCard icon={<Users2 />} title="Tổng người dùng" value={1289} hint="Demo – thay bằng dữ liệu BE" />
                <StatCard icon={<Apple />} title="Tổng số món ăn" value={totalMeals} />
                <StatCard icon={<BarChart3 />} title="Kế hoạch dinh dưỡng đã tạo" value={112} hint="Demo" />
            </div>

            <div className="grid xl:grid-cols-2 gap-5">
                <Card title="Tăng trưởng người dùng" subtitle="7 ngày gần nhất">
                    <MiniLineChart
                        data={[120, 142, 138, 156, 149, 171, 189]}
                        labels={["T2", "T3", "T4", "T5", "T6", "T7", "CN"]}
                    />
                </Card>

                <Card title="Món ăn thêm mới" subtitle="12 tháng gần đây">
                    <MiniBarChart
                        labels={[
                            "Th 1",
                            "Th 2",
                            "Th 3",
                            "Th 4",
                            "Th 5",
                            "Th 6",
                            "Th 7",
                            "Th 8",
                            "Th 9",
                            "Th 10",
                            "Th 11",
                            "Th 12",
                        ]}
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
}
