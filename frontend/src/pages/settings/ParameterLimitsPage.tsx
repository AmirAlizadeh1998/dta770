import { useEffect, useState } from "react";
import { MdRefresh, MdSave, MdTune, MdDevices, MdInfoOutline } from "react-icons/md";

export interface Device {
    id: number;
    device_name: string;
    serial_number?: string;
    device_type?: string;
}

export interface DeviceParameterLimit {
    id?: number;
    parameterId: number;
    parameterName: string;
    labelFa: string;
    unit: string;
    minVal: number | string;
    maxVal: number | string;
    isActive: boolean;
}

export default function ParameterLimitsPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);

    const [limits, setLimits] = useState<DeviceParameterLimit[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const getHeaders = () => {
        const token = localStorage.getItem("token") || "";
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    };

    const showFeedback = (type: "success" | "error", text: string) => {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 4000);
    };

    const fetchDevices = async () => {
        setDevicesLoading(true);
        try {
            const res = await fetch("/api/devices", { headers: getHeaders() });
            if (!res.ok) throw new Error("خطا در دریافت لیست دستگاه‌ها");

            const data = await res.json();
            const deviceList: Device[] = Array.isArray(data) ? data : data.devices || [];
            setDevices(deviceList);

            if (deviceList.length > 0) {
                setSelectedDeviceId(deviceList[0].id);
            }
        } catch (error) {
            console.error("Fetch Devices Error:", error);
            showFeedback("error", "خطا در دریافت لیست دستگاه‌ها از سرور");
        } finally {
            setDevicesLoading(false);
        }
    };

    const fetchLimits = async (deviceId: number) => {
        setFetching(true);
        try {
            const res = await fetch(`/api/limits?device_id=${deviceId}`, { headers: getHeaders() });
            if (!res.ok) throw new Error("خطا در دریافت حدود پارامترها");

            const rawData = await res.json();

            const mapped: DeviceParameterLimit[] = (rawData || []).map((item: any) => ({
                id: item.id ?? undefined,
                parameterId: item.parameter_id,
                parameterName: item.parameter_name ?? "",
                labelFa: item.label_fa ?? "",
                unit: item.unit ?? "",
                minVal: item.min_val !== null && item.min_val !== undefined ? item.min_val : "",
                maxVal: item.max_val !== null && item.max_val !== undefined ? item.max_val : "",
                isActive: item.is_active ?? true
            }));

            setLimits(mapped);
        } catch (error) {
            console.error("Fetch Limits Error:", error);
            showFeedback("error", "خطا در دریافت حدود پارامترها برای دستگاه انتخابی");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    useEffect(() => {
        if (selectedDeviceId) {
            fetchLimits(selectedDeviceId);
        }
    }, [selectedDeviceId]);

    const handleChange = (index: number, field: keyof DeviceParameterLimit, value: any) => {
        const updated = [...limits];
        updated[index] = { ...updated[index], [field]: value };
        setLimits(updated);
    };

    const handleSave = async () => {
        if (!selectedDeviceId) {
            showFeedback("error", "لطفاً ابتدا یک دستگاه را انتخاب کنید.");
            return;
        }

        setLoading(true);
        try {
            // نکته: اگه می‌خوای عنوان، نام کلید و واحد تو دیتابیس آپدیت بشن،
            // باید اونا رو هم به payload اضافه کنی (و البته تو بک‌اند هندلش کنی)
            const payload = limits.map(item => ({
                parameter_id: item.parameterId,
                parameter_name: item.parameterName,
                label_fa: item.labelFa,
                unit: item.unit,
                min_val: item.minVal === "" ? null : String(item.minVal),
                max_val: item.maxVal === "" ? null : String(item.maxVal),
                is_active: Boolean(item.isActive)
            }));

            const res = await fetch(`/api/limits?device_id=${selectedDeviceId}`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "خطا در به‌روزرسانی تنظیمات");
            }

            showFeedback("success", "تنظیمات با موفقیت ذخیره شدند.");
            await fetchLimits(selectedDeviceId);
        } catch (error: any) {
            console.error("Save Error:", error);
            showFeedback("error", error.message || "خطا در برقراری ارتباط با سرور");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4" dir="rtl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MdTune className="text-blue-600 text-2xl" />
                        تنظیم آستانه‌ها و حدود مجاز پارامترها
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        تعیین بازه‌های مجاز به ازای هر تجهیز جهت مانیتورینگ دقیق و ارسال هشدارهای فوری.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5">
                        <MdDevices className="text-gray-500 text-xl" />
                        <select
                            value={selectedDeviceId ?? ""}
                            onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
                            disabled={devicesLoading || fetching || loading}
                            className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer"
                        >
                            {devicesLoading ? (
                                <option value="">در حال لود دستگاه‌ها...</option>
                            ) : devices.length === 0 ? (
                                <option value="">هیچ دستگاهی یافت نشد</option>
                            ) : (
                                devices.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.device_name} {d.serial_number ? `(${d.serial_number})` : ""}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <button
                        onClick={() => selectedDeviceId && fetchLimits(selectedDeviceId)}
                        disabled={fetching || loading || !selectedDeviceId}
                        className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                        title="تازه‌سازی اطلاعات"
                    >
                        <MdRefresh className={`text-xl ${fetching ? "animate-spin" : ""}`} />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading || fetching || !selectedDeviceId}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                        <MdSave className="text-lg" />
                        {loading ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات"}
                    </button>
                </div>
            </div>

            {feedback && (
                <div
                    className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                        feedback.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                >
                    {feedback.text}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">عنوان پارامتر</th>
                            <th className="p-4 w-52">نام کلید (سیستمی)</th>
                            <th className="p-4 w-24 text-center">واحد</th>
                            <th className="p-4 w-36">حداقل مجاز (Min)</th>
                            <th className="p-4 w-36">حداکثر مجاز (Max)</th>
                            <th className="p-4 text-center w-28">وضعیت پایش</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                        {fetching || devicesLoading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    در حال بارگذاری اطلاعات پارامترهای دستگاه...
                                </td>
                            </tr>
                        ) : limits.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <MdInfoOutline className="text-2xl text-gray-400" />
                                        <span>پارامتری برای این دستگاه یافت نشد.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            limits.map((item, index) => (
                                <tr
                                    key={item.parameterId}
                                    className={`hover:bg-gray-50/70 transition ${!item.isActive ? "opacity-60 bg-gray-50/30" : ""}`}
                                >
                                    <td className="p-3 text-center text-gray-400 text-xs font-mono">
                                        {index + 1}
                                    </td>

                                    {/* ۱. عنوان فارسی قابل ویرایش */}
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            disabled={!item.isActive}
                                            value={item.labelFa}
                                            onChange={(e) => handleChange(index, "labelFa", e.target.value)}
                                            placeholder="عنوان فارسی"
                                            className="w-full px-3 py-1.5 border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg text-sm transition-all bg-transparent focus:bg-white disabled:hover:border-transparent"
                                        />
                                    </td>

                                    {/* ۲. نام انگلیسی قابل ویرایش */}
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            disabled={!item.isActive}
                                            value={item.parameterName}
                                            onChange={(e) => handleChange(index, "parameterName", e.target.value)}
                                            placeholder="نام کلید"
                                            className="w-full px-3 py-1.5 border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg font-mono text-xs text-left transition-all bg-transparent focus:bg-white disabled:hover:border-transparent"
                                            dir="ltr"
                                        />
                                    </td>

                                    {/* ۳. واحد قابل ویرایش */}
                                    <td className="p-3 text-center">
                                        <input
                                            type="text"
                                            disabled={!item.isActive}
                                            value={item.unit}
                                            onChange={(e) => handleChange(index, "unit", e.target.value)}
                                            placeholder="—"
                                            className="w-24 text-center px-2 py-1.5 border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg font-mono text-xs text-blue-700 font-semibold transition-all bg-transparent focus:bg-white disabled:hover:border-transparent mx-auto block"
                                        />
                                    </td>

                                    {/* ۴. حداقل (Min) */}
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            step="any"
                                            disabled={!item.isActive}
                                            value={item.minVal}
                                            onChange={(e) => handleChange(index, "minVal", e.target.value)}
                                            placeholder="نامحدود"
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                            dir="ltr"
                                        />
                                    </td>

                                    {/* ۵. حداکثر (Max) */}
                                    <td className="p-3">
                                        <input
                                            type="number"
                                            step="any"
                                            disabled={!item.isActive}
                                            value={item.maxVal}
                                            onChange={(e) => handleChange(index, "maxVal", e.target.value)}
                                            placeholder="نامحدود"
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                            dir="ltr"
                                        />
                                    </td>

                                    {/* ۶. وضعیت پایش (فعال / غیرفعال) */}
                                    <td className="p-3 text-center">
                                        <label className="inline-flex items-center cursor-pointer gap-2">
                                            <input
                                                type="checkbox"
                                                checked={item.isActive}
                                                onChange={(e) => handleChange(index, "isActive", e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="text-xs text-gray-500">
                                                {item.isActive ? "فعال" : "غیرفعال"}
                                            </span>
                                        </label>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}