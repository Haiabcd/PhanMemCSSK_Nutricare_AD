import React from "react";
import { Apple, Brain, BarChart3, UtensilsCrossed } from "lucide-react";

/** Kiểu dữ liệu chỉ cần những trường dùng trong thống kê */
export type Meal = {
    id: string;
    name: string;
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
};

/** ------- UI bits gọn dùng riêng cho NutriMealStats ------- */
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

function MiniDonutChart({ items }: { items: { label: string; value: number }[] }) {
    const total = Math.max(1, items.reduce((s, i) => s + i.value, 0));
    const radius = 70, stroke = 26, size = 180;
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

/** --------- Component chính --------- */
export default function NutriMealStats({ meals }: { meals: Meal[] }) {
    const isNum = (n: any) => typeof n === "number" && !Number.isNaN(n);
    const avg = (sum: number, count: number) => Math.round(sum / Math.max(1, count));

    let sumCal = 0, cCal = 0;
    let sumP = 0, cP = 0, sumC = 0, cC = 0, sumF = 0, cF = 0;

    meals.forEach((m) => {
        if (isNum(m.calories)) { sumCal += m.calories!; cCal++; }
        if (isNum(m.proteinG)) { sumP += m.proteinG!; cP++; }
        if (isNum(m.carbG)) { sumC += m.carbG!; cC++; }
        if (isNum(m.fatG)) { sumF += m.fatG!; cF++; }
    });

    const avgCal = avg(sumCal, cCal);
    const avgProtein = avg(sumP, cP);
    const avgCarb = avg(sumC, cC);
    const avgFat = avg(sumF, cF);

    const topCal = [...meals]
        .filter((m) => isNum(m.calories))
        .sort((a, b) => (b.calories || 0) - (a.calories || 0))
        .slice(0, 10);

    const topProtein = [...meals]
        .filter((m) => isNum(m.proteinG))
        .sort((a, b) => (b.proteinG || 0) - (a.proteinG || 0))
        .slice(0, 10);

    const totalMeals = meals.length;

    // Tạo số liệu demo cho nguồn món và lượt log
    const hash = (s: string) =>
        Array.from(s).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);

    const newMealsThisWeek = Math.max(0, Math.min(12, Math.floor(totalMeals / 10) + 2));
    const manualCount = meals.filter((m) => Math.abs(hash(m.id)) % 3 !== 0).length;
    const scanAICount = totalMeals - manualCount;

    const withUsage = meals.map((m) => ({ meal: m, uses: 50 + (Math.abs(hash(m.id)) % 300) }));
    const top10Uses = withUsage.sort((a, b) => b.uses - a.uses).slice(0, 10);

    return (
        <div className="space-y-8">
            {/* ----- Thống kê dinh dưỡng ----- */}
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

            {/* ----- Thống kê món ăn ----- */}
            <div className="space-y-5">
                <h1 className="text-2xl font-semibold">Thống kê món ăn</h1>

                <div className="grid sm:grid-cols-3 xl:grid-cols-3 gap-5">
                    <StatCard icon={<UtensilsCrossed />} title="Món mới trong tuần" value={newMealsThisWeek} />
                    <StatCard icon={<Apple />} title="Tổng số món" value={totalMeals} />
                    <StatCard icon={<BarChart3 />} title="Nguồn món" value={`${manualCount} thủ công • ${scanAICount} Scan AI`} />
                </div>

                <div className="grid xl:grid-cols-2 gap-5">
                    <Card title="Nguồn món người dùng" subtitle="Phân tách theo cách tạo (demo)">
                        <MiniDonutChart items={[
                            { label: "Nhập thủ công", value: manualCount },
                            { label: "Scan AI", value: scanAICount },
                        ]} />
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
}
