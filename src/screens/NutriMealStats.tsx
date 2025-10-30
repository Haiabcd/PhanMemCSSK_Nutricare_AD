import React, { useEffect, useMemo, useState } from "react";
import { Apple, CheckCircle2, Flame, Leaf } from "lucide-react";
import { fetchOverviewNutrition } from "../service/overview.service";
import type { EnergyHistogramDto, OverviewNutritionDto } from "../types/types";
import "../css/NutriMealStats.css";

/** ------- UI bits ------- */
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
                <div className="font-semibold text-lg">{title}</div>
                {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

/** ------- Biểu đồ phân bố năng lượng (không dùng inline style) ------- */
function EnergyHistogram({ data }: { data: EnergyHistogramDto | null }) {
    const bins = data?.bins ?? [];
    const max = data?.maxBinCount ?? Math.max(1, ...bins.map((b) => b.count));

    if (!data || bins.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-slate-500">
                Chưa có dữ liệu.
            </div>
        );
    }

    return (
        <div className="h-64 flex items-end gap-5">
            {bins.map((b) => {
                const rawPct = max ? (b.count / max) * 100 : 0;
                const pct = Math.max(0, Math.min(100, Math.round(rawPct / 5) * 5)); // làm tròn bước 5%
                return (
                    <div key={b.label} className="h-full flex-1 flex flex-col items-center justify-end">
                        <div
                            className={`w-full rounded-t-xl bg-linear-to-t from-green-400 to-green-600 shadow-sm transition-[height] duration-500 h-pct-${pct}`}
                            title={`${b.label}: ${b.count} món`}
                        />
                        <div className="text-sm text-slate-600 mt-2 font-medium">{b.label}</div>
                        <div className="text-xs text-slate-400">{b.count} món</div>
                    </div>
                );
            })}
        </div>
    );
}

export default function NutriMealStats() {
    const [data, setData] = useState<OverviewNutritionDto | null>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const ac = new AbortController();
        setLoading(true);

        fetchOverviewNutrition(ac.signal)
            .then((res) => {
                setData(res);
            })
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                console.error("Lỗi tải thống kê dinh dưỡng:", msg);
            })
            .finally(() => setLoading(false));

        return () => ac.abort();
    }, []);

    const completenessText = useMemo(() => {
        if (!data) return "";
        return `Đủ macro: ${data.countFoodsWithComplete5}/${data.totalFoods}`;
    }, [data]);

    const missingCount = useMemo(() => {
        if (!data) return 0;
        return Math.max(0, data.totalFoods - data.countFoodsWithComplete5);
    }, [data]);

    return (
        <div className="space-y-8">
            <div className="space-y-5">
                <div>
                    <h1 className="text-2xl font-semibold">Quản lý dinh dưỡng</h1>
                    <p className="text-slate-500 text-sm">
                        Tổng quan về chất lượng dữ liệu dinh dưỡng của các món ăn trong hệ thống.
                    </p>
                </div>

                <div className={`grid sm:grid-cols-3 xl:grid-cols-4 gap-5 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
                    <StatCard
                        icon={<CheckCircle2 size={18} />}
                        title="Độ hoàn thiện dữ liệu"
                        value={
                            data
                                ? `${Number.isInteger(data.getDataCompletenessRate)
                                    ? data.getDataCompletenessRate
                                    : data.getDataCompletenessRate.toFixed(2)
                                } %`
                                : "—"
                        }
                        hint={data ? completenessText : ""}
                    />
                    <StatCard
                        icon={<Apple size={18} />}
                        title="Món đủ thông tin dinh dưỡng"
                        value={data ? `${data.countFoodsWithComplete5}/${data.totalFoods}` : "—"}
                        hint={data ? `Thiếu: ${missingCount} món` : ""}
                    />
                    <StatCard
                        icon={<Flame size={18} />}
                        title="Món năng lượng cao"
                        value={data?.countFoodsOver800Kcal ?? "—"}
                        hint="> 800 kcal"
                    />
                    <StatCard
                        icon={<Leaf size={18} />}
                        title="Món năng lượng thấp"
                        value={data?.countFoodsUnder300Kcal ?? "—"}
                        hint="< 300 kcal"
                    />
                </div>

                <Card
                    title="Phân bố năng lượng món ăn (kcal)"
                    subtitle="Thể hiện số lượng món ăn theo dải năng lượng"
                    className="min-h-[420px]"
                >
                    {loading ? (
                        <div className="h-64 grid grid-cols-8 gap-5 animate-pulse">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-full h-40 bg-slate-100 rounded-xl" />
                                    <div className="h-4 w-16 bg-slate-100 rounded" />
                                    <div className="h-3 w-10 bg-slate-100 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EnergyHistogram data={data?.getEnergyHistogramFixed ?? null} />
                    )}
                </Card>

                <div className="grid xl:grid-cols-2 gap-5">
                    <Card title="Top 10 món nhiều calo nhất" className="min-h-[480px]">
                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : (
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
                                        {(data?.getTop10HighestKcalFoods ?? []).map((m, i) => (
                                            <tr key={`${m.name}-${i}`} className="border-t border-slate-100">
                                                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                                                <td className="py-2 pr-2 font-medium text-slate-900">{m.name}</td>
                                                <td className="py-2 pr-2 text-right">{m.kcal} kcal</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <Card title="Top 10 món nhiều protein nhất" className="min-h-[480px]">
                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : (
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
                                        {(data?.getTop10HighestProteinFoods ?? []).map((m, i) => (
                                            <tr key={`${m.name}-${i}`} className="border-t border-slate-100">
                                                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                                                <td className="py-2 pr-2 font-medium text-slate-900">{m.name}</td>
                                                <td className="py-2 pr-2 text-right">{m.proteinG} g</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
