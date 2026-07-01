// pages/UserListPage.tsx

import { useMemo, useState } from "react";
import type { User } from "../models/user.ts";
import type { Role } from "../models/user.ts"; // حتماً فایل مدل Role رو اضافه یا مسیرش رو درست کن

interface UserListPageProps {
    users?: User[];
    roles?: Role[]; // پراپ جدید برای لیست نقش‌ها
    loading?: boolean;
    error?: string | null;

    onAdd?: () => void;
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
}

function UserListPage({
                          users = [],
                          roles = [], // مقدار پیش‌فرض
                          loading,
                          error,
                          onAdd,
                          onEdit,
                          onDelete
                      }: UserListPageProps) {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            const matchSearch =
                !q ||
                u.user_name?.toLowerCase().includes(q) ||
                u.first_name?.toLowerCase().includes(q) ||
                u.last_name?.toLowerCase().includes(q) ||
                u.mobile?.toLowerCase().includes(q);

            // حالا با role_id فیلتر می‌کنیم
            const matchRole = roleFilter === "all" || String(u.role_id) === roleFilter;

            const matchStatus =
                statusFilter === "all" || u.status === statusFilter;

            return matchSearch && matchRole && matchStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    return (
        <div dir="rtl" className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={onAdd}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                    افزودن کاربر
                </button>

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder= "جستجو بر اساس نام، نام کاربری یا موبایل..."
                    className="flex-1 min-w-55 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* سلکت باکس فیلتر نقش‌ها با لیست داینامیک دیتابیس */}
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                    <option value="all">همه نقش‌ها</option>
                    {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                </select>
            </div>

            {loading ? (
                <div className="py-10 text-center text-gray-500">در حال بارگذاری...</div>
            ) : error ? (
                <div className="py-10 text-center text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-gray-400">کاربری پیدا نشد 🤷</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-center text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">نام</th>
                            <th className="px-4 py-3 font-medium">موبایل</th>
                            <th className="px-4 py-3 font-medium">نقش</th>
                            <th className="px-4 py-3 font-medium">وضعیت</th>
                            <th className="px-4 py-3 font-medium">عملیات</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filtered.map((u) => {
                            return (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                            {`${u.first_name || ""} ${u.last_name || ""}`.trim()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span dir="ltr">@{u.user_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{u.mobile}</td>
                                    <td className="px-4 py-3">{u.role_name || "نامشخص"}</td>
                                    <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs ${
                                                    u.status === "active"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {u.status === "active" ? "فعال" : "غیرفعال"}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit?.(u)}
                                                className="rounded bg-blue-50 px-3 py-1 text-xs text-blue-600 hover:bg-blue-100"
                                            >
                                                ویرایش
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(u)}
                                                className="rounded bg-red-50 px-3 py-1 text-xs text-red-600 hover:bg-red-100"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                        {filtered.length} کاربر از {users.length} نمایش داده شد
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserListPage;