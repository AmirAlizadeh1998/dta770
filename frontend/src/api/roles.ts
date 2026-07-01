import type {Role} from "../models/user";

export async function fetchRoles(): Promise<Role[]> {
    // گرفتن توکن از لوکال استوریج (یا هر جایی که ذخیره کردی)
    const token = localStorage.getItem("token");

    const response = await fetch(`api/roles`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // ✅ ارسال توکن JWT
        }
    });

    if (!response.ok) {
        throw new Error("ای بابا، نقش‌ها لود نشدن! 😥");
    }

    return response.json();
}
