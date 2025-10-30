import { LogOut } from "lucide-react";

export default function Logout({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={[
                "group relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5",
                "border border-slate-200 bg-white/70 backdrop-blur text-slate-800",
                "shadow-sm transition-all hover:bg-white hover:shadow-md",
                "focus:outline-none focus:ring-4 focus:ring-emerald-100 active:scale-[0.98]",
            ].join(" ")}
            title="Đăng xuất"
            aria-label="Đăng xuất"
        >
            <span
                className={[
                    "pointer-events-none absolute inset-0 -z-10 rounded-xl",
                    "bg-linear-to-r from-emerald-400/0 via-emerald-400/20 to-sky-400/0",
                    "opacity-0 transition-opacity group-hover:opacity-100",
                ].join(" ")}
            />
            <span
                className={[
                    "inline-grid h-6 w-6 place-items-center rounded-lg",
                    "bg-slate-900 text-white transition-transform",
                    "group-hover:scale-105",
                ].join(" ")}
            >
                <LogOut size={16} />
            </span>
            <span className="font-semibold">Đăng xuất</span>
        </button>
    );
}
