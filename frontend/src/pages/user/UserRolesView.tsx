import { useState, useEffect } from 'react';
import {apiFetch} from "../../api/ApiClient.ts";

interface Role {
    id: string | number;
    name: string;
    description: string;
}

export default function UsersRolesView() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    // مدیریت مودال افزودن/ویرایش
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roleForm, setRoleForm] = useState({
        name: "",
        description: ""
    });

    // مدیریت مودال حذف
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem("token");

    // دریافت نقش‌ها
    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/api/roles", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            setRoles(data || []);
        } catch (error) {
            console.error("خطا در دریافت نقش‌ها:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // هندلر باز کردن مودال در حالت افزودن
    const openAddModal = () => {
        setIsEditMode(false);
        setRoleForm({ name: "", description: "" });
        setShowModal(true);
    };

    // هندلر باز کردن مودال در حالت ویرایش
    const openEditModal = (role: Role) => {
        setIsEditMode(true);
        setSelectedRole(role);
        setRoleForm({ name: role.name, description: role.description });
        setShowModal(true);
    };

    // ارسال فرم (افزودن یا ویرایش)
    const handleSubmit = async () => {
        if (!roleForm.name.trim()) {
            alert("نام نقش نمی‌تواند خالی باشد");
            return;
        }

        try {
            setSubmitting(true);
            const url = "/api/roles";
            const method = isEditMode ? "PUT" : "POST";

            // در حالت ویرایش، ID را هم همراه با بادی می‌فرستیم
            const body = isEditMode
                ? { id: selectedRole?.id, ...roleForm }
                : roleForm;

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error("خطا در برقراری ارتباط با سرور");
            }

            if (isEditMode) {
                // آپدیت آیتم در لیست بدون واکشی مجدد
                setRoles(prev =>
                    prev.map(r => r.id === selectedRole?.id ? { ...r, ...roleForm } : r)
                );
            } else {
                const createdRole = await response.json();
                setRoles(prev => [...prev, createdRole]);
            }

            setShowModal(false);
            setRoleForm({ name: "", description: "" });
        } catch (error) {
            console.error(error);
            alert("عملیات با خطا مواجه شد");
        } finally {
            setSubmitting(false);
        }
    };

    // باز کردن مودال حذف
    const openDeleteConfirmation = (role: Role) => {
        setRoleToDelete(role);
        setShowDeleteModal(true);
    };

    // اجرای عملیات حذف
    const handleDeleteRole = async () => {
        if (!roleToDelete) return;

        try {
            setSubmitting(true);
            const response = await fetch("/api/roles", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id: roleToDelete.id })
            });

            if (!response.ok) {
                throw new Error("حذف ناموفق بود");
            }

            // حذف آیتم از State فرانت‌اند
            setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
            setShowDeleteModal(false);
            setRoleToDelete(null);
        } catch (error) {
            console.error(error);
            alert("خطا در حذف نقش");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">مدیریت نقش‌ها</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    + افزودن نقش جدید
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                    <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-3 font-medium w-16">ردیف</th>
                        <th className="pb-3 font-medium">نام نقش</th>
                        <th className="pb-3 font-medium">توضیحات</th>
                        <th className="pb-3 font-medium text-center w-40">عملیات</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">
                                در حال بارگذاری...
                            </td>
                        </tr>
                    ) : roles.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">
                                هیچ نقشی یافت نشد.
                            </td>
                        </tr>
                    ) : (
                        roles.map((role, index) => (
                            <tr key={role.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 text-gray-600">{index + 1}</td>
                                <td className="py-4 font-medium text-gray-800">{role.name}</td>
                                <td className="py-4 text-gray-500">{role.description}</td>
                                <td className="py-4">
                                    <div className="flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(role)}
                                            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                                        >
                                            ویرایش
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirmation(role)}
                                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* مودال افزودن و ویرایش */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">
                            {isEditMode ? "ویرایش نقش" : "افزودن نقش جدید"}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">نام نقش</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً Admin"
                                    value={roleForm.name}
                                    onChange={(e) =>
                                        setRoleForm({ ...roleForm, name: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">توضیحات</label>
                                <textarea
                                    placeholder="توضیحات مربوط به دسترسی‌های این نقش..."
                                    value={roleForm.description}
                                    onChange={(e) =>
                                        setRoleForm({ ...roleForm, description: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors h-24"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                            >
                                انصراف
                            </button>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                {submitting ? "در حال ثبت..." : isEditMode ? "ذخیره تغییرات" : "ثبت نقش"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال تایید حذف */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-sm p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold mb-2 text-gray-800">حذف نقش</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            آیا مطمئن هستید که می‌خواهید نقش <span className="font-semibold text-gray-800">«{roleToDelete?.name}»</span> را حذف کنید؟ این عمل غیر قابل بازگشت است.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
                            >
                                انصراف
                            </button>

                            <button
                                onClick={handleDeleteRole}
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
                            >
                                {submitting ? "در حال حذف..." : "بله، حذف شود"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}