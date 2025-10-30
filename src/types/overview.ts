
export type Meal = {
    id: string;
    name: string;
    slots: string[];
    calories?: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
};

// RAW từ BE
export type RawDaily = { dayLabel: string; date: string; total: number };
export type RawMonthly = { monthLabel: string; month: number; total: number; yearMonth: string };

export type RawOverview = {
    totalUsers: number;
    totalFoods: number;
    dailyCount: RawDaily[];
    monthlyCount: RawMonthly[];
    getCountBySource: { manual?: number; scan?: number; plan?: number };
    getPlanLogCountByMealSlot: Record<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK", number>;
};

// UI-normalized
export type DailyCountDto = { date: string; count: number; shortLabel: string };
export type MonthlyCountDto = { month: number; count: number; monthLabel: string };
export type OverviewUi = {
    totalUsers: number;
    totalFoods: number;
    dailyCount: DailyCountDto[];
    monthlyCount: MonthlyCountDto[];
    getCountBySource: { PLAN: number; SCAN: number; MANUAL: number };
    getPlanLogCountByMealSlot: Record<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK", number>;
};
