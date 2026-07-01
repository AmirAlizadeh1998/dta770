import { apiFetch } from "./ApiClient.ts";

export async function loginUser(credentials: any) {
    const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    // اگه وضعیت ریسپانس 200 تا 299 نباشه (مثلا 401 باشه) این شرط اجرا میشه
    if (!res.ok) {
        // اینجا یه ارور پرت می‌کنیم تا تو کامپوننت لاگین بره تو بلاک catch
        throw new Error("نام کاربری یا رمز عبور اشتباه است");
    }

    return res.json();
}