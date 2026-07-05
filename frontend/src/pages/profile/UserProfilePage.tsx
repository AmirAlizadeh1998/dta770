import { useEffect, useState } from "react";
import type { User } from "../../models/user";
import { apiFetch } from "../../api/ApiClient.ts";

// یه تایپ جدید برای فرم ویرایش می‌سازیم که پسورد هم بتونه توش باشه
interface EditForm extends Partial<User> {
    password?: string;
}

export const UserProfilePage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await apiFetch("/api/users/profile", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (!res.ok) throw new Error("کاربر پیدا نشد!");
                const data = await res.json();
                setUser(data);
                setEditForm(data);
            } catch (error) {
                console.error("خطا در دریافت اطلاعات:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await apiFetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                // اینجا user_name و password رو هم می‌فرستیم
                body: JSON.stringify({
                    first_name: editForm.first_name,
                    last_name: editForm.last_name,
                    mobile: editForm.mobile,
                    user_name: editForm.user_name,
                    password: editForm.password // اگه خالی باشه بک‌اند نادیده می‌گیره
                })
            });

            if (!res.ok) {
                // اگه نام کاربری تکراری باشه بک‌اند ارور میده
                const errData = await res.json();
                throw new Error(errData.error || "خطا در ذخیره اطلاعات");
            }

            const updatedUser = await res.json();
            setUser(updatedUser);
            setIsEditing(false);
            // پسورد رو از فرم پاک می‌کنیم که دفعه بعد خالی باشه
            setEditForm(prev => ({ ...prev, password: "" }));
        } catch (error: any) {
            console.error("خطا:", error);
            alert(`مشکلی پیش آمد: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="text-center mt-10">داره می‌گرده... ⏳</div>;
    if (!user) return <div className="text-center mt-10 text-red-500">مشخصات شما پیدا نشد! 🤷‍♂️</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">پروفایل کاربر</h2>
                {!isEditing ? (
                    <button
                        onClick={() => {
                            setEditForm({ ...user, password: "" }); // وقت ادیت، پسورد خالی باشه
                            setIsEditing(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
                    >
                        ویرایش اطلاعات
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {isSaving ? "در حال ذخیره..." : "ذخیره"}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                        {user.first_name?.charAt(0) || user.user_name?.charAt(0)}
                    </div>
                    <div>
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        name="first_name"
                                        value={editForm.first_name || ""}
                                        onChange={handleChange}
                                        placeholder="نام"
                                        className="border rounded px-2 py-1 text-sm"
                                    />
                                    <input
                                        name="last_name"
                                        value={editForm.last_name || ""}
                                        onChange={handleChange}
                                        placeholder="نام خانوادگی"
                                        className="border rounded px-2 py-1 text-sm"
                                    />
                                </div>
                                {/* فیلد ویرایش نام کاربری */}
                                <input
                                    name="user_name"
                                    value={editForm.user_name || ""}
                                    onChange={handleChange}
                                    placeholder="نام کاربری"
                                    dir="ltr"
                                    className="border rounded px-2 py-1 text-sm w-full"
                                />
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "بدون نام"}
                                </h3>
                                <p className="text-gray-500" dir="ltr">@{user.user_name}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">شماره موبایل</p>
                        {isEditing ? (
                            <input
                                name="mobile"
                                value={editForm.mobile || ""}
                                onChange={handleChange}
                                placeholder="09123456789"
                                dir="ltr"
                                // اینجا text-right رو اضافه کردیم
                                className="border rounded px-2 py-1 w-full text-sm text-right"
                            />
                        ) : (
                            // اینجا هم text-right رو اضافه کردیم
                            <p className="font-medium text-gray-800 text-right" dir="ltr">
                                {user.mobile || "---"}
                            </p>
                        )}
                    </div>

                    {/* فیلد ویرایش رمز عبور (فقط تو حالت ادیت نمایش داده میشه) */}
                    {isEditing && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">تغییر رمز عبور (اختیاری)</p>
                            <input
                                type="password"
                                name="password"
                                value={editForm.password || ""}
                                onChange={handleChange}
                                placeholder="اگه نمی‌خوای عوض بشه خالی بذار"
                                dir="ltr"
                                className="border rounded px-2 py-1 w-full text-sm"
                            />
                        </div>
                    )}

                    <div>
                        <p className="text-sm text-gray-500">نقش سیستم</p>
                        <p className="font-medium text-gray-800">{user.role_name || "---"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">وضعیت اکانت</p>
                        <span className={`inline-block mt-1 rounded-full px-2 py-1 text-xs ${
                            user.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                        }`}>
                            {user.status === "active" ? "فعال" : "غیرفعال"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
