import { useState, useEffect, useRef } from "react";
import {
    MdAdminPanelSettings,
    MdFilterList,
    MdRefresh,
    MdCloudUpload,
    MdPictureAsPdf,
    MdComment,
    MdClose,
    MdCheck
} from "react-icons/md";
import { FormatToJalali } from "../../utils/Formatters.ts";
import { apiFetch } from "../../api/ApiClient.ts";

interface AdminReport {
    id: number;
    user_id: number;
    full_name: string;
    mobile: string;
    device_id: number;
    device_name: string;
    from_date: string;
    to_date: string;
    file_path?: string | null;
    admin_note?: string | null;
    created_at: string;
    updated_at: string;
    status: string;
}

const STATUS_OPTIONS = [
    "در صف پیگیری",
    "تایید شد",
    "در حال پردازش",
    "تکمیل شد",
    "عدم تایید",
    "لغو شده",
];

// آدرس بیس سرور بک‌اند (برای سرو فایل‌های استاتیک)
const BACKEND_BASE_URL = "http://localhost:8080";

export default function AdminFinalReportPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // استیت‌های مودال یادداشت
    const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
    const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
    const [currentNoteText, setCurrentNoteText] = useState<string>("");
    const [savingNote, setSavingNote] = useState<boolean>(false);

    // اینپوت مخفی فایل
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [targetReportId, setTargetReportId] = useState<number | null>(null);

    const authToken = `Bearer ${localStorage.getItem("token")}`;

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/api/admin/final-report", {
                headers: { "Authorization": authToken }
            });
            if (res.ok) {
                const data = await res.json();
                setReports(data || []);
            }
        } catch (err) {
            console.error("خطا در واکشی گزارش‌ها:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleStatusChange = async (reportId: number, newStatus: string) => {
        setUpdatingId(reportId);
        try {
            const res = await apiFetch(`/api/admin/final-report/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setReports(prev =>
                    prev.map(item => item.id === reportId ? { ...item, status: newStatus } : item)
                );
            } else {
                alert("خطا در تغییر وضعیت درخواست!");
            }
        } catch (err) {
            console.error("خطا در تغییر وضعیت:", err);
            alert("ارتباط با سرور برقرار نشد.");
        } finally {
            setUpdatingId(null);
        }
    };

    // باز کردن مودال یادداشت
    const handleOpenNoteModal = (report: AdminReport) => {
        setSelectedReport(report);
        setCurrentNoteText(report.admin_note || "");
        setNoteModalOpen(true);
    };

    // ذخیره یادداشت ادمین
    const handleSaveNote = async () => {
        if (!selectedReport) return;

        setSavingNote(true);
        try {
            const res = await apiFetch(`/api/admin/final-report/${selectedReport.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authToken
                },
                body: JSON.stringify({ admin_note: currentNoteText })
            });

            if (res.ok) {
                setReports(prev =>
                    prev.map(item =>
                        item.id === selectedReport.id
                            ? { ...item, admin_note: currentNoteText }
                            : item
                    )
                );
                setNoteModalOpen(false);
            } else {
                alert("خطا در ذخیره یادداشت!");
            }
        } catch (err) {
            console.error("خطا در ارسال یادداشت:", err);
            alert("خطا در برقراری ارتباط با سرور");
        } finally {
            setSavingNote(false);
        }
    };

    // باز کردن پنجره انتخاب فایل
    const handleSelectFileClick = (reportId: number) => {
        setTargetReportId(reportId);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    // آپلود فایل PDF
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !targetReportId) return;

        if (file.type !== "application/pdf") {
            alert("تنها فایل‌های با فرمت PDF مجاز هستند.");
            return;
        }

        const formData = new FormData();
        formData.append("report_id", targetReportId.toString());
        formData.append("pdf", file);

        setUploadingId(targetReportId);
        try {
            const res = await apiFetch("/api/admin/final-report/upload", {
                method: "POST",
                headers: {
                    "Authorization": authToken
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setReports(prev =>
                    prev.map(item =>
                        item.id === targetReportId
                            ? { ...item, file_path: data.file_path, status: "تکمیل شد" }
                            : item
                    )
                );
            } else {
                const errMsg = await res.text();
                alert(`خطا در آپلود فایل: ${errMsg}`);
            }
        } catch (err) {
            console.error("خطا در ارسال فایل:", err);
            alert("خطا در برقراری ارتباط با سرور");
        } finally {
            setUploadingId(null);
            setTargetReportId(null);
        }
    };

    // تصحیح آدرس برای جلوگیری از لود صفحه وب اپ به جای فایل دانلودی
    const getDownloadUrl = (filePath: string) => {
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }
        const cleanedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
        return `${BACKEND_BASE_URL}${cleanedPath}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "در صف پیگیری": return "bg-blue-100 text-blue-700 border-blue-200";
            case "تایید شد": return "bg-teal-100 text-teal-700 border-teal-200";
            case "در حال پردازش": return "bg-amber-100 text-amber-700 border-amber-200";
            case "تکمیل شد": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "عدم تایید": return "bg-rose-100 text-rose-700 border-rose-200";
            case "لغو شده": return "bg-gray-100 text-gray-500 border-gray-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const filteredReports = statusFilter === "all"
        ? reports
        : reports.filter(r => r.status === statusFilter);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* هدر صفحه */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <MdAdminPanelSettings className="text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">مدیریت درخواست‌های گزارش نهایی</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            بررسی وضعیت، ثبت یادداشت و بارگذاری گزارش PDF
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
                        <MdFilterList className="text-gray-500 text-lg" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none outline-none text-gray-700 cursor-pointer"
                        >
                            <option value="all">همه وضعیت‌ها ({reports.length})</option>
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>
                                    {opt} ({reports.filter(r => r.status === opt).length})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchReports}
                        disabled={loading}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                        title="تازه سازی"
                    >
                        <MdRefresh className={`text-xl ${loading ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                </div>
            </div>

            {/* جدول مدیریت با اسکرول افقی */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-right border-collapse text-sm">
                        <thead>
                        <tr className="bg-gray-50/80 text-gray-600 border-b border-gray-200 whitespace-nowrap">
                            <th className="p-4 font-semibold w-16">شناسه</th>
                            <th className="p-4 font-semibold">کاربر درخواست‌دهنده</th>
                            <th className="p-4 font-semibold">دستگاه</th>
                            <th className="p-4 font-semibold">بازه زمانی</th>
                            <th className="p-4 font-semibold">تاریخ ثبت</th>
                            <th className="p-4 font-semibold text-center">وضعیت</th>
                            <th className="p-4 font-semibold text-center">عملیات، یادداشت و فایل</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 whitespace-nowrap">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center p-8 text-gray-500">
                                    در حال واکشی اطلاعات...
                                </td>
                            </tr>
                        ) : filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center p-8 text-gray-500">
                                    هیچ درخواستی با این فیلتر یافت نشد.
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((item) => {
                                const isUpdating = updatingId === item.id;
                                const isUploading = uploadingId === item.id;
                                const isCancelled = item.status === "لغو شده";

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/60 transition">
                                        <td className="p-4 font-mono font-bold text-gray-800">
                                            #{item.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{item.full_name}</div>
                                            <div className="text-xs text-gray-400 dir-ltr text-right mt-0.5">{item.mobile}</div>
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {item.device_name}
                                        </td>
                                        <td className="p-4 text-xs text-gray-600">
                                            <div>از: <span className="dir-ltr inline-block font-mono">{FormatToJalali(item.from_date)}</span></div>
                                            <div className="mt-1">تا: <span className="dir-ltr inline-block font-mono">{FormatToJalali(item.to_date)}</span></div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 dir-ltr text-right font-mono">
                                            {FormatToJalali(item.created_at)}
                                        </td>

                                        {/* ستون وضعیت - بدون شکستن خط */}
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>

                                        {/* ستون عملیات */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* تغییر وضعیت دستی */}
                                                <select
                                                    disabled={isUpdating || isCancelled}
                                                    value={item.status}
                                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                    className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none cursor-pointer transition whitespace-nowrap ${
                                                        isUpdating || isCancelled
                                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                            : "bg-white text-gray-700 border-gray-300 hover:border-indigo-500"
                                                    }`}
                                                >
                                                    {STATUS_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>

                                                {/* دکمه آپلود فایل پی‌دی‌اف */}
                                                <button
                                                    onClick={() => handleSelectFileClick(item.id)}
                                                    disabled={isUploading || isCancelled}
                                                    title={item.file_path ? "جایگزینی فایل گزارش" : "آپلود فایل گزارش"}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap shrink-0 ${
                                                        isCancelled
                                                            ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                                            : item.file_path
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                                    }`}
                                                >
                                                    <MdCloudUpload className={`text-base ${isUploading ? "animate-bounce" : ""}`} />
                                                    <span>{isUploading ? "درحال آپلود..." : (item.file_path ? "تغییر PDF" : "آپلود PDF")}</span>
                                                </button>

                                                {/* دکمه ثبت / مشاهده یادداشت */}
                                                <button
                                                    onClick={() => handleOpenNoteModal(item)}
                                                    title={item.admin_note ? `یادداشت: ${item.admin_note}` : "افزودن یادداشت برای کاربر"}
                                                    className={`p-1.5 rounded-lg border text-sm transition relative shrink-0 ${
                                                        item.admin_note
                                                            ? "bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100"
                                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    <MdComment />
                                                    {item.admin_note && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                                                    )}
                                                </button>

                                                {/* دانلود / مشاهده فایل */}
                                                {item.file_path && (
                                                    <a
                                                        href={getDownloadUrl(item.file_path)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="مشاهده فایل PDF در زبانه جدید"
                                                        className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition inline-flex items-center justify-center shrink-0"
                                                    >
                                                        <MdPictureAsPdf className="text-base" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* مودال یادداشت ادمین */}
            {noteModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b pb-3 mb-4">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <MdComment className="text-amber-500 text-xl" />
                                یادداشت ادمین برای درخواست #{selectedReport.id}
                            </h3>
                            <button
                                onClick={() => setNoteModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            >
                                <MdClose className="text-xl" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">
                            این یادداشت برای کاربر مربوطه نمایش داده می‌شود (مثلاً توضیح علت رد درخواست یا توضیحات فایل).
                        </p>

                        <textarea
                            value={currentNoteText}
                            onChange={(e) => setCurrentNoteText(e.target.value)}
                            rows={4}
                            placeholder="متن یادداشت را اینجا بنویسید..."
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition"
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setNoteModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                disabled={savingNote}
                                onClick={handleSaveNote}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
                            >
                                <MdCheck className="text-base" />
                                {savingNote ? "در حال ثبت..." : "ذخیره یادداشت"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}