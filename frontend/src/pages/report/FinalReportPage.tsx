import { useState, useEffect } from "react";
import {
    MdAddAlert,
    MdHistory,
    MdPictureAsPdf,
    MdInfoOutline,
    MdClose
} from "react-icons/md";
import Select from "react-select";
import JalaliDatePicker from "../../components/JalaliDatePicker.tsx";
import { FormatToJalali } from "../../utils/Formatters.ts";
import { apiFetch } from "../../api/ApiClient.ts";
import type { Device } from "../../models/device.ts";

interface Report {
    id: number;
    device_id: number;
    from_date: string;
    to_date: string;
    created_at: string;
    status: string;
    file_path?: string | null;
    admin_note?: string | null;
}

const BACKEND_BASE_URL = "http://localhost:8080";

export default function FinalReportPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<{ value: string; label: string; deviceName: string } | null>(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // استیت مشاهده جزئیات یادداشت ادمین
    const [activeNote, setActiveNote] = useState<{ id: number; note: string } | null>(null);

    const token = `Bearer ${localStorage.getItem("token")}`;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "در صف پیگیری":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "تایید شد":
                return "bg-teal-100 text-teal-700 border-teal-200";
            case "در حال پردازش":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "تکمیل شد":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "عدم تایید":
                return "bg-rose-100 text-rose-700 border-rose-200";
            case "لغو شده":
                return "bg-gray-100 text-gray-500 border-gray-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getDownloadUrl = (filePath: string) => {
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }
        const cleanedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
        return `${BACKEND_BASE_URL}${cleanedPath}`;
    };

    const fetchData = async () => {
        try {
            const devRes = await apiFetch("/api/devices", { headers: { "Authorization": token } });
            const devData = await devRes.json();
            const deviceList = Array.isArray(devData) ? devData : Array.isArray(devData?.data) ? devData.data : [];
            setDevices(deviceList);

            const repRes = await apiFetch("/api/final-report", { headers: { "Authorization": token } });
            if (repRes.ok) {
                const repData = await repRes.json();
                setReports(repData || []);
            }
        } catch (error) {
            console.error("خطا در دریافت اطلاعات:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const deviceOptions = devices.map((device) => ({
        value: String(device.id),
        label: `${device.device_name} - ${device.imei}`,
        deviceName: device.device_name
    }));

    const getDeviceName = (deviceId: number) => {
        const device = devices.find(d => d.id === deviceId);
        return device ? device.device_name : "دستگاه نامشخص";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDevice) return alert("داداش اول دستگاه رو انتخاب کن!");
        if (!fromDate || !toDate) return alert("لطفا هر دو تاریخ رو انتخاب کن!");

        setIsSubmitting(true);
        const payload = {
            from_date: fromDate,
            to_date: toDate,
            device_id: Number(selectedDevice.value)
        };

        try {
            const response = await apiFetch("/api/final-report", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const newReport = await response.json();
                alert("درخواست گزارش با موفقیت ثبت شد!");
                setReports(prev => [newReport, ...prev]);
                setSelectedDevice(null);
                setFromDate("");
                setToDate("");
            } else {
                alert("خطا در ثبت درخواست. دیتابیس جواب نداد!");
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("ارتباط با سرور قطع شد!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // تابع لغو درخواست
    const handleCancel = async (id: number) => {
        if (!window.confirm("مطمئنی می‌خوای این درخواست رو لغو کنی؟")) return;

        try {
            const res = await apiFetch(`/api/final-report/${id}`, {
                method: "DELETE",
                headers: { "Authorization": token }
            });

            if (res.ok) {
                setReports(prevReports =>
                    prevReports.map(report =>
                        report.id === id ? { ...report, status: "لغو شده" } : report
                    )
                );
            } else {
                alert("مشکلی در لغو درخواست پیش اومد.");
            }
        } catch (error) {
            console.error("Error cancelling:", error);
            alert("ارتباط با سرور قطع شد!");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
            {/* هدر */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">درخواست گزارش نهایی</h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        دستگاه و بازه زمانی مورد نظرت رو برای دریافت گزارش کامل انتخاب کن.
                    </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <MdAddAlert className="text-3xl" />
                </div>
            </div>

            {/* فرم ثبت */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            انتخاب دستگاه <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={deviceOptions}
                            value={selectedDevice}
                            onChange={setSelectedDevice}
                            placeholder={devices.length === 0 ? "در حال دریافت لیست دستگاه‌ها..." : "جستجو یا انتخاب دستگاه..."}
                            noOptionsMessage={() => "دستگاهی پیدا نشد"}
                            isClearable
                            isLoading={devices.length === 0}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <JalaliDatePicker label="از تاریخ" value={fromDate} onChange={setFromDate} required />
                        <JalaliDatePicker label="تا تاریخ" value={toDate} onChange={setToDate} required />
                    </div>
                    <div className="flex justify-end mt-2 pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full md:w-auto text-white font-medium py-2.5 px-8 rounded-xl transition flex items-center justify-center gap-2 ${
                                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "در حال ثبت..." : "ثبت درخواست"}
                        </button>
                    </div>
                </form>
            </div>

            {/* جدول تاریخچه با ساپورت فایل و یادداشت */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <MdHistory className="text-2xl text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-800">تاریخچه درخواست‌های شما</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-right border-collapse">
                        <thead>
                        <tr className="bg-gray-50/80 text-gray-600 text-sm border-b border-gray-200 whitespace-nowrap">
                            <th className="p-3 font-semibold">شناسه</th>
                            <th className="p-3 font-semibold">نام دستگاه</th>
                            <th className="p-3 font-semibold">از تاریخ</th>
                            <th className="p-3 font-semibold">تا تاریخ</th>
                            <th className="p-3 font-semibold">تاریخ ثبت</th>
                            <th className="p-3 font-semibold text-center">وضعیت</th>
                            <th className="p-3 font-semibold text-center">فایل و توضیحات</th>
                            <th className="p-3 font-semibold text-center">عملیات</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 whitespace-nowrap text-sm">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center p-8 text-gray-500">
                                    هنوز هیچ درخواستی ثبت نکردی!
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => {
                                const isCancelled = report.status === "لغو شده";
                                const canCancel = report.status === "در صف پیگیری";

                                return (
                                    <tr
                                        key={report.id}
                                        className={`transition ${isCancelled ? "bg-gray-50/60 opacity-65" : "hover:bg-gray-50/60"}`}
                                    >
                                        <td className="p-3 font-mono font-bold text-gray-900">#{report.id}</td>
                                        <td className="p-3 font-medium text-gray-800">{getDeviceName(report.device_id)}</td>
                                        <td className="p-3 text-gray-600 dir-ltr text-right font-mono text-xs">{FormatToJalali(report.from_date)}</td>
                                        <td className="p-3 text-gray-600 dir-ltr text-right font-mono text-xs">{FormatToJalali(report.to_date)}</td>
                                        <td className="p-3 text-gray-500 dir-ltr text-right font-mono text-xs">{FormatToJalali(report.created_at)}</td>

                                        {/* بج وضعیت */}
                                        <td className="p-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(report.status)}`}>
                                                {report.status}
                                            </span>
                                        </td>

                                        {/* فایل پی‌دی‌اف و یادداشت ادمین */}
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* دکمه دانلود PDF */}
                                                {report.file_path ? (
                                                    <a
                                                        href={getDownloadUrl(report.file_path)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="دانلود فایل PDF گزارش"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition text-xs font-medium"
                                                    >
                                                        <MdPictureAsPdf className="text-base" />
                                                        <span>دانلود PDF</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">ندارد</span>
                                                )}

                                                {/* آیکون پیام / یادداشت ادمین */}
                                                {report.admin_note && (
                                                    <button
                                                        onClick={() => setActiveNote({ id: report.id, note: report.admin_note! })}
                                                        title="مشاهده پیام پشتیبانی"
                                                        className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition"
                                                    >
                                                        <MdInfoOutline className="text-base" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* دکمه لغو درخواست */}
                                        <td className="p-3 text-center">
                                            {canCancel ? (
                                                <button
                                                    onClick={() => handleCancel(report.id)}
                                                    className="text-rose-500 hover:text-rose-700 text-xs font-medium px-2 py-1 rounded hover:bg-rose-50 transition"
                                                >
                                                    لغو درخواست
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* مودال نمایش یادداشت ادمین به کاربر */}
            {activeNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b pb-3 mb-3">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <MdInfoOutline className="text-amber-500 text-xl" />
                                پیام پشتیبانی برای درخواست #{activeNote.id}
                            </h3>
                            <button
                                onClick={() => setActiveNote(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <MdClose className="text-xl" />
                            </button>
                        </div>

                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {activeNote.note}
                        </div>

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setActiveNote(null)}
                                className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
                            >
                                متوجه شدم
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}