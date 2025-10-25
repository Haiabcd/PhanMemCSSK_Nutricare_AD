export default function FoodStatistics() {
    const foodStats = [
        { title: "Tổng món ăn", value: "1,247", desc: "món ăn", color: "bg-emerald-50 text-emerald-700" },
        { title: "Món ăn mới", value: "23", desc: "trong tuần này", color: "bg-blue-50 text-blue-700" },
        { title: "Món ăn phổ biến", value: "Phở bò", desc: "được yêu thích nhất", color: "bg-purple-50 text-purple-700" },
        { title: "Đánh giá TB", value: "4.6", desc: "⭐ sao", color: "bg-yellow-50 text-yellow-700" },
    ];

    const popularFoods = [
        { name: "Phở bò", count: 245, percentage: 85, rating: 4.8 },
        { name: "Bún chả", count: 198, percentage: 72, rating: 4.6 },
        { name: "Cơm tấm", count: 156, percentage: 58, rating: 4.4 },
        { name: "Bánh mì", count: 134, percentage: 45, rating: 4.2 },
        { name: "Chả cá", count: 98, percentage: 35, rating: 4.5 },
    ];

    const mealCategories = [
        { category: "Bữa sáng", count: 312, percentage: 25 },
        { category: "Bữa trưa", count: 445, percentage: 36 },
        { category: "Bữa chiều", count: 389, percentage: 31 },
        { category: "Bữa phụ", count: 101, percentage: 8 },
    ];

    const recentFoods = [
        { name: "Bún bò Huế", addedBy: "Admin", date: "2024-01-15", status: "Đã duyệt" },
        { name: "Chả cá Lã Vọng", addedBy: "User", date: "2024-01-14", status: "Chờ duyệt" },
        { name: "Bánh xèo", addedBy: "Admin", date: "2024-01-13", status: "Đã duyệt" },
        { name: "Nem nướng", addedBy: "User", date: "2024-01-12", status: "Đã duyệt" },
    ];

    return (
        <section className="bg-white border rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Thống kê món ăn</h2>
            <p className="text-sm text-slate-600 mt-1">Phân tích và thống kê về món ăn trong hệ thống</p>
            
            {/* Food Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                {foodStats.map((stat, index) => (
                    <div key={index} className="rounded-2xl border bg-white p-4 card hover:shadow-lg transition-shadow">
                        <div className="text-sm text-slate-500">{stat.title}</div>
                        <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
                        <div className="mt-1 text-xs text-slate-500">{stat.desc}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Popular Foods */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Món ăn phổ biến</h3>
                    <div className="space-y-3">
                        {popularFoods.map((food, i) => (
                            <div key={i} className="bg-white rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{food.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">⭐ {food.rating}</span>
                                        <span className="text-xs text-gray-500">{food.count}</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-emerald-500 h-2 rounded-full" 
                                        style={{ width: `${food.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Meal Categories */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Phân loại theo bữa ăn</h3>
                    <div className="space-y-3">
                        {mealCategories.map((category, i) => (
                            <div key={i} className="bg-white rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{category.category}</span>
                                    <span className="text-sm text-gray-600">{category.count} món</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full" 
                                        style={{ width: `${category.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {category.percentage}% tổng món ăn
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Food Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Phân loại món ăn</h3>
                    <div className="h-48 bg-white rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed">
                        🍽️ Biểu đồ phân loại món ăn
                    </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Xu hướng món ăn</h3>
                    <div className="h-48 bg-white rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed">
                        📈 Biểu đồ xu hướng món ăn
                    </div>
                </div>
            </div>

            {/* Recent Food Activities */}
            <div className="mt-6 bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium mb-4">Hoạt động món ăn gần đây</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white text-slate-600">
                            <tr>
                                <th className="text-left font-medium px-4 py-2">Món ăn</th>
                                <th className="text-left font-medium px-4 py-2">Thêm bởi</th>
                                <th className="text-left font-medium px-4 py-2">Ngày thêm</th>
                                <th className="text-left font-medium px-4 py-2">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentFoods.map((food, i) => (
                                <tr key={i} className="border-t bg-white">
                                    <td className="px-4 py-2 font-medium">{food.name}</td>
                                    <td className="px-4 py-2">{food.addedBy}</td>
                                    <td className="px-4 py-2">{food.date}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            food.status === 'Đã duyệt' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {food.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Contributors */}
            <div className="mt-6 bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium mb-4">Người đóng góp nhiều nhất</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { name: "Admin", count: 156, avatar: "👨‍💼" },
                        { name: "Chef Master", count: 89, avatar: "👨‍🍳" },
                        { name: "Food Expert", count: 67, avatar: "👩‍🍳" },
                    ].map((contributor, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 text-center">
                            <div className="text-2xl mb-2">{contributor.avatar}</div>
                            <div className="font-medium">{contributor.name}</div>
                            <div className="text-2xl font-bold text-emerald-600">{contributor.count}</div>
                            <div className="text-xs text-gray-500">món ăn</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
