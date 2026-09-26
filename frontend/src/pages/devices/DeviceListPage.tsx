import { useEffect, useState } from "react";
import { apiFetch } from "../../api/ApiClient.ts";
import type { Device } from "../../models/device.ts";

export default function DeviceListPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadDevices = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await apiFetch("/api/devices/my", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            // هندل کردن هر دو فرمت خروجی (آرایه مستقیم یا آبجکت حاوی فیلد data)
            const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
            setDevices(list);
        } catch (err) {
            console.error("Failed to load user devices", err);
            setDevices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDevices();
    }, []);

    // فیلتر کردن دستگاه‌ها بر اساس جستجو
    const filteredDevices = devices.filter((device) => {
        const name = device.device_code || device.device_name || "";
        const owner = device.owner_name || "";
        const term = searchTerm.trim().toLowerCase();
        return name.toLowerCase().includes(term) || owner.toLowerCase().includes(term);
    });

    return (
        <div className="p-6">
            {/* هدر صفحه و باکس جستجو */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">دستگاه‌های من</h2>
                    <p className="text-gray-500">
                        لیست تمامی دستگاه‌های ثبت‌شده به نام شما ({devices.length})
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="جستجو در کد یا نام..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                        onClick={() => {
                            setIsLoading(true);
                            loadDevices();
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition"
                    >
                        بروزرسانی
                    </button>
                </div>
            </div>

            {/* وضعیت لودینگ */}
            {isLoading ? (
                <div className="p-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
                    <p className="text-sm">در حال بارگذاری لیست دستگاه‌ها...</p>
                </div>
            ) : filteredDevices.length === 0 ? (
                /* وضعیت لیست خالی */
                <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                    {searchTerm ? "دستگاهی با این مشخصات یافت نشد." : "هیچ دستگاهی به شما اختصاص داده نشده است."}
                </div>
            ) : (
                /* گرید نمایش دستگاه‌ها */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDevices.map((device) => (
                        <div
                            key={device.id}
                            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">
                                        کد دستگاه: {device.device_code}
                                    </span>
                                </div>

                                <h3 className="text-base font-extrabold text-slate-800 mb-1 leading-snug">
                                    {device.device_name || "بدون نام"}
                                </h3>

                                <div className="space-y-2 mt-3 text-sm text-gray-600">
                                    {/* نمایش وضعیت روشن/خاموش بودن دستگاه */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">وضعیت دستگاه:</span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                device.is_active
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    device.is_active ? "bg-emerald-500" : "bg-rose-500"
                                                }`}
                                            />
                                            {device.is_active ? "فعال" : "اتمام ماموریت"}
                                        </span>
                                    </div>

                                    {device.imei && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">IMEI:</span>
                                            <span className="font-mono text-gray-700">{device.imei}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <span>
                                    {device.created_at
                                        ? new Date(device.created_at).toLocaleDateString("fa-IR")
                                        : "تاریخ نامشخص"}
                                </span>
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(
                                            new CustomEvent("monitor-device", {
                                                detail: {
                                                    device_name: device.device_code || device.device_name,
                                                    imei: device.imei
                                                }
                                            })
                                        );
                                    }}
                                    className="text-blue-600 hover:text-blue-700 font-medium transition"
                                >
                                    مشاهده در مانیتور ←
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
