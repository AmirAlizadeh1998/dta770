import { useCallback, useEffect, useState } from "react";
import SensorDataCards from "../../components/FormattedLogs";
import JalaliDatePicker from "../../components/JalaliDatePicker.tsx";
import {FormatSignalQuality, FormatToJalali} from "../../utils/Formatters.ts";
import * as XLSX from 'xlsx'
import {FaFileExcel} from "react-icons/fa";
import Select from "react-select";
import type {Device} from "../../models/device.ts";
import {apiFetch} from "../../api/ApiClient.ts";

interface DeviceLog {
    id: number;
    created_at: string;
    data: Record<string, any>;
}

const LogsTable = () => {
    const token = localStorage.getItem("token");
    const [logs, setLogs] = useState<DeviceLog[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
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
    // کنترل باز و بسته بودن مودال
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // فیلترهای مخصوص اکسل
    const options = devices.map((device) => ({
        value: device.imei,
        label: `${device.device_name} - ${device.imei}`,
        originalData: device
    }));

    const limitOptions = [
        { value: 100, label: '۱۰۰ رکورد آخر' },
        { value: 500, label: '۵۰۰ رکورد آخر' },
        { value: 1000, label: '۱۰۰۰ رکورد آخر' },
        { value: 0, label: 'همه رکوردها (ممکنه طول بکشه)' }
    ];

    const [exportLimit, setExportLimit] = useState(100);
    const [exportImei, setExportImei] = useState('')
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

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

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await apiFetch("/api/devices", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();
                setDevices(data);
            } catch (error) {
                console.error("خطا در دریافت لیست دستگاه‌ها:", error);
            }
        };
        fetchDevices();
    }, [token]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
    };

    const toEnglishDigits = (value: string): string =>
        value
            .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
            .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

    const exportToExcel = async () => {
        try {
            // ۱. پارامترها رو آماده می‌کنیم
            const params = new URLSearchParams();
            if (exportImei) params.append("imei", exportImei);
            if (exportLimit > 0) params.append("limit", exportLimit.toString()); // عدد ۰ یعنی لیمیت نداریم
            if (exportStartDate) params.append("startDate", toEnglishDigits(exportStartDate));
            if (exportEndDate) params.append("endDate", toEnglishDigits(exportEndDate));

            // ۲. درخواست به بک‌اند برای دریافت دیتای کاملِ فیلتر شده
            const response = await fetch(`/api/export-device-logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                alert("مشکلی در دریافت اطلاعات از سرور پیش آمد!");
                return;
            }

            const data = await response.json();
            const exportData = data.logs || [];

            if (exportData.length === 0) {
                alert("با این فیلترها، دیتایی برای خروجی گرفتن پیدا نشد!");
                return;
            }

            const cleanValue = (val: string | undefined | null) => {
                // اگه مقدار خالی بود یا nan و -nan بود، یه خط تیره برمی‌گردونه
                if (!val || val.toLowerCase() === 'nan' || val.toLowerCase() === '-nan') {
                    return '-'; // یا می‌تونی بجاش '0' بذاری
                }
                return val;
            };

            // ۳. فرمت کردن دیتا برای فایل اکسل
            const excelData = exportData
                .filter((log: DeviceLog) => log.data && log.data.IMEI !== 'offline')
                .map((log: DeviceLog) => ({
                    "timestamp": toEnglishDigits(FormatToJalali(log.created_at)),
                    "IMEI": cleanValue(log.data.IMEI),
                    "acin": cleanValue(log.data.acin),
                    "model": cleanValue(log.data.model),

                    // General Info
                    "work_clock": cleanValue(log.data.work_clock),
                    "customer_id": cleanValue(log.data.customer_id),
                    "sig_quality": cleanValue(FormatSignalQuality(log.data.sig_quality)),

                    // IR
                    "ir_ave": cleanValue(log.data.ir_ave),
                    "ir_cur": cleanValue(log.data.ir_cur),
                    "ir_max": cleanValue(log.data.ir_max),
                    "ir_min": cleanValue(log.data.ir_min),
                    // IS
                    "is_ave": cleanValue(log.data.is_ave),
                    "is_cur": cleanValue(log.data.is_cur),
                    "is_max": cleanValue(log.data.is_max),
                    "is_min": cleanValue(log.data.is_min),
                    // IT
                    "it_ave": cleanValue(log.data.it_ave),
                    "it_cur": cleanValue(log.data.it_cur),
                    "it_max": cleanValue(log.data.it_max),
                    "it_min": cleanValue(log.data.it_min),

                    // THD
                    "thd_ir": cleanValue(log.data.thd_ir),
                    "thd_is": cleanValue(log.data.thd_is),
                    "thd_it": cleanValue(log.data.thd_it),
                    "thd_vrn": cleanValue(log.data.thd_vrn),
                    "thd_vrs": cleanValue(log.data.thd_vrs),
                    "thd_vrt": cleanValue(log.data.thd_vrt),
                    "thd_vsn": cleanValue(log.data.thd_vsn),
                    "thd_vst": cleanValue(log.data.thd_vst),
                    "thd_vtn": cleanValue(log.data.thd_vtn),

                    // Frequency
                    "frq_ave": cleanValue(log.data.frq_ave),
                    "frq_cur": cleanValue(log.data.frq_cur),
                    "frq_max": cleanValue(log.data.frq_max),
                    "frq_min": cleanValue(log.data.frq_min),

                    // Voltage RN
                    "v_rn_ave": cleanValue(log.data.v_rn_ave),
                    "v_rn_cur": cleanValue(log.data.v_rn_cur),
                    "v_rn_max": cleanValue(log.data.v_rn_max),
                    "v_rn_min": cleanValue(log.data.v_rn_min),
                    // Voltage RS
                    "v_rs_ave": cleanValue(log.data.v_rs_ave),
                    "v_rs_cur": cleanValue(log.data.v_rs_cur),
                    "v_rs_max": cleanValue(log.data.v_rs_max),
                    "v_rs_min": cleanValue(log.data.v_rs_min),
                    // Voltage RT
                    "v_rt_ave": cleanValue(log.data.v_rt_ave),
                    "v_rt_cur": cleanValue(log.data.v_rt_cur),
                    "v_rt_max": cleanValue(log.data.v_rt_max),
                    "v_rt_min": cleanValue(log.data.v_rt_min),
                    // Voltage SN
                    "v_sn_ave": cleanValue(log.data.v_sn_ave),
                    "v_sn_cur": cleanValue(log.data.v_sn_cur),
                    "v_sn_max": cleanValue(log.data.v_sn_max),
                    "v_sn_min": cleanValue(log.data.v_sn_min),
                    // Voltage TN
                    "v_tn_ave": cleanValue(log.data.v_tn_ave),
                    "v_tn_cur": cleanValue(log.data.v_tn_cur),
                    "v_tn_max": cleanValue(log.data.v_tn_max),
                    "v_tn_min": cleanValue(log.data.v_tn_min),
                    // Voltage TS
                    "v_ts_ave": cleanValue(log.data.v_ts_ave),
                    "v_ts_cur": cleanValue(log.data.v_ts_cur),
                    "v_ts_max": cleanValue(log.data.v_ts_max),
                    "v_ts_min": cleanValue(log.data.v_ts_min),

                    // Cos Phi
                    "cos_r_ave": cleanValue(log.data.cos_r_ave),
                    "cos_r_cur": cleanValue(log.data.cos_r_cur),
                    "cos_r_max": cleanValue(log.data.cos_r_max),
                    "cos_r_min": cleanValue(log.data.cos_r_min),
                    "cos_s_ave": cleanValue(log.data.cos_s_ave),
                    "cos_s_cur": cleanValue(log.data.cos_s_cur),
                    "cos_s_max": cleanValue(log.data.cos_s_max),
                    "cos_s_min": cleanValue(log.data.cos_s_min),
                    "cos_t_ave": cleanValue(log.data.cos_t_ave),
                    "cos_t_cur": cleanValue(log.data.cos_t_cur),
                    "cos_t_max": cleanValue(log.data.cos_t_max),
                    "cos_t_min": cleanValue(log.data.cos_t_min),
                    "cos_total_ave": cleanValue(log.data.cos_total_ave),
                    "cos_total_cur": cleanValue(log.data.cos_total_cur),
                    "cos_total_max": cleanValue(log.data.cos_total_max),
                    "cos_total_min": cleanValue(log.data.cos_total_min),

                    // Active Power
                    "p_act_r_ave": cleanValue(log.data.p_act_r_ave),
                    "p_act_r_cur": cleanValue(log.data.p_act_r_cur),
                    "p_act_r_max": cleanValue(log.data.p_act_r_max),
                    "p_act_r_min": cleanValue(log.data.p_act_r_min),
                    "p_act_s_ave": cleanValue(log.data.p_act_s_ave),
                    "p_act_s_cur": cleanValue(log.data.p_act_s_cur),
                    "p_act_s_max": cleanValue(log.data.p_act_s_max),
                    "p_act_s_min": cleanValue(log.data.p_act_s_min),
                    "p_act_t_ave": cleanValue(log.data.p_act_t_ave),
                    "p_act_t_cur": cleanValue(log.data.p_act_t_cur),
                    "p_act_t_max": cleanValue(log.data.p_act_t_max),
                    "p_act_t_min": cleanValue(log.data.p_act_t_min),
                    "p_act_into_grid": cleanValue(log.data.p_act_into_grid),
                    "p_act_into_load": cleanValue(log.data.p_act_into_load),

                    // Reactive Power
                    "p_ract_r_ave": cleanValue(log.data.p_ract_r_ave),
                    "p_ract_r_cur": cleanValue(log.data.p_ract_r_cur),
                    "p_ract_r_max": cleanValue(log.data.p_ract_r_max),
                    "p_ract_r_min": cleanValue(log.data.p_ract_r_min),
                    "p_ract_s_ave": cleanValue(log.data.p_ract_s_ave),
                    "p_ract_s_cur": cleanValue(log.data.p_ract_s_cur),
                    "p_ract_s_max": cleanValue(log.data.p_ract_s_max),
                    "p_ract_s_min": cleanValue(log.data.p_ract_s_min),
                    "p_ract_t_ave": cleanValue(log.data.p_ract_t_ave),
                    "p_ract_t_cur": cleanValue(log.data.p_ract_t_cur),
                    "p_ract_t_max": cleanValue(log.data.p_ract_t_max),
                    "p_ract_t_min": cleanValue(log.data.p_ract_t_min),
                    "p_ract_into_grid": cleanValue(log.data.p_ract_into_grid),
                    "p_ract_into_load": cleanValue(log.data.p_ract_into_load),

                    // Apparent Power
                    "p_apparent_r_ave": cleanValue(log.data.p_apparent_r_ave),
                    "p_apparent_r_cur": cleanValue(log.data.p_apparent_r_cur),
                    "p_apparent_r_max": cleanValue(log.data.p_apparent_r_max),
                    "p_apparent_r_min": cleanValue(log.data.p_apparent_r_min),
                    "p_apparent_s_ave": cleanValue(log.data.p_apparent_s_ave),
                    "p_apparent_s_cur": cleanValue(log.data.p_apparent_s_cur),
                    "p_apparent_s_max": cleanValue(log.data.p_apparent_s_max),
                    "p_apparent_s_min": cleanValue(log.data.p_apparent_s_min),
                    "p_apparent_t_ave": cleanValue(log.data.p_apparent_t_ave),
                    "p_apparent_t_cur": cleanValue(log.data.p_apparent_t_cur),
                    "p_apparent_t_max": cleanValue(log.data.p_apparent_t_max),
                    "p_apparent_t_min": cleanValue(log.data.p_apparent_t_min),
                    "p_apparent_into_grid": cleanValue(log.data.p_apparent_into_grid),
                    "p_apparent_into_load": cleanValue(log.data.p_apparent_into_load),

                    // Harmonics
                    "harmonic_1_R": cleanValue(log.data.harmonic_1_R),
                    "harmonic_1_S": cleanValue(log.data.harmonic_1_S),
                    "harmonic_1_T": cleanValue(log.data.harmonic_1_T),
                    "harmonic_2_R": cleanValue(log.data.harmonic_2_R),
                    "harmonic_2_S": cleanValue(log.data.harmonic_2_S),
                    "harmonic_2_T": cleanValue(log.data.harmonic_2_T),
                    "harmonic_3_R": cleanValue(log.data.harmonic_3_R),
                    "harmonic_3_S": cleanValue(log.data.harmonic_3_S),
                    "harmonic_3_T": cleanValue(log.data.harmonic_3_T),
                    "harmonic_4_R": cleanValue(log.data.harmonic_4_R),
                    "harmonic_4_S": cleanValue(log.data.harmonic_4_S),
                    "harmonic_4_T": cleanValue(log.data.harmonic_4_T),
                    "harmonic_5_R": cleanValue(log.data.harmonic_5_R),
                    "harmonic_5_S": cleanValue(log.data.harmonic_5_S),
                    "harmonic_5_T": cleanValue(log.data.harmonic_5_T),
                    "harmonic_6_R": cleanValue(log.data.harmonic_6_R),
                    "harmonic_6_S": cleanValue(log.data.harmonic_6_S),
                    "harmonic_6_T": cleanValue(log.data.harmonic_6_T),
                    "harmonic_7_R": cleanValue(log.data.harmonic_7_R),
                    "harmonic_7_S": cleanValue(log.data.harmonic_7_S),
                    "harmonic_7_T": cleanValue(log.data.harmonic_7_T),
                    "harmonic_8_R": cleanValue(log.data.harmonic_8_R),
                    "harmonic_8_S": cleanValue(log.data.harmonic_8_S),
                    "harmonic_8_T": cleanValue(log.data.harmonic_8_T),
                    "harmonic_9_R": cleanValue(log.data.harmonic_9_R),
                    "harmonic_9_S": cleanValue(log.data.harmonic_9_S),
                    "harmonic_9_T": cleanValue(log.data.harmonic_9_T),
                    "harmonic_10_R": cleanValue(log.data.harmonic_10_R),
                    "harmonic_10_S": cleanValue(log.data.harmonic_10_S),
                    "harmonic_10_T": cleanValue(log.data.harmonic_10_T),
                    "harmonic_11_R": cleanValue(log.data.harmonic_11_R),
                    "harmonic_11_S": cleanValue(log.data.harmonic_11_S),
                    "harmonic_11_T": cleanValue(log.data.harmonic_11_T),
                    "harmonic_12_R": cleanValue(log.data.harmonic_12_R),
                    "harmonic_12_S": cleanValue(log.data.harmonic_12_S),
                    "harmonic_12_T": cleanValue(log.data.harmonic_12_T),
                    "harmonic_13_R": cleanValue(log.data.harmonic_13_R),
                    "harmonic_13_S": cleanValue(log.data.harmonic_13_S),
                    "harmonic_13_T": cleanValue(log.data.harmonic_13_T),
                    "harmonic_14_R": cleanValue(log.data.harmonic_14_R),
                    "harmonic_14_S": cleanValue(log.data.harmonic_14_S),
                    "harmonic_14_T": cleanValue(log.data.harmonic_14_T),
                    "harmonic_15_R": cleanValue(log.data.harmonic_15_R),
                    "harmonic_15_S": cleanValue(log.data.harmonic_15_S),
                    "harmonic_15_T": cleanValue(log.data.harmonic_15_T)
                }));

            // ۴. ساخت شیت اکسل
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            worksheet['!dir'] = 'rtl'; // راست‌چین کردن فایل اکسل

            // ۵. ساخت فایل و دانلود
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sensor Logs");

            // یه اسم تر و تمیز برای فایل می‌سازیم
            const fileName = `Export_${exportImei || 'All'}_${new Date().toISOString().slice(0,10)}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            // ۶. بستن مودال بعد از دانلود موفق
            setIsExportModalOpen(false);

        } catch (error) {
            console.error("خطا در خروجی اکسل:", error);
            alert("خطایی در ساخت فایل اکسل رخ داد.");
        }
    };

    const handleDeviceChange = (selectedOption: any) => {
        if (!selectedOption) {
            setExportImei('');
            return;
        }
        setExportImei(selectedOption.value);
    };

    if (loading && logs.length === 0) return <div className="text-center p-5">در حال بارگذاری... ⏳</div>;

    return (
        <div className="p-4" dir="rtl">
            {/* ✨ تغییر اول: عنوان و دکمه اکسل رو گذاشتیم تو یه ردیف */}
            <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-md transition text-sm shadow-sm"
            >
                <FaFileExcel className="text-lg" />
                تنظیمات خروجی اکسل
            </button>

            {/* بخش فیلترها */}
            <div className="mb-6 flex flex-col md:flex-row items-end gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">

                {/* ✨ تغییر دوم: دکمه اکسل قبلی رو از اینجا حذف کن که فقط اینپوت سرچ بمونه */}
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

            {/* مودال تنظیمات خروجی اکسل */}
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">

                        {/* دکمه بستن */}
                        <button
                            onClick={() => setIsExportModalOpen(false)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">تنظیمات خروجی اکسل 📊</h3>

                        <div className="space-y-4">
                            {/* فیلتر تعداد */}
                            <div>
                                <Select
                                    options={options}
                                    value={options.find(option => option.value === exportImei) || null}
                                    onChange={handleDeviceChange}
                                    isRtl={true}
                                    isSearchable={true}
                                    isClearable={true}
                                    placeholder="انتخاب دستگاه..."
                                    noOptionsMessage={() => "دستگاهی پیدا نشد"}
                                    styles={{
                                        control: (base) => ({
                                            ...base, padding: '4px', borderRadius: '8px', borderColor: '#ddd', fontSize: '16px'
                                        })
                                    }}
                                />
                                <Select
                                    options={limitOptions}
                                    value={limitOptions.find(option => option.value === exportLimit) || limitOptions[0]}
                                    onChange={(selectedOption) => setExportLimit(selectedOption ? selectedOption.value : 100)}
                                    isRtl={true}
                                    isSearchable={false} // نیازی به سرچ نداره چون گزینه‌ها کمه
                                    placeholder="انتخاب تعداد..."
                                    styles={{
                                        control: (base) => ({
                                            ...base, padding: '4px', borderRadius: '8px', borderColor: '#ddd', fontSize: '16px'
                                        })
                                    }}
                                />
                            </div>

                            {/* فیلتر از تاریخ */}
                            <div className="flex-1 w-full">
                                <JalaliDatePicker label="از تاریخ" value={exportStartDate} onChange={(val) => setExportStartDate(val)} />
                            </div>

                            {/* فیلتر تا تاریخ */}
                            <div className="flex-1 w-full">
                                <JalaliDatePicker label="تا تاریخ" value={exportEndDate} onChange={(val) => setExportEndDate(val)} />
                            </div>
                        </div>

                        {/* دکمه‌های اکشن */}
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => { exportToExcel() }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition font-medium"
                            >
                                دانلود فایل اکسل
                            </button>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md transition font-medium"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LogsTable;