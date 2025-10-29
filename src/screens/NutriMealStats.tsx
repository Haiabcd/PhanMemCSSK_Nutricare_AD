import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Apple, CheckCircle2, Flame, Leaf } from "lucide-react";

/** Kiểu dữ liệu chỉ cần những trường dùng trong thống kê */
export type Meal = {
    id: string;
    name: string;
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
};

/** BE trả về cho 4 ô chất lượng dữ liệu */
type NutritionDataQuality = {
    totalFoods: number;
    completeMacros: number;
    missingMacros: number;
    highEnergyFoods: number;
    lowEnergyFoods: number;
    completenessRate: number;
};

/** ===== Histogram API types ===== */
type EnergyBin = {
    label: string;
    minKcal: number | null;
    maxKcal: number | null;
    count: number;
};
type EnergyHistogramDto = {
    bins: EnergyBin[];
    total: number;
    maxBinCount: number;
};

const API_DQ = "http://localhost:8080/api/admin/stats/nutrition/data-quality";
const API_HISTO = "http://localhost:8080/overview/energy-histogram";

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
        <div
            className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm ${className ?? ""}`}
        >
            <div className="flex items-baseline justify-between">
                <div className="font-semibold text-lg">{title}</div>
                {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

/** ------- Biểu đồ phân bố năng lượng (fetch từ BE) ------- */
function EnergyHistogramFromAPI() {
    const [data, setData] = useState<EnergyHistogramDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setErr(null);

        axios
            .get<EnergyHistogramDto>(API_HISTO, { timeout: 10000 })
            .then((res) => {
                if (!cancelled) setData(res.data);
            })
            .catch((e) => {
                if (!cancelled) {
                    setErr(
                        axios.isAxiosError(e)
                            ? e.response?.data?.message || e.message
                            : String(e)
                    );
                }
            })
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, []);

    const bins = data?.bins ?? [];
    const max = data?.maxBinCount ?? Math.max(1, ...bins.map((b) => b.count));

    return (
        <div className="w-full pt-2 min-h-[280px]">
            {err && (
                <div className="p-3 mb-3 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                    Không tải được biểu đồ: {err}
                </div>
            )}

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
            ) : bins.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500">
                    Chưa có dữ liệu.
                </div>
            ) : (
                <div className="h-64 flex items-end gap-5">
                    {bins.map((b) => {
                        const height = max ? (b.count / max) * 100 : 0;
                        return (
                            <div
                                key={b.label}
                                className="h-full flex-1 flex flex-col items-center justify-end" // ← thêm h-full + justify-end
                            >
                                <div
                                    className="w-full rounded-t-xl bg-gradient-to-t from-green-400 to-green-600 shadow-sm transition-all duration-500"
                                    style={{ height: `${height}%` }} // giờ % mới bám theo h-64 của container
                                    title={`${b.label}: ${b.count} món`}
                                />
                                <div className="text-sm text-slate-600 mt-2 font-medium">{b.label}</div>
                                <div className="text-xs text-slate-400">{b.count} món</div>
                            </div>
                        );
                    })}
                </div>

            )}
        </div>
    );
}

/** --------- Component chính --------- */
export default function NutriMealStats({ meals }: { meals: Meal[] }) {
    const [dq, setDq] = useState<NutritionDataQuality | null>(null);

    useEffect(() => {
        axios
            .get<NutritionDataQuality>(API_DQ, { params: { high: 800, low: 300 } })
            .then((res) => setDq(res.data))
            .catch(() => setDq(null));
    }, []);

    const isNum = (n: any) => typeof n === "number" && !Number.isNaN(n);

    const topCal = useMemo(
        () =>
            [...meals]
                .filter((m) => isNum(m.calories))
                .sort((a, b) => (b.calories || 0) - (a.calories || 0))
                .slice(0, 10),
        [meals]
    );

    const topProtein = useMemo(
        () =>
            [...meals]
                .filter((m) => isNum(m.proteinG))
                .sort((a, b) => (b.proteinG || 0) - (a.proteinG || 0))
                .slice(0, 10),
        [meals]
    );

    return (
        <div className="space-y-8">
            <div className="space-y-5">
                <div>
                    <h1 className="text-2xl font-semibold">Quản lý dinh dưỡng</h1>
                    <p className="text-slate-500 text-sm">
                        Tổng quan về chất lượng dữ liệu dinh dưỡng của các món ăn trong hệ thống.
                    </p>
                </div>

                <div className="grid sm:grid-cols-3 xl:grid-cols-4 gap-5">
                    <StatCard
                        icon={<CheckCircle2 size={18} />}
                        title="Độ hoàn thiện dữ liệu"
                        value={`${dq?.completenessRate ?? "—"} %`}
                        hint={dq ? `Đủ macro: ${dq.completeMacros}/${dq.totalFoods}` : ""}
                    />
                    <StatCard
                        icon={<Apple size={18} />}
                        title="Món đủ thông tin dinh dưỡng"
                        value={dq ? `${dq.completeMacros}/${dq.totalFoods}` : "—"}
                        hint={dq ? `Thiếu: ${dq.missingMacros} món` : ""}
                    />
                    <StatCard
                        icon={<Flame size={18} />}
                        title="Món năng lượng cao"
                        value={dq?.highEnergyFoods ?? "—"}
                        hint="> 800 kcal"
                    />
                    <StatCard
                        icon={<Leaf size={18} />}
                        title="Món năng lượng thấp"
                        value={dq?.lowEnergyFoods ?? "—"}
                        hint="< 300 kcal"
                    />
                </div>

                {/* Biểu đồ phân bố năng lượng từ API */}
                <Card
                    title="Phân bố năng lượng món ăn (kcal)"
                    subtitle="Thể hiện số lượng món ăn theo dải năng lượng"
                    className="min-h-[420px]"
                >
                    <EnergyHistogramFromAPI />
                </Card>

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
                                            <td className="py-2 pr-2 font-medium text-slate-900">
                                                {m.name}
                                            </td>
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
                                            <td className="py-2 pr-2 font-medium text-slate-900">
                                                {m.name}
                                            </td>
                                            <td className="py-2 pr-2 text-right">{m.proteinG} g</td>
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
