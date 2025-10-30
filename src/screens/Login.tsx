import { LogIn, UtensilsCrossed } from "lucide-react";

type Props = {
    onGoogleLogin: () => void;
};

export default function Login({ onGoogleLogin }: Props) {
    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <style>{`
                .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
                .scrollbar-hide::-webkit-scrollbar{width:0;height:0;background:transparent}
            `}</style>
            <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_80%_0%,#d1fae5_0%,transparent_55%),radial-gradient(60%_60%_at_0%_100%,#dbeafe_0%,transparent_60%)]" />
            <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-400/30 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-[520px] w-[520px] rounded-full bg-sky-400/30 blur-3xl" />

            <div className="relative z-10 h-full flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    <div className="rounded-4xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.1)] overflow-hidden">
                        <div className="pt-14 pb-6 flex flex-col items-center text-center space-y-3">
                            {/* Logo biểu tượng */}
                            <div className="relative">
                                <div className="absolute inset-0 blur-2xl bg-emerald-400/40" />
                                <div className="relative h-20 w-20 rounded-3xl bg-linear-to-br from-green-500 to-emerald-600 grid place-items-center text-white shadow-lg ring-8 ring-emerald-200/40">
                                    <UtensilsCrossed size={30} />
                                </div>
                            </div>

                            {/* Tên app */}
                            <div className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-emerald-600 to-sky-600 text-transparent bg-clip-text drop-shadow-sm">
                                NutriCare
                            </div>
                            <div className="text-slate-600 text-base font-medium">
                                Hành trình sức khỏe của bạn bắt đầu từ đây!
                            </div>
                        </div>

                        {/* Nội dung đăng nhập */}
                        <div className="px-10 pb-14 text-center">
                            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
                                Xin chào 👋
                            </h1>
                            <p className="mt-3 text-slate-600 text-base leading-relaxed">
                                Hãy đăng nhập để vào bên trong và quản lý dữ liệu dinh dưỡng của bạn.
                            </p>

                            <button
                                onClick={onGoogleLogin}
                                className="mt-10 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4
                                    bg-linear-to-r from-emerald-600 to-sky-600 text-white 
                                    hover:from-emerald-700 hover:to-sky-700
                                    active:scale-[0.98] transition-all shadow-[0_16px_40px_rgba(16,185,129,0.25)]
                                    text-lg font-semibold"
                            >
                                <LogIn size={20} />
                                Đăng nhập bằng Google
                            </button>

                            <div className="mt-8 text-xs text-slate-500">
                                Chúng tôi cam kết bảo mật tuyệt đối thông tin của bạn.
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        © {new Date().getFullYear()} NutriCare — Hành trình sức khỏe của bạn bắt đầu từ đây.
                    </div>
                </div>
            </div>
        </div>
    );
}
