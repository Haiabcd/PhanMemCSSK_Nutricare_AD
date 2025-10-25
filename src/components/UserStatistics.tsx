export default function UserStatistics() {
    const userStats = [
        { title: "Tổng người dùng", value: "2,847", desc: "+12% so với tháng trước", color: "bg-blue-50 text-blue-700" },
        { title: "Người dùng mới", value: "128", desc: "+4 trong 1h qua", color: "bg-green-50 text-green-700" },
        { title: "Người dùng hoạt động", value: "1,234", desc: "43% tổng người dùng", color: "bg-purple-50 text-purple-700" },
        { title: "Tỷ lệ duy trì", value: "82%", desc: "tăng 5% so với tháng trước", color: "bg-orange-50 text-orange-700" },
    ];

    const recentUsers = [
        { name: "Nguyễn Văn A", email: "nguyenvana@email.com", joinDate: "2024-01-15", status: "Hoạt động" },
        { name: "Trần Thị B", email: "tranthib@email.com", joinDate: "2024-01-14", status: "Hoạt động" },
        { name: "Lê Văn C", email: "levanc@email.com", joinDate: "2024-01-13", status: "Không hoạt động" },
        { name: "Phạm Thị D", email: "phamthid@email.com", joinDate: "2024-01-12", status: "Hoạt động" },
    ];

    return (
        <section className="bg-white border rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Thống kê người dùng</h2>
            <p className="text-sm text-slate-600 mt-1">Thống kê và phân tích người dùng hệ thống</p>
            
            {/* User Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                {userStats.map((stat, index) => (
                    <div key={index} className="rounded-2xl border bg-white p-4 card hover:shadow-lg transition-shadow">
                        <div className="text-sm text-slate-500">{stat.title}</div>
                        <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
                        <div className="mt-1 text-xs text-slate-500">{stat.desc}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* User Growth Chart */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Biểu đồ tăng trưởng người dùng</h3>
                    <div className="h-64 bg-white rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed">
                        📊 Biểu đồ sẽ được hiển thị ở đây
                    </div>
                </div>

                {/* Recent Users */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Người dùng gần đây</h3>
                    <div className="space-y-3">
                        {recentUsers.map((user, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-sm">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                    <div className="text-xs text-gray-400">{user.joinDate}</div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.status === 'Hoạt động' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {user.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Activity Table */}
            <div className="mt-6 bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium mb-4">Hoạt động người dùng</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white text-slate-600">
                            <tr>
                                <th className="text-left font-medium px-4 py-2">Thời gian</th>
                                <th className="text-left font-medium px-4 py-2">Hoạt động</th>
                                <th className="text-left font-medium px-4 py-2">Người dùng</th>
                                <th className="text-left font-medium px-4 py-2">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { time: "10:05", activity: "Đăng ký tài khoản mới", user: "nguyenvana", status: "Thành công" },
                                { time: "09:58", activity: "Cập nhật thông tin cá nhân", user: "tranthib", status: "Thành công" },
                                { time: "09:31", activity: "Đăng nhập hệ thống", user: "levanc", status: "Thành công" },
                                { time: "09:15", activity: "Tạo kế hoạch dinh dưỡng", user: "phamthid", status: "Thành công" },
                            ].map((activity, i) => (
                                <tr key={i} className="border-t bg-white">
                                    <td className="px-4 py-2">{activity.time}</td>
                                    <td className="px-4 py-2">{activity.activity}</td>
                                    <td className="px-4 py-2">{activity.user}</td>
                                    <td className="px-4 py-2">
                                        <span className="badge bg-emerald-50 text-emerald-700"> {activity.status} </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
