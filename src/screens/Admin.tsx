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
import Overview from "../screens/Overview";
import Meals from "../screens/Meals";
import UserStats from "../screens/UserStats";
import NutriMealStats from "../screens/NutriMealStats";
import ClinicalPage from "./Clinical";
import Ingredients from "../screens/Ingredients";
import { useNavigate } from "react-router-dom";
import { adminLogout, changeAdminCredentials } from "../service/auth.service";
import type { FoodResponse } from "../types/meals";
import type { AdminCredentialUpdateRequest } from "../types/auth";

// ===== Types =====
type TabKey =
  | "overview"
  | "meals"
  | "ingredients"
  | "userStats"
  | "nutritionStats"
  | "clinical"
  | "account";

// ===== Helpers =====
const STORAGE_KEY = "nutricare_admin_meals";
const AUTH_STORAGE_KEY = "admin_auth_tokens";
const hasAccessToken = () =>
  !!JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null")?.accessToken;

// ===== Main =====
export default function Admin() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasAccessToken()) navigate("/", { replace: true });
  }, [navigate]);

  const [tab, setTab] = useState<TabKey>("overview");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 👇 THÊM: trạng thái modal đổi thông tin
  const [changeOpen, setChangeOpen] = useState(false);

  async function doLogout() {
    try {
      setLoggingOut(true);
      await adminLogout(); // gọi BE + clear token local
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  }

  const [meals, setMeals] = useState<FoodResponse[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? (JSON.parse(raw) as FoodResponse[]) : null;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  }, [meals]);

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
            <div className="text-sm text-slate-600 text-right">
              <div className="font-semibold leading-4 text-slate-800">
                ADMIN
              </div>
              <div className="text-xs text-slate-500">Xin chào</div>
            </div>
          </div>

          {/* Nút Đổi mật khẩu/username – nổi bật */}
          <button
            onClick={() => setChangeOpen(true)}
            className="inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-xl
                     bg-linear-to-r from-emerald-600 to-sky-600 text-white
                     shadow-sm hover:from-emerald-700 hover:to-sky-700 active:scale-[0.98]
                     transition-all"
          >
            🔐 Đổi mật khẩu
          </button>

          {/* Nút Đăng xuất – rõ ràng hơn */}
          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-xl
                     border border-rose-300 text-rose-700 bg-rose-50
                     hover:bg-rose-100 hover:border-rose-400 active:scale-[0.98]
                     transition-all"
          >
            🚪 Đăng xuất
          </button>
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
              {tab === "overview" && <Overview />}
              {tab === "meals" && <Meals meals={meals} setMeals={setMeals} />}
              {tab === "ingredients" && <Ingredients />}
              {tab === "clinical" && <ClinicalPage />}
              {tab === "userStats" && <UserStats />}
              {tab === "nutritionStats" && <NutriMealStats />}
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NutriCare Admin — Hành trình sức khỏe của
        bạn bắt đầu từ đây.
      </footer>

      {/* Modal xác nhận đăng xuất */}
      {confirmOpen && (
        <ConfirmLogoutModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doLogout}
          loading={loggingOut}
        />
      )}

      {/* 👇 THÊM: Modal đổi thông tin admin */}
      {changeOpen && (
        <ChangeCredentialsModal
          onClose={() => setChangeOpen(false)}
          onForceLogout={() => doLogout()}
        />
      )}
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
          active
            ? "text-slate-900"
            : "text-slate-700 group-hover:text-slate-900",
        ].join(" ")}
      >
        {children}
      </span>
    </button>
  );
}

/** Modal xác nhận đăng xuất */
function ConfirmLogoutModal({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-1000 grid place-items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div className="relative w-[92%] max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Xác nhận đăng xuất
          </h3>
          <p className="mt-2 text-slate-600">
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              onClick={() => onConfirm()}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-white bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-60"
            >
              {loading ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeCredentialsModal({
  onClose,
  onForceLogout,
}: {
  onClose: () => void;
  onForceLogout: () => Promise<void> | void;
}) {
  const [form, setForm] = useState<AdminCredentialUpdateRequest>({
    username: "",
    passwordOld: "",
    newUsername: "",
    newPassword: "",
  });
  const [confirm, setConfirm] = useState("");

  // lỗi theo trường
  const [errNewPassword, setErrNewPassword] = useState<string | null>(null);
  const [errConfirm, setErrConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  // validate tức thời cho password
  useEffect(() => {
    // reset lỗi khi người dùng gõ
    setFormError(null);

    // Mật khẩu mới khác mật khẩu cũ
    if (
      form.newPassword &&
      form.passwordOld &&
      form.newPassword === form.passwordOld
    ) {
      setErrNewPassword("Mật khẩu mới phải khác mật khẩu hiện tại.");
    } else {
      setErrNewPassword(null);
    }

    // Xác nhận phải khớp
    if (form.newPassword || confirm) {
      if ((form.newPassword || "") !== (confirm || "")) {
        setErrConfirm("Mật khẩu nhập lại không khớp.");
      } else {
        setErrConfirm(null);
      }
    } else {
      setErrConfirm(null);
    }
  }, [form.newPassword, form.passwordOld, confirm]);

  const onChange =
    (k: keyof AdminCredentialUpdateRequest | "confirm") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (k === "confirm") {
        setConfirm(v);
      } else {
        setForm((s) => ({ ...s, [k]: v }));
      }
    };

  // Điều kiện bật nút Cập nhật:
  // 1) Có username hiện tại & passwordOld
  const hasCurrentCreds = !!form.username?.trim() && !!form.passwordOld?.trim();
  // 2) Có newUsername hoặc (newPassword & confirm) và newPassword == confirm
  const wantsNewUsername = !!form.newUsername?.trim();
  const wantsNewPassword = !!form.newPassword?.trim();
  const confirmMatches = (form.newPassword || "") === (confirm || "");
  // 3) newPassword khác passwordOld (nếu có nhập newPassword)
  const newPasswordDifferent =
    !wantsNewPassword ||
    (form.passwordOld && form.newPassword !== form.passwordOld);

  const canSubmit =
    hasCurrentCreds &&
    (wantsNewUsername || (wantsNewPassword && confirmMatches)) &&
    newPasswordDifferent &&
    !errNewPassword &&
    !errConfirm;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setDoneMsg(null);

    if (!canSubmit) {
      setFormError(
        "Vui lòng nhập đủ Tên đăng nhập hiện tại & Mật khẩu hiện tại, và chọn đổi Username hoặc nhập Mật khẩu mới (kèm xác nhận khớp)."
      );
      return;
    }

    try {
      setSubmitting(true);
      await changeAdminCredentials({
        username: form.username.trim(),
        passwordOld: form.passwordOld,
        newUsername: wantsNewUsername ? form.newUsername!.trim() : undefined,
        newPassword: wantsNewPassword ? form.newPassword : undefined,
      });

      if (wantsNewPassword) {
        setDoneMsg("Đổi mật khẩu thành công. Hệ thống sẽ đăng xuất...");
        await onForceLogout();
        return;
      }

      setDoneMsg("Cập nhật thông tin đăng nhập admin thành công.");
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Đã xảy ra lỗi. Vui lòng thử lại.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-1000 grid place-items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200">
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Đổi thông tin đăng nhập admin
          </h3>

          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {formError}
            </div>
          )}
          {doneMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
              {doneMsg}
            </div>
          )}

          {/* Thứ tự: Username hiện tại -> Username mới -> Mật khẩu hiện tại -> Mật khẩu mới -> Xác nhận */}
          <div className="grid gap-3">
            {/* Username hiện tại */}
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Tên đăng nhập hiện tại *
              </span>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="admin"
                value={form.username}
                onChange={onChange("username")}
                required
              />
            </label>

            {/* Username mới (tùy chọn) */}
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Tên đăng nhập mới (tuỳ chọn)
              </span>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="username mới"
                value={form.newUsername || ""}
                onChange={onChange("newUsername")}
              />
            </label>

            {/* Mật khẩu hiện tại */}
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Mật khẩu hiện tại *
              </span>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
                value={form.passwordOld}
                onChange={onChange("passwordOld")}
                required
              />
            </label>

            {/* Mật khẩu mới (tuỳ chọn) */}
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Mật khẩu mới (tuỳ chọn)
              </span>
              <input
                type="password"
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                  errNewPassword
                    ? "border-rose-300 focus:ring-rose-400"
                    : "border-slate-300 focus:ring-emerald-500"
                }`}
                placeholder="••••••••"
                value={form.newPassword || ""}
                onChange={onChange("newPassword")}
              />
              {errNewPassword && (
                <p className="text-xs text-rose-600 mt-1">{errNewPassword}</p>
              )}
            </label>

            {/* Xác nhận mật khẩu mới */}
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Xác nhận mật khẩu mới
              </span>
              <input
                type="password"
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                  errConfirm
                    ? "border-rose-300 focus:ring-rose-400"
                    : "border-slate-300 focus:ring-emerald-500"
                }`}
                placeholder="Nhập lại mật khẩu mới"
                value={confirm}
                onChange={onChange("confirm")}
              />
              {errConfirm && (
                <p className="text-xs text-rose-600 mt-1">{errConfirm}</p>
              )}
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={submitting}
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`px-4 py-2 rounded-xl text-white transition-all ${
                !canSubmit || submitting
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-linear-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
              }`}
            >
              {submitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
