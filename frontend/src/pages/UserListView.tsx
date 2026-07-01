import { useEffect, useState } from "react"
// نوع Role رو هم ایمپورت کن (مسیرش بستگی به فایلت داره)
import type { User, UserFormData, Role } from "../models/user.ts"
import UserListPage from "./UserListPage.tsx"
import { createUser, deleteUser, fetchUsers, updateUser } from "../api/users.ts";
import { fetchRoles } from "../api/roles.ts";
import UserFormModal from "../components/UserFormModal.tsx";

export default function UsersListView() {

    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([]) // ✅ استیت جدید برای نقش‌ها
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [openModal, setOpenModal] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // ✅ لود کردن همزمان کاربرا و نقش‌ها
    async function loadData() {
        try {
            setLoading(true)
            // با Promise.all هر دو ریکوئست رو همزمان می‌زنیم
            const [usersData, rolesData] = await Promise.all([
                fetchUsers(),
                fetchRoles()
            ])
            setUsers(usersData)
            setRoles(rolesData)
            setError(null)
        } catch (err) {
            setError("خطا در بارگیری اطلاعات 😥")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // موقع حذف یا ثبت فقط کاربرا رو آپدیت می‌کنیم چون نقش‌ها عوض نشدن
    async function refreshUsers() {
        try {
            const data = await fetchUsers()
            setUsers(data)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // ✅ افزودن
    function handleAdd() {
        setEditingUser(null)
        setOpenModal(true)
    }

    // ✅ ویرایش
    function handleEdit(user: User) {
        setEditingUser(user)
        setOpenModal(true)
    }

    // ✅ حذف
    async function handleDelete(user: User) {
        const ok = window.confirm(`حذف کاربر "${user.user_name}" ؟`)
        if (!ok) return

        try {
            await deleteUser(user.id)
            await refreshUsers() // فقط کاربرا رو رفرش می‌کنیم
        } catch (err) {
            alert("حذف ناموفق بود")
        }
    }

    // ✅ ثبت فرم (create / update)
    async function handleSubmit(form: UserFormData) {
        if (editingUser) {
            await updateUser(editingUser.id, form)
        } else {
            await createUser(form)
        }

        setOpenModal(false)
        await refreshUsers() // فقط کاربرا رو رفرش می‌کنیم
    }

    return (
        <>
            <UserListPage
                users={users}
                roles={roles} // ✅ پاس دادن نقش‌ها به لیست
                loading={loading}
                error={error}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <UserFormModal
                open={openModal}
                roles={roles} // ✅ پاس دادن نقش‌ها به مودال فرم
                onClose={() => setOpenModal(false)}
                onSubmit={handleSubmit}
                editingUser={editingUser}
            />
        </>
    )
}
