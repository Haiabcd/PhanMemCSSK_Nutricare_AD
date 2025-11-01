import React, { useState, useRef, useEffect } from "react";
import Logout from "./Logout";

type User = { uid: string; displayName: string; email?: string; photoURL?: string };

type Props = {
    user: User;
    onLogout: () => void;
    onChangePassword: (payload: { oldPassword: string; newPassword: string }) => Promise<void> | void;
};

export default function AccountPanel({ user, onLogout, onChangePassword }: Props) {
    const [showChange, setShowChange] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showChange) {
            setOldPassword("");
            setNewPassword("");
            setTimeout(() => firstInputRef.current?.focus(), 50);
        }
    }, [showChange]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) return;
        setSubmitting(true);
        try {
            await onChangePassword({ oldPassword, newPassword });
            setShowChange(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative">
            {/* nền nhẹ cho khu vực account */}
            <div className="absolute inset-0 -z-10">
                <div className="h-40 w-full bg-linear-to-r from-emerald-100 via-sky-100 to-emerald-100 rounded-2xl" />
            </div>

            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Quản lý tài khoản</h2>
                        <p className="text-sm text-slate-500">Hồ sơ của bạn và thiết lập bảo mật.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowChange((v) => !v)}
                            className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-800"
                        >
                            {showChange ? "Đóng đổi mật khẩu" : "Đổi mật khẩu"}
                        </button>
                        <Logout onClick={onLogout} />
                    </div>
                </div>

                {/* Thẻ hồ sơ */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt="avatar"
                                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow"
                            />
                        ) : (
                            <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                        )}
                        <div>
                            <div className="text-lg font-semibold text-slate-900">{user.displayName}</div>
                            <div className="text-sm text-slate-500">{user.email || "—"}</div>
                        </div>
                    </div>

                    {/* Form đổi mật khẩu hiển thị inline */}
                    {showChange && (
                        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:max-w-md">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Mật khẩu cũ</label>
                                <input
                                    ref={firstInputRef}
                                    type="password"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Nhập mật khẩu cũ"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Nhập mật khẩu mới"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowChange(false)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                    disabled={submitting || !oldPassword || !newPassword}
                                >
                                    {submitting ? "Đang cập nhật..." : "Cập nhật"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
