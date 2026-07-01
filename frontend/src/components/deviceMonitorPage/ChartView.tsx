import { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
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

const DEVICE_PARAMETERS = [
    "ir_ave", "ir_cur", "ir_max", "ir_min", "is_ave", "is_cur", "is_max", "is_min", "it_ave", "it_cur", "it_max", "it_min",
    "thd_ir", "thd_is", "thd_it", "frq_ave", "frq_cur", "frq_max", "frq_min", "thd_vrn", "thd_vrs", "thd_vrt", "thd_vsn",
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

const parameterOptions = DEVICE_PARAMETERS.map(param => ({
    value: param,
    label: param
}));

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
}

const ChartDashboard = ({ imei }: ChartDashboardProps) => {
    const [selectedParam, setSelectedParam] = useState(parameterOptions[0].value);
    const [selectedTime, setSelectedTime] = useState(timeframeOptions[0].value);

    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChartData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const apiUrl = `/api/monitor/chart?imei=${imei}&param=${selectedParam}&timeframe=${selectedTime}`;

                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("token")}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('خطا در دریافت اطلاعات از سرور');
                }

                const result = await response.json();
                setChartData(result.data);

            } catch (err: any) {
                setError(err.message || 'خطای ناشناخته رخ داد');
            } finally {
                setIsLoading(false);
            }
        };

        if (imei) {
            fetchChartData();
        }
    }, [imei, selectedParam, selectedTime]);

    // محاسبه مقادیر حداقل و حداکثر
    const minMaxData = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];

        let minItem = chartData[0];
        let maxItem = chartData[0];

        chartData.forEach(item => {
            if (item.value <= minItem.value) minItem = item;
            if (item.value >= maxItem.value) maxItem = item;
        });

        return [
            { name: 'حداکثر', value: maxItem.value, time: maxItem.time, color: '#52c41a' },
            { name: 'حداقل', value: minItem.value, time: minItem.time, color: '#ff4d4f' }
        ];
    }, [chartData]);

    return (
        <div dir={"rtl"} style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px', maxWidth: '200px' }}>
                    <Select
                        options={timeframeOptions}
                        value={timeframeOptions.find(opt => opt.value === selectedTime)}
                        onChange={(option) => setSelectedTime(option?.value || '1h')}
                        isRtl={true}
                        placeholder="انتخاب زمان..."
                    />
                </div>

                <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
                    <Select
                        options={parameterOptions}
                        value={parameterOptions.find(opt => opt.value === selectedParam)}
                        onChange={(option) => setSelectedParam(option?.value || DEVICE_PARAMETERS[0])}
                        isRtl={true}
                        isSearchable={true}
                        placeholder="انتخاب پارامتر..."
                    />
                </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>روند تغییرات پارامتر: {selectedParam}</h3>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>در حال دریافت اطلاعات... ⏳</div>
                ) : error ? (
                    <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ {error}</div>
                ) : chartData?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>داده‌ای برای نمایش وجود ندارد 📭</div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', height: 450 }}>
                            {/* نمودار اصلی (خطی) */}
                            <div style={{ flex: '3 1 600px', height: '100%' }} dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                                        <XAxis
                                            dataKey="time"
                                            tickFormatter={(tick) => formatJalali(tick, false)}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            minTickGap={40}
                                            tick={{ fontSize: 12, fill: '#666', fontFamily: 'Vazirmatn, IRANSans, Tahoma, sans-serif' }}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            labelFormatter={(label) => formatJalali(label, true)}
                                            contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '8px', fontFamily: 'Vazirmatn' }}
                                            itemStyle={{ direction: 'rtl', textAlign: 'right' }}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                                        <Brush dataKey="time" height={30} stroke="#8884d8" fill="#f4f6f8" tickFormatter={(tick) => formatJalali(tick, false)} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* جدول مقادیر حداقل و حداکثر کلی */}
                            <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'Vazirmatn, IRANSans, sans-serif' }}>
                                        <thead style={{ backgroundColor: '#f4f6f8' }}>
                                        <tr>
                                            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>وضعیت</th>
                                            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>مقدار</th>
                                            <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>زمان</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {minMaxData.map((data, index) => (
                                            <tr key={index} style={{ borderBottom: index === 0 ? '1px solid #eee' : 'none' }}>
                                                <td style={{ padding: '15px 10px', fontWeight: 'bold', color: data.color }}>
                                                    {data.name}
                                                </td>
                                                <td style={{ padding: '15px 10px', fontWeight: 'bold' }} dir="ltr">
                                                    {data.value}
                                                </td>
                                                <td style={{ padding: '15px 10px', fontSize: '0.85em', color: '#555' }}>
                                                    {formatJalali(data.time, true)}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChartDashboard;