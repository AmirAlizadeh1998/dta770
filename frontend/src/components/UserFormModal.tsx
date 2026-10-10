import React, { useEffect, useState } from "react"
import type { Role, User, UserFormData } from "../models/user"

interface Props {
    open: boolean
    onClose: () => void
    onSubmit: (data: UserFormData) => Promise<void>
    editingUser?: User | null
    roles?: Role[]              // اختیاری شد، چون اگه نقش ثابت باشه شاید اصلاً لیست نقش‌ها رو لود نکرده باشی
    fixedRoleId?: number        // نقش اجباری/ثابت (مثلاً آیدی نقش User)
    defaultRoleId?: number      // نقش پیش‌فرض (که کاربر بتونه در صورت نیاز تغییرش هم بده)
}

export default function UserFormModal({
    open,
    onClose,
    onSubmit,
    editingUser,
    roles = [],
    fixedRoleId,
    defaultRoleId
}: Props) {

    const [form, setForm] = useState<UserFormData>({
        role_id: fixedRoleId ?? defaultRoleId ?? 0,
        user_name: "",
        full_name: "",
        mobile: "",
        password: "",
        status: "active"
    })

    useEffect(() => {
        if (!open) return

        if (editingUser) {
            setForm({
                role_id: fixedRoleId ?? editingUser.role_id,
                user_name: editingUser.user_name,
                full_name: editingUser.full_name,
                mobile: editingUser.mobile,
                password: "",
                status: editingUser.status
            })
        } else {
            // موقع ساخت کاربر جدید
            setForm({
                role_id: fixedRoleId ?? defaultRoleId ?? 0,
                user_name: "",
                full_name: "",
                mobile: "",
                password: "",
                status: "active"
            })
        }
    }, [editingUser, open, fixedRoleId, defaultRoleId])

    if (!open) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        // اگه نقش اجباری داشتیم اطمینان پیدا می‌کنیم که همون ارسال بشه
        const submitData = fixedRoleId ? { ...form, role_id: fixedRoleId } : form
        await onSubmit(submitData)
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-lg font-bold mb-4">
                    {editingUser ? "ویرایش کاربر" : "افزودن کاربر"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">

                    <input
                        type="text"
                        placeholder="نام کاربری"
                        value={form.user_name}
                        onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                    />

                    <input
                        type="text"
                        placeholder="نام و نام خانوادگی"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                    />

                    <input
                        type="text"
                        placeholder="موبایل"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required
                    />

                    <input
                        type="password"
                        placeholder={editingUser ? "رمز جدید (اختیاری)" : "رمز عبور"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        required={!editingUser}
                    />

                    {/* اگه fixedRoleId پاس داده نشده بود، دراپ‌داون رو نشون بده */}
                    {!fixedRoleId && (
                        <div>
                            <label className="block mb-1 text-sm font-medium">نقش کاربر</label>
                            <select
                                value={form.role_id || ""}
                                onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
                                className="w-full border rounded-lg px-3 py-2"
                                required
                            >
                                <option value="" disabled>یک نقش انتخاب کنید...</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name} {role.description ? `(${role.description})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    >
                        <option value="active">فعال</option>
                        <option value="inactive">غیرفعال</option>
                    </select>

                    <div className="flex justify-end gap-2 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                            انصراف
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            ذخیره
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}