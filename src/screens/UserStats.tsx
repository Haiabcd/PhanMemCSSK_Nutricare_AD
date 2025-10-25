import React from "react";
import { Users2, LogIn } from "lucide-react";

/** ------- UI bits gọn dùng riêng cho UserStats ------- */
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
                            <title>{`${labels[i]}: ${v}`}</title>
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

/** ------- UserStats (page) ------- */
export default function UserStats() {
    const topUsers = [
        { name: "Nguyễn Văn A", email: "a@example.com", avatar: "https://i.pravatar.cc/100?img=12", uses: 342 },
        { name: "Trần Thị B", email: "b@example.com", avatar: "https://i.pravatar.cc/100?img=32", uses: 318 },
        { name: "Lê Văn C", email: "c@example.com", avatar: "https://i.pravatar.cc/100?img=24", uses: 297 },
        { name: "Phạm Thu D", email: "d@example.com", avatar: "https://i.pravatar.cc/100?img=47", uses: 281 },
        { name: "Đỗ Minh E", email: "e@example.com", avatar: "https://i.pravatar.cc/100?img=56", uses: 266 },
    ];

    return (
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
                    <MiniDonutChart
                        items={[
                            { label: "Tăng cân", value: 312 },
                            { label: "Giảm cân", value: 574 },
                            { label: "Duy trì cân nặng", value: 403 },
                        ]}
                    />
                </Card>
            </div>

            <Card title="Top 5 người dùng ứng dụng nhiều nhất" subtitle="Theo số lượt sử dụng (demo)">
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
            </Card>
        </div>
    );
}
