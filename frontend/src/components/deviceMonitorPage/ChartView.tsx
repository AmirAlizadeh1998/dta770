import { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend
} from 'recharts';
import Select from 'react-select';

const formatJalali = (dateString: string | number, isTooltip: boolean = false): string => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return String(dateString);

    const options: Intl.DateTimeFormatOptions = isTooltip
        ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
        : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };

    const formattedDate = new Intl.DateTimeFormat('fa-IR', options).format(date);

    return '\u200F' + formattedDate;
};

// تعریف گروه‌های ۳ فاز استاندارد برق صنعتی (R, S, T)
interface PhaseConfig {
    key: 'r' | 's' | 't';
    param: string;
    label: string;
    color: string;
}

interface ParameterGroupOption {
    value: string;
    label: string;
    isGroup: boolean;
    phases?: PhaseConfig[];
}

const PHASE_COLORS = {
    r: '#ef4444', // قرمز - فاز R (L1)
    s: '#f59e0b', // کهربایی/زرد - فاز S (L2)
    t: '#3b82f6', // آبی - فاز T (L3)
};

// گزینه‌های اختصاصی سه فاز (ولتاژ و جریان)
const MULTI_PHASE_OPTIONS: ParameterGroupOption[] = [
    {
        value: 'grp_current_cur',
        label: '⚡ جریان لحظه‌ای هر ۳ فاز (ir_cur, is_cur, it_cur)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'ir_cur', label: 'فاز R (ir_cur)', color: PHASE_COLORS.r },
            { key: 's', param: 'is_cur', label: 'فاز S (is_cur)', color: PHASE_COLORS.s },
            { key: 't', param: 'it_cur', label: 'فاز T (it_cur)', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_current_ave',
        label: '⚡ جریان میانگین هر ۳ فاز (ir_ave, is_ave, it_ave)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'ir_ave', label: 'فاز R (ir_ave)', color: PHASE_COLORS.r },
            { key: 's', param: 'is_ave', label: 'فاز S (is_ave)', color: PHASE_COLORS.s },
            { key: 't', param: 'it_ave', label: 'فاز T (it_ave)', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_neutral_cur',
        label: '🔌 ولتاژ لحظه‌ای فاز به نول (v_rn_cur, v_sn_cur, v_tn_cur)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rn_cur', label: 'فاز R-N (v_rn_cur)', color: PHASE_COLORS.r },
            { key: 's', param: 'v_sn_cur', label: 'فاز S-N (v_sn_cur)', color: PHASE_COLORS.s },
            { key: 't', param: 'v_tn_cur', label: 'فاز T-N (v_tn_cur)', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_neutral_ave',
        label: '🔌 ولتاژ میانگین فاز به نول (v_rn_ave, v_sn_ave, v_tn_ave)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rn_ave', label: 'فاز R-N (v_rn_ave)', color: PHASE_COLORS.r },
            { key: 's', param: 'v_sn_ave', label: 'فاز S-N (v_sn_ave)', color: PHASE_COLORS.s },
            { key: 't', param: 'v_tn_ave', label: 'فاز T-N (v_tn_ave)', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_phase_cur',
        label: '🔌 ولتاژ لحظه‌ای خط به خط (v_rs_cur, v_rt_cur, v_ts_cur)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rs_cur', label: 'خط R-S (v_rs_cur)', color: PHASE_COLORS.r },
            { key: 's', param: 'v_rt_cur', label: 'خط R-T (v_rt_cur)', color: PHASE_COLORS.s },
            { key: 't', param: 'v_ts_cur', label: 'خط T-S (v_ts_cur)', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_thd_current',
        label: '📊 اعوجاج هارمونیکی جریان THD (thd_ir, thd_is, thd_it)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'thd_ir', label: 'فاز R (thd_ir)', color: PHASE_COLORS.r },
            { key: 's', param: 'thd_is', label: 'فاز S (thd_is)', color: PHASE_COLORS.s },
            { key: 't', param: 'thd_it', label: 'فاز T (thd_it)', color: PHASE_COLORS.t },
        ]
    }
];

const DEVICE_PARAMETERS = [
    "frq_ave", "frq_cur", "frq_max", "frq_min", "thd_vrn", "thd_vrs", "thd_vrt", "thd_vsn",
    "thd_vst", "thd_vtn", "v_rn_ave", "v_rn_cur", "v_rn_max", "v_rn_min", "v_rs_ave", "v_rs_cur", "v_rs_max", "v_rs_min",
    "v_rt_ave", "v_rt_cur", "v_rt_max", "v_rt_min", "v_sn_ave", "v_sn_cur", "v_sn_max", "v_sn_min", "v_tn_ave", "v_tn_cur",
    "v_tn_max", "v_tn_min", "v_ts_ave", "v_ts_cur", "v_ts_max", "v_ts_min", "cos_r_ave", "cos_r_cur", "cos_r_max", "cos_r_min",
    "cos_s_ave", "cos_s_cur", "cos_s_max", "cos_s_min", "cos_t_ave", "cos_t_cur", "cos_t_max", "cos_t_min",
    "p_act_r_ave", "p_act_r_cur", "p_act_r_max", "p_act_r_min", "p_act_s_ave", "p_act_s_cur", "p_act_s_max",
    "p_act_s_min", "p_act_t_ave", "p_act_t_cur", "p_act_t_max", "p_act_t_min", "harmonic_1_R", "harmonic_1_S",
    "harmonic_1_T", "harmonic_2_R", "harmonic_2_S", "harmonic_2_T", "harmonic_3_R", "harmonic_3_S", "harmonic_3_T",
    "harmonic_4_R", "harmonic_4_S", "harmonic_4_T", "harmonic_5_R", "harmonic_5_S", "harmonic_5_T", "harmonic_6_R",
    "harmonic_6_S", "harmonic_6_T", "harmonic_7_R", "harmonic_7_S", "harmonic_7_T", "harmonic_8_R", "harmonic_8_S",
    "harmonic_8_T", "harmonic_9_R", "harmonic_9_S", "harmonic_9_T", "p_ract_r_ave", "p_ract_r_cur", "p_ract_r_max",
    "p_ract_r_min", "p_ract_s_ave", "p_ract_s_cur", "p_ract_s_max", "p_ract_s_min", "p_ract_t_ave", "p_ract_t_cur",
    "p_ract_t_max", "p_ract_t_min", "cos_total_ave", "cos_total_cur", "cos_total_max", "cos_total_min", "harmonic_10_R",
    "harmonic_10_S", "harmonic_10_T", "harmonic_11_R", "harmonic_11_S", "harmonic_11_T", "harmonic_12_R", "harmonic_12_S",
    "harmonic_12_T", "harmonic_13_R", "harmonic_13_S", "harmonic_13_T", "harmonic_14_R", "harmonic_14_S", "harmonic_14_T",
    "harmonic_15_R", "harmonic_15_S", "harmonic_15_T", "p_act_into_grid", "p_act_into_load", "p_apparent_r_ave",
    "p_apparent_r_cur", "p_apparent_r_max", "p_apparent_r_min", "p_apparent_s_ave", "p_apparent_s_cur", "p_apparent_s_max",
    "p_apparent_s_min", "p_apparent_t_ave", "p_apparent_t_cur", "p_apparent_t_max", "p_apparent_t_min", "p_ract_into_grid",
    "p_ract_into_load", "p_apparent_into_grid", "p_apparent_into_load"
];

// ترکیب گزینه‌های سه‌فاز و تک‌فازها
const parameterOptions: ParameterGroupOption[] = [
    ...MULTI_PHASE_OPTIONS,
    ...DEVICE_PARAMETERS.map(param => ({
        value: param,
        label: param,
        isGroup: false
    }))
];

const timeframeOptions = [
    { value: '1h', label: '۱ ساعت آخر' },
    { value: '6h', label: '۶ ساعت آخر' },
    { value: '12h', label: '۱۲ ساعت آخر' },
    { value: '18h', label: '۱۸ ساعت آخر' },
    { value: '24h', label: '۲۴ ساعت آخر' },
    { value: '30h', label: '۳۰ ساعت آخر' },
    { value: '36h', label: '۳۶ ساعت آخر' },
    { value: '48h', label: '۴۸ ساعت آخر' },
    { value: '72h', label: '۷۲ ساعت آخر' },
];

interface ChartDashboardProps {
    imei: string;
    deviceName: string;
}

const ChartDashboard = ({ imei, deviceName }: ChartDashboardProps) => {
    // مقدار پیش‌فرض: جریان ۳ فاز
    const [selectedOption, setSelectedOption] = useState<ParameterGroupOption>(parameterOptions[0]);
    const [selectedTime, setSelectedTime] = useState(timeframeOptions[0].value);

    // 🎛️ استیت وضعیت نمایش/مخفی بودن هر فاز
    const [visiblePhases, setVisiblePhases] = useState<{ r: boolean; s: boolean; t: boolean }>({
        r: true,
        s: true,
        t: true
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const token = localStorage.getItem("token");

    // تابع تغییر وضعیت تاگل فاز
    const togglePhase = (phaseKey: 'r' | 's' | 't') => {
        setVisiblePhases(prev => ({
            ...prev,
            [phaseKey]: !prev[phaseKey]
        }));
    };

    useEffect(() => {
        const fetchChartData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const fetchSingleParam = async (param: string) => {
                    const params = new URLSearchParams({
                        imei,
                        device_name: deviceName,
                        param: param,
                        timeframe: selectedTime
                    });
                    const res = await fetch(`/api/monitor/chart?${params.toString()}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!res.ok) throw new Error(`خطا در دریافت اطلاعات پارامتر ${param}`);
                    const result = await res.json();
                    return result.data || [];
                };

                if (selectedOption.isGroup && selectedOption.phases) {
                    // دریافت دیتای هر ۳ فاز به صورت همزمان (Parallel Fetching)
                    const [resR, resS, resT] = await Promise.all([
                        fetchSingleParam(selectedOption.phases[0].param),
                        fetchSingleParam(selectedOption.phases[1].param),
                        fetchSingleParam(selectedOption.phases[2].param)
                    ]);

                    // ادغام مقادیر بر اساس فیلد time
                    const mergedMap = new Map<string, any>();

                    const mergeSeries = (dataList: any[], fieldKey: string) => {
                        dataList.forEach((item: any) => {
                            if (!mergedMap.has(item.time)) {
                                mergedMap.set(item.time, { time: item.time });
                            }
                            const entry = mergedMap.get(item.time);
                            entry[fieldKey] = item.value != null ? Number(item.value) : null;
                        });
                    };

                    mergeSeries(resR, selectedOption.phases[0].key);
                    mergeSeries(resS, selectedOption.phases[1].key);
                    mergeSeries(resT, selectedOption.phases[2].key);

                    // مرتب‌سازی زمانی
                    const mergedList = Array.from(mergedMap.values()).sort(
                        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
                    );

                    setChartData(mergedList);
                } else {
                    // برای پارامترهای تکی
                    const singleData = await fetchSingleParam(selectedOption.value);
                    const formatted = singleData.map((item: any) => ({
                        time: item.time,
                        value: item.value != null ? Number(item.value) : null
                    }));
                    setChartData(formatted);
                }

            } catch (err: any) {
                setError(err.message || 'خطای ناشناخته رخ داد');
            } finally {
                setIsLoading(false);
            }
        };

        if (imei && deviceName) {
            fetchChartData();
        }
    }, [imei, deviceName, selectedOption, selectedTime, token]);

    // محاسبه مقادیر حداقل و حداکثر (فقط برای فازهایی که تیک‌شان روشن است)
    const summaryRows = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];

        const calculateMinMax = (key: string, label: string, color: string) => {
            const validItems = chartData.filter(d => typeof d[key] === 'number' && !isNaN(d[key]));
            if (validItems.length === 0) return [];

            let minItem = validItems[0];
            let maxItem = validItems[0];

            validItems.forEach(item => {
                if (item[key] < minItem[key]) minItem = item;
                if (item[key] > maxItem[key]) maxItem = item;
            });

            return [
                { key, label, color, type: 'حداکثر', typeColor: '#16a34a', value: maxItem[key], time: maxItem.time },
                { key, label, color, type: 'حداقل', typeColor: '#dc2626', value: minItem[key], time: minItem.time },
            ];
        };

        if (selectedOption.isGroup && selectedOption.phases) {
            return selectedOption.phases
                .filter(phase => visiblePhases[phase.key]) // فیلتر فازهای فعال
                .flatMap(phase => calculateMinMax(phase.key, phase.label, phase.color));
        }
        return calculateMinMax('value', selectedOption.label, '#8884d8');
    }, [chartData, selectedOption, visiblePhases]);

    return (
        <div dir={"rtl"} style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px', maxWidth: '200px' }}>
                    <Select
                        options={timeframeOptions}
                        value={timeframeOptions.find(opt => opt.value === selectedTime)}
                        onChange={(option) => setSelectedTime(option?.value || '1h')}
                        isRtl={true}
                        placeholder="انتخاب بازه زمانی..."
                    />
                </div>

                <div style={{ flex: '1 1 280px', maxWidth: '420px' }}>
                    <Select
                        options={parameterOptions}
                        value={selectedOption}
                        onChange={(option) => {
                            if (option) {
                                setSelectedOption(option);
                                setVisiblePhases({ r: true, s: true, t: true }); // ریست کردن تاگل‌ها
                            }
                        }}
                        isRtl={true}
                        isSearchable={true}
                        placeholder="انتخاب پارامتر یا گروه سه‌فاز..."
                    />
                </div>

                {/* 🎛️ دکمه‌های تاگل فازها (فقط وقتی که گروه سه‌فاز انتخاب شده باشد) */}
                {selectedOption.isGroup && selectedOption.phases && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginRight: 'auto' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginLeft: '4px' }}>
                            نمایش فازها:
                        </span>

                        {selectedOption.phases.map(phase => {
                            const isVisible = visiblePhases[phase.key];
                            return (
                                <button
                                    key={phase.key}
                                    onClick={() => togglePhase(phase.key)}
                                    type="button"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        border: `1.5px solid ${phase.color}`,
                                        backgroundColor: isVisible ? phase.color : '#fff',
                                        color: isVisible ? '#fff' : '#666',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isVisible ? `0 2px 6px ${phase.color}40` : 'none',
                                        opacity: isVisible ? 1 : 0.65
                                    }}
                                >
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: isVisible ? '#fff' : phase.color
                                    }} />
                                    {phase.key.toUpperCase()} ({phase.label.split(' ')[1] || phase.label})
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50', fontSize: '17px' }}>
                    روند تغییرات: {selectedOption.label}
                </h3>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px', fontSize: '15px' }}>در حال همگام‌سازی و رسم فازها... ⏳</div>
                ) : error ? (
                    <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ {error}</div>
                ) : chartData?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>داده‌ای برای این بازه یافت نشد 📭</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', minHeight: 460 }}>
                        {/* نمودار اصلی */}
                        <div style={{ flex: '3 1 600px', height: 460 }} dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="time"
                                        tickFormatter={(tick) => formatJalali(tick, false)}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        minTickGap={35}
                                        tick={{ fontSize: 11, fill: '#666', fontFamily: 'IRANSans, Tahoma, sans-serif' }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                                    <Tooltip
                                        labelFormatter={(label) => formatJalali(label, true)}
                                        contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '8px', fontFamily: 'IRANSans, Tahoma' }}
                                        itemStyle={{ direction: 'rtl', textAlign: 'right' }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        wrapperStyle={{ paddingBottom: '10px', direction: 'rtl', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            // تاگل با کلیک مستقیم روی راهنمای نمودار
                                            const phase = selectedOption.phases?.find(p => p.label === e.value);
                                            if (phase) togglePhase(phase.key);
                                        }}
                                    />

                                    {/* خطوط فازها با پراپرتی hide نیتیو */}
                                    {selectedOption.isGroup && selectedOption.phases ? (
                                        selectedOption.phases.map((phase) => (
                                            <Line
                                                key={phase.key}
                                                type="monotone"
                                                dataKey={phase.key}
                                                name={phase.label}
                                                stroke={phase.color}
                                                strokeWidth={2.2}
                                                dot={false}
                                                activeDot={{ r: 5 }}
                                                connectNulls={true}
                                                hide={!visiblePhases[phase.key]}
                                            />
                                        ))
                                    ) : (
                                        /* پارامتر تکی */
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name={selectedOption.label}
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            dot={{ r: 2 }}
                                            activeDot={{ r: 5 }}
                                            connectNulls={true}
                                        />
                                    )}

                                    <Brush
                                        dataKey="time"
                                        height={30}
                                        stroke="#8884d8"
                                        fill="#f4f6f8"
                                        tickFormatter={(tick) => formatJalali(tick, false)}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* جدول آمار مینیمم و ماکسیمم فازها */}
                        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                                    <thead style={{ backgroundColor: '#f4f6f8' }}>
                                    <tr>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>فاز / پارامتر</th>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>وضعیت</th>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>مقدار</th>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>زمان ثبت</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {summaryRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '20px', color: '#888' }}>
                                                فازی برای نمایش انتخاب نشده است
                                            </td>
                                        </tr>
                                    ) : (
                                        summaryRows.map((row: any, idx: number) => {
                                            const isNewPhase = idx === 0 || summaryRows[idx - 1].label !== row.label;
                                            const rowsPerPhase = summaryRows.filter((r: any) => r.label === row.label).length;

                                            return (
                                                <tr key={idx} style={{ backgroundColor: row.type === 'حداکثر' ? '#fafafa' : '#fff' }}>
                                                    {isNewPhase && (
                                                        <td
                                                            rowSpan={rowsPerPhase}
                                                            style={{
                                                                padding: '8px',
                                                                fontWeight: 'bold',
                                                                color: row.color,
                                                                borderLeft: '1px solid #eee',
                                                                verticalAlign: 'middle',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {row.label}
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '6px', color: row.typeColor, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                        {row.type}
                                                    </td>
                                                    <td style={{ padding: '6px', fontWeight: 'bold' }} dir="ltr">
                                                        {row.value}
                                                    </td>
                                                    <td style={{ padding: '6px', fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
                                                        {formatJalali(row.time, false)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartDashboard;