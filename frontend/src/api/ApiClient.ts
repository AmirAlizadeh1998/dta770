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
    showGlobalLoading("در حال دریافت اطلاعات...");

    // تشخیص اینکه آیا بدنه درخواست از نوع FormData هست یا نه
    const isFormData = options.body instanceof FormData;

    // هدرهای احراز هویت رو می‌گیریم
    const authHeaders = getAuthHeaders();

    // ترکیب هدرها:
    // ۱. هدرهای احراز هویت
    // ۲. هدر پیش‌فرض JSON (فقط در صورتی که بدنه درخواست FormData نباشد)
    // ۳. هدرهایی که خود کاربر دستی در options.headers فرستاده
    const headers: Record<string, string> = {
        ...authHeaders,
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers as Record<string, string>)
    };

    // اگر بدنه از نوع FormData بود، حتماً مقدار Content-Type رو از هدر حذف می‌کنیم
    // تا خود مرورگر boundary و مشخصات وب فایل رو به درستی و داینامیک بسازه
    if (isFormData) {
        delete headers["Content-Type"];
        delete headers["content-type"]; // محض احتیاط برای حروف کوچک
    }

    try {
        const response = await fetch(`${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.removeItem("token");

            if (!endpoint.includes("login") && window.location.pathname !== "/") {
                window.location.href = "/";
            }

            throw new Error("نام کاربری یا رمز عبور اشتباه است (یا نشست منقضی شده).");
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}`);
        }

        return response;

    } finally {
        hideGlobalLoading();
    }
}