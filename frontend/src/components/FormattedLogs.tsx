import React from 'react';

interface SensorDataProps {
    data: Record<string, any>;
}

// لیست کلیدهایی که نمی‌خوایم توی کارت‌های سنسور نشون داده بشن (چون توی ستون مشخصات دستگاه هستن)
const IGNORED_KEYS = new Set([
    'imei',
    'IMEI',
    'acin',
    'model',
    'customer_id',
    'work_clock',
    'sig_quality',
    'id',
    'created_at'
]);

const SensorDataCards: React.FC<SensorDataProps> = ({ data }) => {
    if (!data) return <span>دیتایی وجود ندارد</span>;

    const groups: Record<string, Record<string, any>> = {
        "ولتاژ (V)": {},
        "جریان (I)": {},
        "توان (ظاهری،اکتیو،راکتیو)": {},
        "ضریب توان (Cos φ)": {}, // اختیاری: اگه cos_phi داشتی خوش‌دست‌تره
        "فرکانس (f)": {},
        "هارمونیک و THD": {},
        "سایر": {}
    };

    Object.entries(data).forEach(([key, value]) => {
        // ۱. اگه کلید جزو مشخصات عمومی دستگاه بود، ردش کن
        if (IGNORED_KEYS.has(key) || IGNORED_KEYS.has(key.toLowerCase())) {
            return;
        }

        // ۲. بقیه رو بفرست توی دسته‌بندی خودشون
        if (key.startsWith('v_')) {
            groups["ولتاژ (V)"][key] = value;
        } else if (key.startsWith('ir_') || key.startsWith('is_') || key.startsWith('it_')) {
            groups["جریان (I)"][key] = value;
        } else if (key.startsWith('cos_')) {
            groups["ضریب توان (Cos φ)"][key] = value;
        } else if (key.startsWith('p_') || key.startsWith('p_act') || key.startsWith('p_ract') || key.startsWith('p_apparent')) {
            groups["توان (ظاهری،اکتیو،راکتیو)"][key] = value;
        } else if (key.startsWith('frq_')) {
            groups["فرکانس (f)"][key] = value;
        } else if (key.includes('harmonic') || key.includes('thd')) {
            groups["هارمونیک و THD"][key] = value;
        } else {
            groups["سایر"][key] = value;
        }
    });

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '12px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: '#fafafa'
        }}>
            {Object.entries(groups).map(([groupName, items]) => {
                // اگه دسته‌ای خالی بود (مثلاً سایر دیگه خالی شد)، اصلاً رندرش نکن
                if (Object.keys(items).length === 0) return null;

                return (
                    <div key={groupName} style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '8px',
                        minWidth: '150px',
                        backgroundColor: '#f9f9f9',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #ccc', paddingBottom: '4px', color: '#333' }}>
                            {groupName}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '10px', rowGap: '4px' }}>
                            {Object.entries(items).map(([k, v]) => (
                                <React.Fragment key={k}>
                                    <span style={{ color: '#666', fontWeight: 'bold' }}>{k}:</span>
                                    <span style={{ color: '#000', textAlign: 'left' }} dir="ltr">{String(v)}</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SensorDataCards;