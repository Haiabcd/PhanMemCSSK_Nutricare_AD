import React, { useEffect, useMemo, useState } from "react";
import { Users2, LogIn, Target } from "lucide-react";
import { fetchOverviewUsers } from "../service/overview.service";
import type { OverviewUsersResponse, TopUser } from "../types/users";
import "../css/UserStats.css";
import { isRequestCanceled, toAxiosMessage } from "../service/helpers";
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
      className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm ${
        className ?? ""
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

/** Mini charts */
function MiniDonutChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const total = Math.max(
    1,
    items.reduce((s, i) => s + i.value, 0)
  );
  const radius = 70,
    stroke = 26,
    size = 180;
  let acc = 0;
  const palette = [
    "#22c55e",
    "#06b6d4",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
  ];

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
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
              transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rot} ${
                size / 2
              } ${size / 2})`}
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-700 text-sm"
        >
          {items.reduce((s, i) => s + i.value, 0)}
        </text>
      </svg>

      <div className="text-sm space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-sm swatch-${i % 6}`}
            />
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
  const [stats, setStats] = useState<OverviewUsersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const ac = new AbortController();
    let mounted = true;
    setLoading(true);

    fetchOverviewUsers(ac.signal)
      .then((data) => {
        if (!mounted || ac.signal.aborted) return;
        setStats(data);
      })
      .catch((e: unknown) => {
        if (isRequestCanceled(e)) return;
        console.error("Lỗi khi tải thống kê người dùng:", toAxiosMessage(e));
        if (!mounted || ac.signal.aborted) return;
        setStats(null);
      })
      .finally(() => {
        if (!mounted || ac.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  // Ưu tiên totalUsers; fallback sang countUsersByStatus.total
  const totalUsers = stats?.totalUsers ?? stats?.countUsersByStatus?.total ?? 0;
  const new7d = stats?.getNewUsersInLast7Days ?? 0;
  const archivedUsers = stats?.totalUserArchived ?? 0;

  const roleItems = useMemo(
    () => [
      { label: "Đăng nhập", value: stats?.getUserRoleCounts?.userCount ?? 0 },
      { label: "Dùng ngay", value: stats?.getUserRoleCounts?.guestCount ?? 0 },
    ],
    [stats]
  );

  const goalItems = useMemo(
    () => [
      { label: "Tăng cân", value: stats?.getGoalStats?.gain ?? 0 },
      { label: "Giảm cân", value: stats?.getGoalStats?.lose ?? 0 },
      { label: "Duy trì cân nặng", value: stats?.getGoalStats?.maintain ?? 0 },
    ],
    [stats]
  );

  const topUsers = useMemo<TopUser[]>(
    () => (stats?.getTopUsersByLogCount ?? []).slice(0, 15),
    [stats]
  );

  const statusItems = useMemo(() => {
    const active =
      stats?.countUsersByStatus?.active ??
      stats?.getActiveInactiveCounts?.active ??
      stats?.activeUsers ??
      stats?.countActive ??
      0;

    const inactiveOrDeleted =
      stats?.countUsersByStatus?.deleted ??
      stats?.getActiveInactiveCounts?.inactive ??
      stats?.inactiveUsers ??
      stats?.countInactive ??
      0;

    return [
      { label: "Đang hoạt động", value: active },
      { label: "Đã xoá", value: inactiveOrDeleted },
    ];
  }, [stats]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <p className="text-slate-500 text-sm">
          Thống kê tổng quan về người dùng sử dụng ứng dụng NutriCare.
        </p>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <StatCard
          icon={<Users2 />}
          title="Tổng người dùng"
          value={totalUsers}
        />
        <StatCard
          icon={<LogIn />}
          title="Người dùng mới (7 ngày)"
          value={new7d}
          hint={loading ? "Đang tải..." : undefined}
        />
        <StatCard
          icon={<Target />}
          title="Người dùng đạt được mục tiêu"
          value={archivedUsers}
          hint={loading ? "Đang tải..." : undefined}
        />
      </div>

      {/* Hàng duy nhất chứa 3 donut */}
      <div
        className={`grid xl:grid-cols-3 gap-5 ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <Card title="Tỉ lệ người dùng (Đăng nhập / Dùng ngay)">
          <MiniDonutChart items={roleItems} />
        </Card>

        <Card title="Tỉ lệ người dùng theo mục tiêu">
          <MiniDonutChart items={goalItems} />
        </Card>

        <Card title="Trạng thái người dùng">
          <MiniDonutChart items={statusItems} />
        </Card>
      </div>

      <Card
        title="Top 15 người dùng ứng dụng nhiều nhất"
        subtitle="Theo số lượt log từ hệ thống"
      >
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
              {topUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                topUsers.map((u, i) => (
                  <tr
                    key={`${u.name}-${i}`}
                    className="border-t border-slate-100"
                  >
                    <td className="py-2 pr-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2 pr-2 font-medium text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-2 pr-2 text-right font-semibold">
                      {u.totalLogs.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
