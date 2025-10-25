export default function NutritionStatistics() {
    const nutritionStats = [
        { title: "Calo trung bình/ngày", value: "2,150", desc: "kcal", color: "bg-red-50 text-red-700" },
        { title: "Protein trung bình", value: "85g", desc: "g/ngày", color: "bg-blue-50 text-blue-700" },
        { title: "Carb trung bình", value: "250g", desc: "g/ngày", color: "bg-green-50 text-green-700" },
        { title: "Fat trung bình", value: "75g", desc: "g/ngày", color: "bg-yellow-50 text-yellow-700" },
    ];

    const nutritionGoals = [
        { nutrient: "Calo", current: 2150, target: 2000, unit: "kcal", color: "bg-red-500" },
        { nutrient: "Protein", current: 85, target: 80, unit: "g", color: "bg-blue-500" },
        { nutrient: "Carb", current: 250, target: 300, unit: "g", color: "bg-green-500" },
        { nutrient: "Fat", current: 75, target: 70, unit: "g", color: "bg-yellow-500" },
    ];

    const mealDistribution = [
        { meal: "Bữa sáng", calories: 450, percentage: 21, color: "bg-blue-500" },
        { meal: "Bữa trưa", calories: 650, percentage: 30, color: "bg-green-500" },
        { meal: "Bữa chiều", calories: 600, percentage: 28, color: "bg-orange-500" },
        { meal: "Bữa phụ", calories: 450, percentage: 21, color: "bg-purple-500" },
    ];

    return (
        <section className="bg-white border rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Thống kê dinh dưỡng</h2>
            <p className="text-sm text-slate-600 mt-1">Phân tích và thống kê về dinh dưỡng</p>
            
            {/* Nutrition Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                {nutritionStats.map((stat, index) => (
                    <div key={index} className="rounded-2xl border bg-white p-4 card hover:shadow-lg transition-shadow">
                        <div className="text-sm text-slate-500">{stat.title}</div>
                        <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
                        <div className="mt-1 text-xs text-slate-500">{stat.desc}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Nutrition Goals Progress */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Tiến độ mục tiêu dinh dưỡng</h3>
                    <div className="space-y-4">
                        {nutritionGoals.map((goal, index) => {
                            const percentage = Math.min((goal.current / goal.target) * 100, 100);
                            return (
                                <div key={index} className="bg-white rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">{goal.nutrient}</span>
                                        <span className="text-sm text-gray-600">
                                            {goal.current}/{goal.target} {goal.unit}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${goal.color}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {percentage.toFixed(1)}% mục tiêu
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Meal Distribution */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Phân bố calo theo bữa ăn</h3>
                    <div className="space-y-3">
                        {mealDistribution.map((meal, index) => (
                            <div key={index} className="bg-white rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">{meal.meal}</span>
                                    <span className="text-sm text-gray-600">{meal.calories} cal</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${meal.color}`}
                                        style={{ width: `${meal.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {meal.percentage}% tổng calo
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Nutrition Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Phân bố dinh dưỡng</h3>
                    <div className="h-48 bg-white rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed">
                        🥗 Biểu đồ phân bố dinh dưỡng
                    </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-medium mb-4">Xu hướng dinh dưỡng</h3>
                    <div className="h-48 bg-white rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed">
                        📈 Biểu đồ xu hướng
                    </div>
                </div>
            </div>

            {/* Top Nutrients */}
            <div className="mt-6 bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium mb-4">Chất dinh dưỡng phổ biến</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { name: "Vitamin C", count: 245, trend: "+12%" },
                        { name: "Protein", count: 198, trend: "+8%" },
                        { name: "Fiber", count: 156, trend: "+15%" },
                        { name: "Iron", count: 134, trend: "+5%" },
                    ].map((nutrient, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 text-center">
                            <div className="text-lg font-semibold">{nutrient.name}</div>
                            <div className="text-2xl font-bold text-emerald-600">{nutrient.count}</div>
                            <div className="text-xs text-green-600">{nutrient.trend}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
