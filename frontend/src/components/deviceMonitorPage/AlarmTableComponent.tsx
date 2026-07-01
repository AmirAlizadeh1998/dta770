import {FormatToJalali} from "../../utils/Formatters.ts";

export const VoltageAlarmTable = ({ deviceDetails }: { deviceDetails: any }) => {
    if (!deviceDetails?.data || !deviceDetails?.alarm) return null;

    // اینجا created_at رو به last_valid_data_time تغییر دادیم
    const { data, last_valid_data_time, start_time, end_time } = deviceDetails;

    let alarmObj = deviceDetails.alarm;
    if (typeof alarmObj === 'string') {
        try { alarmObj = JSON.parse(alarmObj); } catch (e) { return null; }
    }

    // بررسی محدوده زمانی با last_valid_data_time
    if (last_valid_data_time) {
        const logTime = new Date(last_valid_data_time).getTime();

        if (start_time) {
            const start = new Date(start_time).getTime();
            if (logTime < start) return null; // دیتای قبل از شروع رو نشون نمیده
        }

        if (end_time) {
            const end = new Date(end_time).getTime();
            if (logTime > end) return null; // دیتای بعد از پایان رو نشون نمیده
        }
    }

    const recordTime = last_valid_data_time ? FormatToJalali(last_valid_data_time) : 'نامشخص';

    // پارس کردن مقادیر آلارم (چون ممکنه استرینگ باشن)
    const llMin = alarmObj.line_to_line_lower ? parseFloat(alarmObj.line_to_line_lower) : null;
    const llMax = alarmObj.line_to_line_upper ? parseFloat(alarmObj.line_to_line_upper) : null;
    const lnMin = alarmObj.line_to_phase_lower ? parseFloat(alarmObj.line_to_phase_lower) : null;
    const lnMax = alarmObj.line_to_phase_upper ? parseFloat(alarmObj.line_to_phase_upper) : null;

    const errors: { name: string; value: number; type: string; min: number | null; max: number | null }[] = [];

    // تابع کمکی برای چک کردن محدوده
    const checkLimit = (valStr: string, name: string, min: number | null, max: number | null, type: string) => {
        if (!valStr) return;
        const val = parseFloat(valStr);
        // استفاده از فرمت ریاضی برای لاجیک $val < min$ یا $val > max$
        if ((min !== null && val < min) || (max !== null && val > max)) {
            errors.push({ name, value: val, type, min, max });
        }
    };

    // چک کردن ولتاژهای فاز به فاز (Line to Line)
    checkLimit(data.v_rs_cur, 'V_RS', llMin, llMax, 'فاز به فاز');
    checkLimit(data.v_rt_cur, 'V_RT', llMin, llMax, 'فاز به فاز');
    checkLimit(data.v_ts_cur, 'V_TS', llMin, llMax, 'فاز به فاز');

    // چک کردن ولتاژهای فاز به نول (Line to Phase/Neutral)
    checkLimit(data.v_rn_cur, 'V_RN', lnMin, lnMax, 'فاز به نول');
    checkLimit(data.v_sn_cur, 'V_SN', lnMin, lnMax, 'فاز به نول');
    checkLimit(data.v_tn_cur, 'V_TN', lnMin, lnMax, 'فاز به نول');

    if (errors.length === 0) {
        return (
            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '20px' }}>
                همه ولتاژها تو محدوده مجاز هستن! ✅
            </div>
        );
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <h4 style={{ color: '#dc3545' }}>⚠️ خطاهای ولتاژ (خارج از محدوده)</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                <tr style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
                    <th style={{ padding: '10px', border: '1px solid #f5c6cb' }}>زمان</th>
                    <th style={{ padding: '10px', border: '1px solid #f5c6cb' }}>پارامتر</th>
                    <th style={{ padding: '10px', border: '1px solid #f5c6cb' }}>نوع</th>
                    <th style={{ padding: '10px', border: '1px solid #f5c6cb' }}>مقدار</th>
                    <th style={{ padding: '10px', border: '1px solid #f5c6cb' }}>محدوده مجاز</th>
                </tr>
                </thead>
                <tbody>
                {errors.map((err, idx) => (
                    <tr key={idx} style={{ textAlign: 'center' }}>
                        <td style={{ padding: '10px', border: '1px solid #eee', fontSize: '0.9em', color: '#555' }} dir="ltr">
                            {recordTime}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #eee' }}>{err.name}</td>
                        <td style={{ padding: '10px', border: '1px solid #eee' }}>{err.type}</td>
                        <td style={{ padding: '10px', border: '1px solid #eee', color: '#dc3545', fontWeight: 'bold' }}>{err.value}</td>
                        <td style={{ padding: '10px', border: '1px solid #eee', direction: 'ltr' }}>
                            [{err.min ?? '-'}, {err.max ?? '-'}]
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};