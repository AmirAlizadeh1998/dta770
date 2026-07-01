import { showGlobalLoading, hideGlobalLoading } from "../services/LoadingService"

function getAuthHeaders() {
    const token = localStorage.getItem("token")

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {

    showGlobalLoading("در حال دریافت اطلاعات...")

    try {
        const response = await fetch(`${endpoint}`, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        })

        if (response.status === 401) {
            // توکن رو پاک می‌کنیم چون به هر حال نامعتبره
            localStorage.removeItem("token")

            // 👈 تغییر اصلی اینجاست:
            // چک می‌کنیم اگه درخواست برای API لاگین نبود، کاربر رو بندازه بیرون
            // (فرض بر اینه که تو آدرسِ API لاگینت کلمه "login" وجود داره)
            if (!endpoint.includes("login") && window.location.pathname !== "/") {
                window.location.href = "/"
            }

            // ارور رو پرتاب می‌کنیم تا فرمِ لاگین بگیرتش و نشون بده
            throw new Error("نام کاربری یا رمز عبور اشتباه است (یا نشست منقضی شده).")
        }

        if (!response.ok) {
            const text = await response.text()
            throw new Error(text || `HTTP ${response.status}`)
        }

        return response

    } finally {
        hideGlobalLoading()
    }
}