import { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
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
    isHarmonicBar?: boolean; // فلگ تشخیص نمودار میله‌ای هارمونیک
    phases?: PhaseConfig[];
}

const PHASE_COLORS = {
    r: '#ef4444', // قرمز - فاز R (L1)
    s: '#f59e0b', // کهربایی/زرد - فاز S (L2)
    t: '#3b82f6', // آبی - فاز T (L3)
};

const ODD_HARMONICS = [1, 3, 5, 7, 9, 11, 13, 15];

const MULTI_PHASE_OPTIONS: ParameterGroupOption[] = [
    ///////////////////////// طیف هارمونیک‌های فرد ///////////////////
    {
        value: 'grp_odd_harmonics_bar',
        label: '📊 هارمونیک‌های فرد (%)',
        isGroup: true,
        isHarmonicBar: true,
        phases: [
            { key: 'r', param: 'harmonic_odd_R', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'harmonic_odd_S', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'harmonic_odd_T', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// جریان ///////////////////
    {
        value: 'grp_current_cur',
        label: '⚡ جریان لحظه‌ای (A)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'ir_cur', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'is_cur', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'it_cur', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_current_ave',
        label: '⚡ جریان میانگین (A)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'ir_ave', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'is_ave', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'it_ave', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_current_max',
        label: '⚡ جریان بیشینه (A)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'ir_max', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'is_max', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'it_max', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_current_min',
        label: '⚡ جریان کمینه (A)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'ir_min', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'is_min', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'it_min', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// ولتاژ فاز به نول ///////////////////
    {
        value: 'grp_voltage_phase_to_neutral_cur',
        label: '🔌 ولتاژ لحظه‌ای فاز به نول (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rn_cur', label: 'فاز R-N', color: PHASE_COLORS.r },
            { key: 's', param: 'v_sn_cur', label: 'فاز S-N', color: PHASE_COLORS.s },
            { key: 't', param: 'v_tn_cur', label: 'فاز T-N', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_neutral_ave',
        label: '🔌 ولتاژ میانگین فاز به نول (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rn_ave', label: 'فاز R-N', color: PHASE_COLORS.r },
            { key: 's', param: 'v_sn_ave', label: 'فاز S-N', color: PHASE_COLORS.s },
            { key: 't', param: 'v_tn_ave', label: 'فاز T-N', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_neutral_max',
        label: '🔌 ولتاژ بیشینه فاز به نول (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rn_max', label: 'فاز R-N', color: PHASE_COLORS.r },
            { key: 's', param: 'v_sn_max', label: 'فاز S-N', color: PHASE_COLORS.s },
            { key: 't', param: 'v_tn_max', label: 'فاز T-N', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_neutral_min',
        label: '🔌 ولتاژ کمینه فاز به نول (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rn_min', label: 'فاز R-N', color: PHASE_COLORS.r },
            { key: 's', param: 'v_sn_min', label: 'فاز S-N', color: PHASE_COLORS.s },
            { key: 't', param: 'v_tn_min', label: 'فاز T-N', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// ولتاژ خط به خط ///////////////////
    {
        value: 'grp_voltage_phase_to_phase_cur',
        label: '🔌 ولتاژ لحظه‌ای خط به خط (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rs_cur', label: 'خط R-S', color: PHASE_COLORS.r },
            { key: 's', param: 'v_rt_cur', label: 'خط R-T', color: PHASE_COLORS.s },
            { key: 't', param: 'v_st_cur', label: 'خط S-T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_phase_ave',
        label: '🔌 ولتاژ میانگین خط به خط (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rs_ave', label: 'خط R-S', color: PHASE_COLORS.r },
            { key: 's', param: 'v_rt_ave', label: 'خط R-T', color: PHASE_COLORS.s },
            { key: 't', param: 'v_st_ave', label: 'خط S-T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_phase_max',
        label: '🔌 ولتاژ بیشینه خط به خط (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rs_max', label: 'خط R-S', color: PHASE_COLORS.r },
            { key: 's', param: 'v_rt_max', label: 'خط R-T', color: PHASE_COLORS.s },
            { key: 't', param: 'v_st_max', label: 'خط S-T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'grp_voltage_phase_to_phase_min',
        label: '🔌 ولتاژ کمینه خط به خط (V)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'v_rs_min', label: 'خط R-S', color: PHASE_COLORS.r },
            { key: 's', param: 'v_rt_min', label: 'خط R-T', color: PHASE_COLORS.s },
            { key: 't', param: 'v_st_min', label: 'خط S-T', color: PHASE_COLORS.t },
        ]
    },
    /////////////////////// اعوجاج کل جریان ///////////////////
    {
        value: 'grp_thd_current',
        label: '📊 اعوجاج هارمونیکی جریان (%)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'thd_ir', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'thd_is', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'thd_it', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    /////////////////////// اعوجاج کل فاز به نول ///////////////////
    {
        value: 'grp_thd_voltage_to_neutral',
        label: '📊 اعوجاج هارمونیکی فاز به نول (%)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'thd_vrn', label: 'فاز R-N', color: PHASE_COLORS.r },
            { key: 's', param: 'thd_vsn', label: 'فاز S-N', color: PHASE_COLORS.s },
            { key: 't', param: 'thd_vtn', label: 'فاز T-N', color: PHASE_COLORS.t },
        ]
    },
    /////////////////////// اعوجاج کل فاز به فاز ///////////////////
    {
        value: 'grp_thd_voltage_to_phase',
        label: '📊 اعوجاج هارمونیکی خط به خط (%)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'thd_vrs', label: 'خط R-S', color: PHASE_COLORS.r },
            { key: 's', param: 'thd_vrt', label: 'خط R-T', color: PHASE_COLORS.s },
            { key: 't', param: 'thd_vst', label: 'خط S-T', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// ضریب توان ///////////////////
    {
        value: 'power_factor_cur',
        label: '🔌 ضریب توان لحظه‌ای (PF)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'cos_r_cur', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'cos_s_cur', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'cos_t_cur', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_factor_ave',
        label: '🔌 ضریب توان میانگین (PF)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'cos_r_ave', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'cos_s_ave', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'cos_t_ave', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_factor_max',
        label: '🔌 ضریب توان بیشینه (PF)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'cos_r_max', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'cos_s_max', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'cos_t_max', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_factor_min',
        label: '🔌 ضریب توان کمینه (PF)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'cos_r_min', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'cos_s_min', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'cos_t_min', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// توان اکتیو ///////////////////
    {
        value: 'power_active_cur',
        label: '⚡ توان اکتیو لحظه‌ای (kW)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_act_r_cur', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_act_s_cur', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_act_t_cur', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_active_ave',
        label: '⚡ توان اکتیو میانگین (kW)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_act_r_ave', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_act_s_ave', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_act_t_ave', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_active_max',
        label: '⚡ توان اکتیو بیشینه (kW)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_act_r_max', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_act_s_max', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_act_t_max', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_active_min',
        label: '⚡ توان اکتیو کمینه (kW)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_act_r_min', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_act_s_min', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_act_t_min', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// توان راکتیو ///////////////////
    {
        value: 'power_reactive_cur',
        label: '🔋 توان راکتیو لحظه‌ای (kVAR)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_ract_r_cur', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_ract_s_cur', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_ract_t_cur', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_reactive_ave',
        label: '🔋 توان راکتیو میانگین (kVAR)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_ract_r_ave', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_ract_s_ave', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_ract_t_ave', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_reactive_max',
        label: '🔋 توان راکتیو بیشینه (kVAR)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_ract_r_max', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_ract_s_max', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_ract_t_max', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_reactive_min',
        label: '🔋 توان راکتیو کمینه (kVAR)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_ract_r_min', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_ract_s_min', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_ract_t_min', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    ///////////////////////// توان ظاهری ///////////////////
    {
        value: 'power_apparent_cur',
        label: '💡 توان ظاهری لحظه‌ای (kVA)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_apparent_r_cur', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_apparent_s_cur', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_apparent_t_cur', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_apparent_ave',
        label: '💡 توان ظاهری میانگین (kVA)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_apparent_r_ave', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_apparent_s_ave', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_apparent_t_ave', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_apparent_max',
        label: '💡 توان ظاهری بیشینه (kVA)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_apparent_r_max', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_apparent_s_max', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_apparent_t_max', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
    {
        value: 'power_apparent_min',
        label: '💡 توان ظاهری کمینه (kVA)',
        isGroup: true,
        phases: [
            { key: 'r', param: 'p_apparent_r_min', label: 'فاز R', color: PHASE_COLORS.r },
            { key: 's', param: 'p_apparent_s_min', label: 'فاز S', color: PHASE_COLORS.s },
            { key: 't', param: 'p_apparent_t_min', label: 'فاز T', color: PHASE_COLORS.t },
        ]
    },
];

// پارامترهای عمومی سیستم (تکی و بدون فاز)
const DEVICE_PARAMETERS: { value: string; label: string }[] = [
    // فرکانس شبکه
    { value: "frq_cur", label: "📶 فرکانس لحظه‌ای شبکه (Hz)" },
    { value: "frq_ave", label: "📶 فرکانس میانگین شبکه (Hz)" },
    { value: "frq_max", label: "📶 فرکانس بیشینه شبکه (Hz)" },
    { value: "frq_min", label: "📶 فرکانس کمینه شبکه (Hz)" },

    // ضریب توان کل
    { value: "cos_total_cur", label: "🔌 ضریب توان کل لحظه‌ای (PF)" },
    { value: "cos_total_ave", label: "🔌 ضریب توان کل میانگین (PF)" },
    { value: "cos_total_max", label: "🔌 ضریب توان کل بیشینه (PF)" },
    { value: "cos_total_min", label: "🔌 ضریب توان کل کمینه (PF)" },

    // تبادل توان اکتیو
    { value: "p_act_into_grid", label: "⚡ توان اکتیو تزریقی به شبکه (kW)" },
    { value: "p_act_into_load", label: "⚡ توان اکتیو مصرفی بار (kW)" },

    // تبادل توان راکتیو
    { value: "p_ract_into_grid", label: "🔋 توان راکتیو تزریقی به شبکه (kVAR)" },
    { value: "p_ract_into_load", label: "🔋 توان راکتیو مصرفی بار (kVAR)" },

    // تبادل توان ظاهری
    { value: "p_apparent_into_grid", label: "💡 توان ظاهری به شبکه (kVA)" },
    { value: "p_apparent_into_load", label: "💡 توان ظاهری مصرفی بار (kVA)" },
];

const parameterOptions: ParameterGroupOption[] = [
    ...MULTI_PHASE_OPTIONS,
    ...DEVICE_PARAMETERS.map(item => ({
        value: item.value,
        label: item.label,
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

// کاستوم تول‌تیپ اختصاصی برای نمودار هارمونیک
const HarmonicCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // دیتای سطر جاری از بارچارت
    const rowData = payload[0]?.payload;

    return (
        <div style={{
            backgroundColor: '#ffffff',
            padding: '10px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontFamily: 'IRANSans, Tahoma, sans-serif',
            direction: 'rtl',
            textAlign: 'right',
            minWidth: '180px'
        }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #edf2f7', paddingBottom: '6px', marginBottom: '8px', color: '#1e293b' }}>
                مرتبه هارمونیک: {label}
            </div>

            {payload.map((entry: any, index: number) => {
                const phaseKey = entry.dataKey; // 'r' | 's' | 't'
                const timeValue = rowData?.[`${phaseKey}Time`];

                return (
                    <div key={index} style={{ marginBottom: '6px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
                            <span style={{ fontWeight: 600, color: entry.color }}>{entry.name}:</span>
                            <span style={{ fontWeight: 'bold', direction: 'ltr' }}>{entry.value}%</span>
                        </div>
                        {timeValue && (
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginRight: '14px', marginTop: '2px' }}>
                                🕒 {formatJalali(timeValue, true)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const ChartDashboard = ({ imei, deviceName }: ChartDashboardProps) => {
    const [selectedOption, setSelectedOption] = useState<ParameterGroupOption>(parameterOptions[0]);
    const [selectedTime, setSelectedTime] = useState(timeframeOptions[0].value);

    // وضعیت نمایش فازها
    const [visiblePhases, setVisiblePhases] = useState<{ r: boolean; s: boolean; t: boolean }>({
        r: true,
        s: true,
        t: true
    });

    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const token = localStorage.getItem("token");

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

                // ۱. وضعیت نمودار میله‌ای هارمونیک‌های فرد
                if (selectedOption.isHarmonicBar) {
                    // واکشی موازی همه هارمونیک‌های فرد برای R, S, T
                    const fetchPhaseHarmonics = async (phaseUpper: string) => {
                        const promises = ODD_HARMONICS.map(h => fetchSingleParam(`harmonic_${h}_${phaseUpper}`));
                        const results = await Promise.all(promises);
                        // آخرین مقدار ثبت‌شده را برای هر مرتبه هارمونیک برمی‌داریم
                        return results.map((series: any[]) => {
                            if (!series || series.length === 0) return { value: 0, time: '' };
                            const lastEntry = series[series.length - 1];
                            return {
                                value: lastEntry.value != null ? Number(lastEntry.value) : 0,
                                time: lastEntry.time
                            };
                        });
                    };

                    const [rData, sData, tData] = await Promise.all([
                        fetchPhaseHarmonics('R'),
                        fetchPhaseHarmonics('S'),
                        fetchPhaseHarmonics('T')
                    ]);

                    // تبدیل دیتا به آرایه‌ای مناسب برای BarChart
                    const harmonicBarData = ODD_HARMONICS.map((h, idx) => ({
                        order: `H${h}`,
                        harmonicNumber: h,
                        r: rData[idx]?.value ?? 0,
                        s: sData[idx]?.value ?? 0,
                        t: tData[idx]?.value ?? 0,
                        rTime: rData[idx]?.time,
                        sTime: sData[idx]?.time,
                        tTime: tData[idx]?.time
                    }));

                    setChartData(harmonicBarData);

                } else if (selectedOption.isGroup && selectedOption.phases) {
                    // ۲. وضعیت ۳ فاز معمولی (LineChart)
                    const [resR, resS, resT] = await Promise.all([
                        fetchSingleParam(selectedOption.phases[0].param),
                        fetchSingleParam(selectedOption.phases[1].param),
                        fetchSingleParam(selectedOption.phases[2].param)
                    ]);

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

                    const mergedList = Array.from(mergedMap.values()).sort(
                        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
                    );

                    setChartData(mergedList);

                } else {
                    // ۳. پارامترهای تکی (LineChart)
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

    // محاسبه خلاصه آمار برای جدول
    const summaryRows = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];

        // حالت هارمونیک میله‌ای: بیشترین مرتبه اعوجاج در هر فاز
        if (selectedOption.isHarmonicBar) {
            const phases = [
                { key: 'r', label: 'فاز R', color: PHASE_COLORS.r },
                { key: 's', label: 'فاز S', color: PHASE_COLORS.s },
                { key: 't', label: 'فاز T', color: PHASE_COLORS.t },
            ].filter(p => visiblePhases[p.key as 'r' | 's' | 't']);

            return phases.flatMap(phase => {
                // هارمونیک پایه (H1) معمولاً مقدار ۱۰۰ یا دامنه اصلی است، مقایسه بین H3 به بالا معنادارتر است
                const highestHarmonic = [...chartData].sort((a, b) => b[phase.key] - a[phase.key])[0];
                return [
                    {
                        key: phase.key,
                        label: phase.label,
                        color: phase.color,
                        type: `پیک (${highestHarmonic.order})`,
                        typeColor: '#2563eb',
                        value: `${highestHarmonic[phase.key]}%`,
                        time: highestHarmonic[`${phase.key}Time`] || '-'
                    }
                ];
            });
        }

        // حالت نمودارهای خطی معمولی
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
                .filter(phase => visiblePhases[phase.key])
                .flatMap(phase => calculateMinMax(phase.key, phase.label, phase.color));
        }
        return calculateMinMax('value', selectedOption.label, '#8884d8');
    }, [chartData, selectedOption, visiblePhases]);

    return (
        <div dir={"rtl"} style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            {/* کانتینر فیلترها و دکمه‌های تاگل */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

                {/* ۱. ردیف سلکت‌ها */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px', maxWidth: '200px' }}>
                        <Select
                            options={timeframeOptions}
                            value={timeframeOptions.find(opt => opt.value === selectedTime)}
                            onChange={(option) => setSelectedTime(option?.value || '1h')}
                            isRtl={true}
                            placeholder="انتخاب بازه زمانی..."
                        />
                    </div>

                    <div style={{ flex: '1 1 280px', maxWidth: '440px' }}>
                        <Select
                            options={parameterOptions}
                            value={selectedOption}
                            onChange={(option) => {
                                if (option) {
                                    setSelectedOption(option);
                                    setVisiblePhases({ r: true, s: true, t: true });
                                }
                            }}
                            isRtl={true}
                            isSearchable={true}
                            placeholder="انتخاب پارامتر یا گروه سه‌فاز..."
                        />
                    </div>
                </div>

                {/* ۲. ردیف دکمه‌های تاگل فازها (زیر سلکت‌ها، چسبیده به راست) */}
                {selectedOption.isGroup && selectedOption.phases && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                                    {phase.label}
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: isVisible ? '#fff' : phase.color
                                    }} />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* کارت نمودار و جدول */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50', fontSize: '17px' }}>
                    {selectedOption.isHarmonicBar ? 'طیف هارمونیک‌های فرد' : 'روند تغییرات'}: {selectedOption.label}
                </h3>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px', fontSize: '15px' }}>در حال همگام‌سازی و بارگذاری داده‌ها... ⏳</div>
                ) : error ? (
                    <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ {error}</div>
                ) : chartData?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>داده‌ای برای این بازه یافت نشد 📭</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', minHeight: 460 }}>
                        {/* نمودار اصلی */}
                        <div style={{ flex: '3 1 600px', height: 460 }} dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                {selectedOption.isHarmonicBar ? (
                                    /* 📊 نمودار میله‌ای اختصاصی هارمونیک‌ها */
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis
                                            dataKey="order"
                                            tick={{ fontSize: 13, fontWeight: 'bold', fill: '#333' }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            label={{ value: 'مقدار / درصد (%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }}
                                        />
                                        <Tooltip content={<HarmonicCustomTooltip />} />
                                        {/*<Legend*/}
                                        {/*    verticalAlign="top"*/}
                                        {/*    height={36}*/}
                                        {/*    wrapperStyle={{ paddingBottom: '10px', direction: 'rtl', cursor: 'pointer' }}*/}
                                        {/*    onClick={(e) => {*/}
                                        {/*        const phase = selectedOption.phases?.find(p => p.label === e.value);*/}
                                        {/*        if (phase) togglePhase(phase.key);*/}
                                        {/*    }}*/}
                                        {/*/>*/}
                                        <Bar dataKey="r" name="فاز R" fill={PHASE_COLORS.r} hide={!visiblePhases.r} radius={[4, 4, 0, 0]} maxBarSize={5} />
                                        <Bar dataKey="s" name="فاز S" fill={PHASE_COLORS.s} hide={!visiblePhases.s} radius={[4, 4, 0, 0]} maxBarSize={5} />
                                        <Bar dataKey="t" name="فاز T" fill={PHASE_COLORS.t} hide={!visiblePhases.t} radius={[4, 4, 0, 0]} maxBarSize={5} />
                                    </BarChart>
                                ) : (
                                    /* 📈 نمودار خطی روند زمانی */
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
                                        {/*<Legend*/}
                                        {/*    verticalAlign="top"*/}
                                        {/*    height={36}*/}
                                        {/*    wrapperStyle={{ paddingBottom: '10px', direction: 'rtl', cursor: 'pointer' }}*/}
                                        {/*    onClick={(e) => {*/}
                                        {/*        const phase = selectedOption.phases?.find(p => p.label === e.value);*/}
                                        {/*        if (phase) togglePhase(phase.key);*/}
                                        {/*    }}*/}
                                        {/*/>*/}

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
                                )}
                            </ResponsiveContainer>
                        </div>

                        {/* جدول آمار */}
                        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                                    <thead style={{ backgroundColor: '#f4f6f8' }}>
                                    <tr>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>فاز / پارامتر</th>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>وضعیت</th>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>مقدار</th>
                                        <th style={{ padding: '10px 6px', borderBottom: '2px solid #ddd' }}>زمان / ثبت</th>
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
                                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
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
                                                        {row.time ? (row.time === '-' ? '-' : formatJalali(row.time, false)) : '-'}
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