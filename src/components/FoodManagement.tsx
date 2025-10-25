import { useState } from 'react';

interface Food {
    id: string;
    name: string;
    description: string;
    image?: string;
    portion: number;
    portionUnit: string;
    weight: number;
    cookTime: number;
    calories: number;
    proteinG?: number;
    carbG?: number;
    fatG?: number;
    fiberG?: number;
    sodiumMg?: number;
    sugarMg?: number;
    meals: string[];
}

interface FoodManagementProps {
    onAddFood: () => void;
    onEditFood: (food: Food) => void;
}

export default function FoodManagement({ onAddFood, onEditFood }: FoodManagementProps) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Mock data - trong thực tế sẽ lấy từ API
    const foods: Food[] = [
        {
            id: '1',
            name: 'Cơm tấm sườn nướng',
            description: 'Cơm tấm với sườn nướng thơm ngon',
            portion: 1,
            portionUnit: 'đĩa',
            weight: 300,
            cookTime: 30,
            calories: 450,
            proteinG: 25,
            carbG: 45,
            fatG: 15,
            fiberG: 3,
            sodiumMg: 800,
            sugarMg: 5,
            meals: ['Bữa trưa', 'Bữa chiều']
        },
        {
            id: '2',
            name: 'Phở bò',
            description: 'Phở bò truyền thống',
            portion: 1,
            portionUnit: 'tô',
            weight: 400,
            cookTime: 45,
            calories: 380,
            proteinG: 20,
            carbG: 50,
            fatG: 8,
            fiberG: 2,
            sodiumMg: 1200,
            sugarMg: 3,
            meals: ['Bữa sáng', 'Bữa trưa']
        },
        {
            id: '3',
            name: 'Bún chả',
            description: 'Bún chả Hà Nội',
            portion: 1,
            portionUnit: 'tô',
            weight: 350,
            cookTime: 25,
            calories: 320,
            proteinG: 18,
            carbG: 40,
            fatG: 6,
            fiberG: 4,
            sodiumMg: 900,
            sugarMg: 8,
            meals: ['Bữa trưa', 'Bữa chiều']
        }
    ];

    const filteredFoods = foods.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="bg-white border rounded-2xl">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Quản lý món ăn</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                        />
                    </div>
                </div>
                <button onClick={onAddFood} className="btn btn-primary">
                    ➕ Thêm món ăn
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Tên món ăn</th>
                            <th className="text-left font-medium px-4 py-3">Mô tả</th>
                            <th className="text-left font-medium px-4 py-3">Khẩu phần</th>
                            <th className="text-left font-medium px-4 py-3">Calo</th>
                            <th className="text-left font-medium px-4 py-3">Thời gian nấu</th>
                            <th className="text-left font-medium px-4 py-3">Bữa ăn</th>
                            <th className="text-left font-medium px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFoods.map((food) => (
                            <tr key={food.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{food.name}</td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{food.description}</td>
                                <td className="px-4 py-3">{food.portion} {food.portionUnit}</td>
                                <td className="px-4 py-3 font-medium text-emerald-600">{food.calories} cal</td>
                                <td className="px-4 py-3">{food.cookTime} phút</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {food.meals.map((meal, index) => (
                                            <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                                {meal}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onEditFood(food)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button className="btn btn-danger btn-sm">
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {filteredFoods.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Không tìm thấy món ăn nào' : 'Chưa có món ăn nào'}
                    </div>
                )}
            </div>
        </section>
    );
}
