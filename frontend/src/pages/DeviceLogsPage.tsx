import { useCallback, useEffect, useState } from "react";
import SensorDataCards from "../components/FormattedLogs";
import JalaliDatePicker from "../components/JalaliDatePicker.tsx";
import { FormatToJalali } from "../utils/Formatters.ts";

interface DeviceLog {
    id: number;
    created_at: string;
    data: Record<string, any>;
}

const LogsTable = () => {
    const [logs, setLogs] = useState<DeviceLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // استیت‌های صفحه‌بندی
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // ✨ استیت جدید برای تعداد کل رکوردها
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const limit = 10;

    const [sortBy, setSortBy] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy: sortBy,
                sortOrder: sortOrder,
            });

            if (searchQuery) params.append("imei", searchQuery);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const response = await fetch(`/api/get-device-logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setTotalPages(data.totalPages || 1);
                // ✨ دریافت تعداد کل رکوردها از بک‌اند (حتماً چک کن بک‌اندت اینو بفرسته)
                setTotalRecords(data.totalLogs || 0);
            } else {
                console.error("داداش مشکلی تو گرفتن دیتا پیش اومد!");
            }
        } catch (error) {
            console.error("خطای شبکه:", error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchQuery, startDate, endDate, sortBy, sortOrder]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLogs();
        }, 500);

        const intervalId = setInterval(() => {
            fetchLogs();
        }, 30000);

        return () => {
            clearTimeout(delayDebounceFn);
            clearInterval(intervalId);
        };
    }, [fetchLogs]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, startDate, endDate, sortBy, sortOrder]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
    };

    if (loading && logs.length === 0) return <div className="text-center p-5">در حال بارگذاری... ⏳</div>;

    return (
        <div className="p-4" dir="rtl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">جدول لاگ‌های سنسور 📊</h2>

            {/* بخش فیلترها (بدون تغییر) */}
            <div className="mb-6 flex flex-col md:flex-row items-end gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex-1 w-full">
                    <label className="block text-sm text-gray-600 mb-1">جستجوی IMEI</label>
                    <input
                        type="text"
                        placeholder="IMEI رو وارد کن..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex-1 w-full">
                    <JalaliDatePicker label="از تاریخ" value={startDate} onChange={(val) => setStartDate(val)} />
                </div>
                <div className="flex-1 w-full">
                    <JalaliDatePicker label="تا تاریخ" value={endDate} onChange={(val) => setEndDate(val)} />
                </div>
                {(searchQuery || startDate || endDate) && (
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setStartDate("");
                            setEndDate("");
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-md transition text-sm h-9.5 mb-0.5"
                    >
                        پاک کردن فیلترها
                    </button>
                )}
            </div>

            {/* بخش جدول */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
                    <thead className="bg-gray-100 text-gray-700 select-none">
                    <tr>
                        <th
                            className="py-3 px-4 border-b text-right font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => handleSort("created_at")}
                        >
                            زمان {sortBy === "created_at" && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                        </th>
                        <th
                            className="py-3 px-4 border-b text-right font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => handleSort("imei")}
                        >
                            IMEI {sortBy === "imei" && (sortOrder === "asc" ? "⬆️" : "⬇️")}
                        </th>
                        <th className="py-3 px-4 border-b text-right font-semibold">پارامتر ها</th>
                    </tr>
                    </thead>
                    <tbody>
                    {logs
                        .filter(log => log.data.IMEI !== 'offline')
                        .map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors border-b">
                                <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap text-center" dir="ltr">
                                    {FormatToJalali(log.created_at)}
                                </td>
                                <td className="py-3 px-4 font-mono text-sm text-slate-700 whitespace-nowrap text-center">
                                    {log.data.IMEI || '-'}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                    <SensorDataCards data={log.data} />
                                </td>
                            </tr>
                        ))
                    }
                    </tbody>
                </table>
            </div>

            {/* ✨ بخش صفحه‌بندی آپدیت شده */}
            {totalPages > 0 && (
                <div className="flex flex-col items-center justify-center gap-3 mt-6">
                    <div className="flex items-center gap-2">
                        {/* دکمه اولین */}
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(1)}
                            className={`px-3 py-2 text-sm rounded-md transition ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            اولین
                        </button>

                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className={`px-4 py-2 text-sm rounded-md transition ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                            قبلی
                        </button>

                        <span className="text-sm font-medium text-gray-700 px-2">صفحه {page} از {totalPages}</span>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className={`px-4 py-2 text-sm rounded-md transition ${page === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                            بعدی
                        </button>

                        {/* دکمه آخرین */}
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(totalPages)}
                            className={`px-3 py-2 text-sm rounded-md transition ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            آخرین
                        </button>
                    </div>

                    {/* نمایش تعداد کل رکوردها */}
                    <div className="text-xs text-gray-500 font-medium">
                        تعداد کل رکوردها: <span className="font-bold text-gray-700">{totalRecords.toLocaleString("fa-IR")}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsTable;