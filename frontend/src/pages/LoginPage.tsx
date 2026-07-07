import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth.ts";

export function LoginPage() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const response = await loginUser({
                user_name: userName,
                password: password
            });

            // اگه بک‌اند توکن داد، یعنی ورود موفق بوده
            if (response && response.token) {
                localStorage.setItem("token", response.token);
                console.log("توکن با موفقیت ذخیره شد! 🎫");
                navigate("/dashboard", { replace: true });
            } else {
                // اگه درخواست موفقیت‌آمیز بود ولی توکنی توش نبود (مثلاً بک‌اند پیام ارور برگردونده)
                setError("نام کاربری یا رمز عبور اشتباه است ❌");
            }
        } catch (err: any) {
            // اگه کلاً درخواست fail بشه (مثل ارور 401 Unauthorized یا قطعی نت)
            setError("نام کاربری یا رمز عبور اشتباه است ❌");
            console.error("Login Error:", err);
        }
    };

    return (
        <div className="container mx-auto flex items-center justify-center p-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                    ورود به پنل
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        {/*<label className="block text-sm font-medium text-gray-700 mb-2">*/}
                        {/*    نام کاربری:*/}
                        {/*</label>*/}
                        <input
                            type="text"
                            required
                            value={userName} /* 👈 این رو اضافه کردم */
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            placeholder="نام کاربری"
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </div>

                    <div>
                        {/*<label className="block text-sm font-medium text-gray-700 mb-2">*/}
                        {/*    رمز عبور:*/}
                        {/*</label>*/}
                        <input
                            type="password"
                            required
                            value={password} /* 👈 این رو هم اضافه کردم */
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                            placeholder="رمز عبور"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* اگه اروری باشه اینجا بدون رفرش شدن نشون داده میشه */}
                    {error && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-600 text-sm text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition transform active:scale-95"
                    >
                        بزن بریم تو! 🚀
                    </button>
                </form>
            </div>
        </div>
    );
}