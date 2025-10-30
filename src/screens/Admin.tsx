import React, { useEffect, useState } from "react";
import {
    UtensilsCrossed,
    Apple,
    Users2,
    Brain,
    LayoutDashboard,
    Stethoscope,
    Leaf,
} from "lucide-react";
import Login from "../screens/Login";
import Overview from "../screens/Overview";
import Meals from "../screens/Meals";
import UserStats from "../screens/UserStats";
import NutriMealStats from "../screens/NutriMealStats";
import Logout from "../screens/Logout";
import ClinicalPage from "./Clinical";
import Ingredients from "../screens/Ingredients";
import type { Meal } from "../types/types";

// ===== Types =====
type User =
    | { uid: string; displayName: string; email?: string; photoURL?: string }
    | null;

type TabKey =
    | "overview"
    | "meals"
    | "ingredients"
    | "userStats"
    | "nutritionStats"
    | "clinical";

// ===== Helpers =====
const uid = () => Math.random().toString(36).slice(2);
const STORAGE_KEY = "nutricare_admin_meals";


// ===== Main =====
export default function App() {
    const [user, setUser] = useState<User>(null);
    const [tab, setTab] = useState<TabKey>("overview");

    const handleGoogleLogin = () =>
        setUser({
            uid: uid(),
            displayName: "Anh Hải",
            email: "Xin Chào",
            photoURL: "https://i.pravatar.cc/100?img=68",
        });
    const handleLogout = () => setUser(null);

    const [meals, setMeals] = useState<Meal[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const data = raw ? (JSON.parse(raw) as Meal[]) : null;
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    }, [meals]);

    if (!user) {
        return <Login onGoogleLogin={handleGoogleLogin} />;
    }

    // ===== Header ===== //
    const Header = (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
            <div className="w-full flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-emerald-400/35" />
                        <div
                            className="relative h-10 w-10 rounded-2xl grid place-items-center text-white
                 bg-linear-to-br from-green-500 to-emerald-600 shadow-md
                 ring-4 ring-emerald-200/40"
                            aria-label="NutriCare logo"
                        >
                            <UtensilsCrossed size={20} />
                        </div>
                    </div>
                    <div className="leading-tight">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-700/90">
                            NutriCare
                        </div>
                        <div className="text-lg sm:text-xl font-extrabold bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                            Quản Lý NutriCare
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-3 pr-2">
                        {user.photoURL && (
                            <img
                                src={user.photoURL}
                                alt="avatar"
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        )}
                        <div className="text-sm text-slate-600">
                            <div className="font-medium leading-4">{user.displayName}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                    </div>
                    <Logout onClick={handleLogout} />
                </div>
            </div>
        </header>
    );

    const Sidebar = (
        <aside className="w-full sm:w-60 shrink-0">
            <div className="sticky top-[60px] sm:top-14 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur p-3 sm:p-4 shadow-sm">
                <nav className="space-y-2">
                    <SidebarBtn
                        icon={<LayoutDashboard size={18} />}
                        active={tab === "overview"}
                        onClick={() => setTab("overview")}
                    >
                        Tổng quan
                    </SidebarBtn>
                    <SidebarBtn
                        icon={<Apple size={18} />}
                        active={tab === "meals"}
                        onClick={() => setTab("meals")}
                    >
                        Quản lý món ăn
                    </SidebarBtn>
                    <SidebarBtn
                        icon={<Leaf size={18} />}
                        active={tab === "ingredients"}
                        onClick={() => setTab("ingredients")}
                    >
                        Quản lý nguyên liệu
                    </SidebarBtn>
                    <SidebarBtn
                        icon={<Stethoscope size={18} />}
                        active={tab === "clinical"}
                        onClick={() => setTab("clinical")}
                    >
                        Quản lý bệnh nền & dị ứng
                    </SidebarBtn>
                    <SidebarBtn
                        icon={<Users2 size={18} />}
                        active={tab === "userStats"}
                        onClick={() => setTab("userStats")}
                    >
                        Quản lý người dùng
                    </SidebarBtn>
                    <SidebarBtn
                        icon={<Brain size={18} />}
                        active={tab === "nutritionStats"}
                        onClick={() => setTab("nutritionStats")}
                    >
                        Quản lý dinh dưỡng
                    </SidebarBtn>
                </nav>
            </div>
        </aside>
    );

    // ===== Layout =====
    return (
        <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
            <style>{`
          .scrollbar-hide {-ms-overflow-style:none;scrollbar-width:none}
          .scrollbar-hide::-webkit-scrollbar{width:0;height:0;background:transparent}
        `}</style>

            {Header}

            <main className="flex-1 overflow-hidden px-6 py-6 min-h-0">
                <div className="flex h-full gap-4 min-h-0">
                    {Sidebar}
                    <section className="flex-1 relative overflow-auto scrollbar-hide min-h-0">
                        <div className="space-y-5 pb-10">
                            {tab === "overview" && <Overview meals={meals} />}
                            {tab === "meals" && <Meals meals={meals} setMeals={setMeals} />}
                            {tab === "ingredients" && <Ingredients />}
                            {tab === "clinical" && <ClinicalPage />}
                            {tab === "userStats" && <UserStats />}
                            {tab === "nutritionStats" && (
                                <NutriMealStats />
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <footer className="text-center text-sm text-slate-500">
                © {new Date().getFullYear()} NutriCare Admin — Hành trình sức khỏe của bạn bắt đầu từ đây.
            </footer>
        </div>
    );
}

// ===== Helpers UI =====
function SidebarBtn({
    icon,
    children,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                "group relative w-full flex items-center rounded-xl px-3 py-2.5 transition-all text-sm",
                active
                    ? "bg-white shadow-sm border border-slate-200 ring-1 ring-slate-200"
                    : "hover:bg-white/60 border border-transparent",
            ].join(" ")}
        >
            <span
                className={[
                    "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-full",
                    "bg-linear-to-b from-emerald-500 to-sky-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                ].join(" ")}
            />
            <span
                className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-slate-600 transition-all",
                    active
                        ? "bg-linear-to-br from-emerald-500 to-sky-500 text-white border-transparent shadow-sm"
                        : "bg-slate-50 border-slate-200 group-hover:text-emerald-700",
                ].join(" ")}
            >
                {icon}
            </span>
            <span
                className={[
                    "ml-3 flex-1 text-left font-medium tracking-tight leading-[1.4]",
                    active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900",
                ].join(" ")}
            >
                {children}
            </span>
        </button>
    );
}
