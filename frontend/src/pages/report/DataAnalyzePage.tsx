import React, {useEffect, useMemo, useState} from 'react';
import Select from 'react-select';
import {apiFetch} from "../../api/ApiClient.ts";
import type {Device} from "../../models/device.ts";
import JalaliDatePicker from "../../components/JalaliDatePicker.tsx";

const DEVICE_PARAMETERS = [
    "ir_ave", "ir_cur", "ir_max", "ir_min", "is_ave", "is_cur", "is_max", "is_min",
    "it_ave", "it_cur", "it_max", "it_min", "thd_ir", "thd_is", "thd_it", "frq_ave",
    "frq_cur", "frq_max", "frq_min", "thd_vrn", "thd_vrs", "thd_vrt", "thd_vsn",
    "thd_vst", "thd_vtn", "v_rn_ave", "v_rn_cur", "v_rn_max", "v_rn_min", "v_rs_ave",
    "v_rs_cur", "v_rs_max", "v_rs_min", "v_rt_ave", "v_rt_cur", "v_rt_max", "v_rt_min",
    "v_sn_ave", "v_sn_cur", "v_sn_max", "v_sn_min", "v_tn_ave", "v_tn_cur", "v_tn_max",
    "v_tn_min", "v_ts_ave", "v_ts_cur", "v_ts_max", "v_ts_min", "cos_r_ave", "cos_r_cur",
    "cos_r_max", "cos_r_min", "cos_s_ave", "cos_s_cur", "cos_s_max", "cos_s_min",
    "cos_t_ave", "cos_t_cur", "cos_t_max", "cos_t_min", "p_act_r_ave", "p_act_r_cur",
    "p_act_r_max", "p_act_r_min", "p_act_s_ave", "p_act_s_cur", "p_act_s_max",
    "p_act_s_min", "p_act_t_ave", "p_act_t_cur", "p_act_t_max", "p_act_t_min",
    "sig_quality", "harmonic_1_R", "harmonic_1_S", "harmonic_1_T", "harmonic_2_R",
    "harmonic_2_S", "harmonic_2_T", "harmonic_3_R", "harmonic_3_S", "harmonic_3_T",
    "harmonic_4_R", "harmonic_4_S", "harmonic_4_T", "harmonic_5_R", "harmonic_5_S",
    "harmonic_5_T", "harmonic_6_R", "harmonic_6_S", "harmonic_6_T", "harmonic_7_R",
    "harmonic_7_S", "harmonic_7_T", "harmonic_8_R", "harmonic_8_S", "harmonic_8_T",
    "harmonic_9_R", "harmonic_9_S", "harmonic_9_T", "p_ract_r_ave", "p_ract_r_cur",
    "p_ract_r_max", "p_ract_r_min", "p_ract_s_ave", "p_ract_s_cur", "p_ract_s_max",
    "p_ract_s_min", "p_ract_t_ave", "p_ract_t_cur", "p_ract_t_max", "p_ract_t_min",
    "cos_total_ave", "cos_total_cur", "cos_total_max", "cos_total_min", "harmonic_10_R",
    "harmonic_10_S", "harmonic_10_T", "harmonic_11_R", "harmonic_11_S", "harmonic_11_T",
    "harmonic_12_R", "harmonic_12_S", "harmonic_12_T", "harmonic_13_R", "harmonic_13_S",
    "harmonic_13_T", "harmonic_14_R", "harmonic_14_S", "harmonic_14_T", "harmonic_15_R",
    "harmonic_15_S", "harmonic_15_T", "p_act_into_grid", "p_act_into_load",
    "p_apparent_r_ave", "p_apparent_r_cur", "p_apparent_r_max", "p_apparent_r_min",
    "p_apparent_s_ave", "p_apparent_s_cur", "p_apparent_s_max", "p_apparent_s_min",
    "p_apparent_t_ave", "p_apparent_t_cur", "p_apparent_t_max", "p_apparent_t_min",
    "p_ract_into_grid", "p_ract_into_load", "p_apparent_into_grid", "p_apparent_into_load"
];

// 👈 آماده‌سازی آپشن‌ها برای react-select
const parameterOptions = DEVICE_PARAMETERS.map(param => ({value: param, label: param}));

const operatorOptions = [
    {value: ">", label: "بزرگتر از"},
    {value: "<", label: "کوچکتر از"},
    {value: "=", label: "مساوی با"},
    {value: ">=", label: "بزرگتر یا مساوی"},
    {value: "<=", label: "کوچکتر یا مساوی"},
    {value: "!=", label: "مخالف با"},
    {value: "between", label: "بین دو مقدار"},
    {value: "not_between", label: "خارج بین دو مقدار"},
];

interface FilterResult {
    id: string;
    deviceId: string;
    time: string;
    parameter: string;
    value: string | number;
    unit: string;
}

const DataAnalyzePage: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const token = localStorage.getItem("token");

    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [selectedParameter, setSelectedParameter] = useState<string>('');
    const [operator, setOperator] = useState<string>('');
    const [firstFilterValue, setFirstFilterValue] = useState<number | ''>('');
    const [secondFilterValue, setSecondFilterValue] = useState<number | ''>('');
    const isRangeOperator = operator === 'between' || operator === 'not_between';
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [tableData, setTableData] = useState<FilterResult[]>([]);

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalLogs, setTotalLogs] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);

    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'time', // پیش‌فرض روی زمان
        direction: 'desc', // پیش‌فرض نزولی (جدیدترین‌ها اول)
    });

    useEffect(() => {

        if (
            !selectedDevice ||
            !selectedParameter ||
            !operator ||
            firstFilterValue === '' ||
            !startDate ||
            !endDate ||
            (isRangeOperator && secondFilterValue === '')
        ) {
            return;
        }

        setCurrentPage(1);
        handleApplyFilter(1);

    }, [sortConfig, isRangeOperator, secondFilterValue, firstFilterValue, selectedDevice, selectedParameter, operator, startDate, endDate]);

    useEffect(() => {
        setFirstFilterValue('');
        setSecondFilterValue('');
    }, [operator]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...tableData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a: any, b: any) => {
                // برای اینکه اعداد رو درست سورت کنه (مثلا رشته "12" نیاد قبل "2")
                const valA = a[sortConfig.key!];
                const valB = b[sortConfig.key!];

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [tableData, sortConfig]);

    // یه پارامتر page بهش می‌دیم که دیفالت ۱ هست
    const handleApplyFilter = async (page: number = 1, pageLimit: number = limit) => {
        if (
            !selectedDevice ||
            !selectedParameter ||
            !operator ||
            firstFilterValue === '' ||
            firstFilterValue === undefined ||
            firstFilterValue === null ||
            !startDate ||
            !endDate ||
            (isRangeOperator && (secondFilterValue === '' || secondFilterValue === undefined || secondFilterValue === null))
        ) {
            alert("رفیق، لطفاً همه فیلدها رو پر کن!");
            return;
        }

        try {
            const queryParamsObject: Record<string, string> = {
                imei: selectedDevice,
                parameter: selectedParameter,
                operator: operator,
                start_date: startDate,
                end_date: endDate,
                page: page.toString(),
                limit: pageLimit.toString(),
                sort_by: sortConfig.key,
                sort_order: sortConfig.direction,
            };

            if (isRangeOperator) {
                queryParamsObject.first_filter_value = firstFilterValue.toString();
                queryParamsObject.second_filter_value = secondFilterValue.toString();
            } else {
                queryParamsObject.first_filter_value = firstFilterValue.toString();
            }

            const queryParams = new URLSearchParams(queryParamsObject).toString();

            const response = await apiFetch(`/api/devices/analyze?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const data = await response.json();

            if (data && data.Logs) {
                const formattedData: FilterResult[] = data.Logs.map((log: any) => {
                    const paramValue = log.data && log.data[selectedParameter] !== undefined
                        ? log.data[selectedParameter]
                        : 'نامشخص';

                    return {
                        id: log.id.toString(),
                        deviceId: log.imei,
                        time: new Date(log.created_at).toLocaleString("fa-IR"),
                        parameter: selectedParameter,
                        value: paramValue,
                        unit: "-"
                    };
                });

                setTableData(formattedData);
                // 👈 ذخیره اطلاعات صفحه‌بندی که بک‌اند میده
                setTotalLogs(data.TotalLogs || 0);
                setTotalPages(data.TotalPages || 1);
                setCurrentPage(data.Page || page);
            } else {
                setTableData([]);
                setTotalLogs(0);
                setTotalPages(1);
            }

        } catch (error) {
            console.error("خطا در اعمال فیلتر:", error);
            setTableData([]);
        } finally {

        }
    };

    const handleChangeLimit = (newLimit: number) => {
        setLimit(newLimit);
        setCurrentPage(1);
        handleApplyFilter(1, newLimit);
    };

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await apiFetch("/api/devices", {
                    headers: {"Authorization": `Bearer ${token}`}
                });
                const data = await response.json();
                setDevices(data);
            } catch (error) {
                console.error("خطا در دریافت لیست دستگاه‌ها:", error);
            }
        };
        fetchDevices();
    }, [token]);

    // 👈 تبدیل دیتاهای دستگاه‌ها به فرمت react-select
    const deviceOptions = devices.map(device => ({
        value: device.imei,
        label: `${device.device_name ? device.device_name : ''} (${device.imei})`
    }));

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-right" dir="rtl">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 border-r-4 border-teal-500 pr-2">بررسی داده ها</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* 👇 Select دستگاه‌ها */}
                    <div className="w-full">
                        <Select
                            options={deviceOptions}
                            isRtl={true}
                            placeholder="دستگاه را انتخاب کنید..."
                            value={deviceOptions.find(opt => opt.value === selectedDevice) || null}
                            onChange={(option) => setSelectedDevice(option?.value || '')}
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* 👇 Select پارامترها */}
                    <div className="w-full">
                        <Select
                            options={parameterOptions}
                            isRtl={true}
                            placeholder="پارامتر را انتخاب کنید..."
                            value={parameterOptions.find(opt => opt.value === selectedParameter) || null}
                            onChange={(option) => setSelectedParameter(option?.value || '')}
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isDisabled={!selectedDevice}
                        />
                    </div>

                    {/* 👇 Select عملگرها */}
                    <div className="w-full">
                        <Select
                            options={operatorOptions}
                            isRtl={true}
                            placeholder="عملگر را انتخاب کنید..."
                            value={operatorOptions.find(opt => opt.value === operator) || null}
                            onChange={(option) => setOperator(option?.value || '')}
                            isClearable
                            className="react-select-container"
                            classNamePrefix="react-select"
                            isDisabled={!selectedParameter}
                        />
                    </div>

                    {isRangeOperator ? (
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 h-9.5"
                                value={firstFilterValue}
                                onChange={(e) => setFirstFilterValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="از مقدار..."
                                disabled={!operator}
                            />
                            <input
                                type="number"
                                className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 h-9.5"
                                value={secondFilterValue}
                                onChange={(e) => setSecondFilterValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="تا مقدار..."
                                disabled={!operator}
                            />
                        </div>
                    ) : (
                        <input
                            type="number"
                            className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 h-9.5"
                            value={firstFilterValue}
                            onChange={(e) => setFirstFilterValue(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="مقدار..."
                            disabled={!operator}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6 w-full lg:w-2/3">
                    <JalaliDatePicker
                        label="از تاریخ:"
                        value={startDate}
                        onChange={(val) => setStartDate(val)}
                    />
                    <JalaliDatePicker
                        label="تا تاریخ:"
                        value={endDate}
                        onChange={(val) => setEndDate(val)}
                    />
                </div>

                <button
                    onClick={() => handleApplyFilter(1)}
                    className="bg-blue-300 hover:bg-blue-400 text-white font-bold py-2 px-6 rounded transition-colors"
                    // disabled={!selectedDevice || !selectedParameter || !operator || secondValue === '' || !startDate || !endDate}
                >
                    اعمال فیلتر
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold">نتایج فیلتر</h2>
                        {totalLogs > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                تعداد کل: {totalLogs} رکورد
                            </span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full border-collapse bg-white">
                        <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-gray-600 text-sm">
                            {/* روی هر th یه onClick گذاشتیم و یه آیکون فلش */}
                            <th onClick={() => handleSort('deviceId')}
                                className="p-4 text-right font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                شناسه
                                دستگاه {sortConfig.key === 'deviceId' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                            <th onClick={() => handleSort('time')}
                                className="p-4 text-right font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                زمان {sortConfig.key === 'time' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                            <th onClick={() => handleSort('parameter')}
                                className="p-4 text-right font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                پارامتر {sortConfig.key === 'parameter' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                            <th onClick={() => handleSort('value')}
                                className="p-4 text-right font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                مقدار {sortConfig.key === 'value' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕️'}
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedData.length > 0 ? (
                            sortedData.map((row) => (
                                <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors duration-150">
                                    <td className="p-4 text-gray-800">{row.deviceId}</td>
                                    <td className="p-4 text-gray-600" dir="ltr">{row.time}</td>
                                    <td className="p-4 text-gray-600 font-mono text-sm">{row.parameter}</td>
                                    <td className="p-4 font-semibold text-gray-800">{row.value}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400">
                                    اطلاعاتی یافت نشد!
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* 👇 بخش صفحه‌بندی (Pagination) */}
                {tableData.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-6 gap-4">
        <span className="text-sm text-gray-600">
            نمایش صفحه {currentPage} از {totalPages}
        </span>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">تعداد سطر:</span>

                            {[10, 50, 100].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => handleChangeLimit(size)}
                                    className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                                        limit === size
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApplyFilter(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                قبلی
                            </button>
                            <button
                                onClick={() => handleApplyFilter(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="px-4 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAnalyzePage;