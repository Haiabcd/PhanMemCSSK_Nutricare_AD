
export type RoleCounts = { userCount: number; guestCount: number };

export type GoalStats = { maintain: number; lose: number; gain: number };

export type TopUser = { name: string; totalLogs: number };

export type ActiveInactiveCounts = { active: number; inactive: number };

export type CountUsersByStatus = { total: number; active: number; deleted: number };

export type OverviewUsersResponse = {
    totalUsers: number;
    getNewUsersInLast7Days: number;
    totalUserArchived: number;
    getUserRoleCounts: RoleCounts;
    getGoalStats: GoalStats;
    getTopUsersByLogCount: TopUser[];
    getActiveInactiveCounts?: ActiveInactiveCounts;
    activeUsers?: number;
    inactiveUsers?: number;
    countActive?: number;
    countInactive?: number;
    countUsersByStatus?: CountUsersByStatus;
};
