import React from 'react';

// ۱. اینجا بهش می‌گیم که دیتا یه آبجکت با کلیدهای متنی و مقادیر دلخواهه
interface SensorDataProps {
    data: Record<string, any>;
}

// ۲. به کامپوننت می‌گیم از این تایپ استفاده کن
const SensorDataCards: React.FC<SensorDataProps> = ({ data }) => {
    if (!data) return <span>دیتایی وجود ندارد</span>;

    // ۳. به تایپ‌اسکریپت می‌فهمونیم که داخل هر گروه، یه آبجکت با کلید استرینگ و مقدار انی داریم
    const groups: Record<string, Record<string, any>> = {
        "اطلاعات دستگاه": {},
        "ولتاژ (V)": {},
        "جریان (I)": {},
        "توان (ظاهری،اکتیو،راکتیو)": {},
        "فرکانس (f)": {},
        "هارمونیک و THD": {},
        "سایر": {}
    };

    Object.entries(data).forEach(([key, value]) => {
        if (key.includes('imei') || key.includes('acin') || key.includes('model') || key.includes('clock') || key.includes('sig')) {
            groups["اطلاعات دستگاه"][key] = value;
        } else if (key.startsWith('v_')) {
            groups["ولتاژ (V)"][key] = value;
        } else if (key.startsWith('ir_') || key.startsWith('is_') || key.startsWith('it_')) {
            groups["جریان (I)"][key] = value;
        } else if (key.startsWith('p_')) {
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
            maxHeight: '150px', // ارتفاع رو می‌تونی بسته به سلیقه‌ت کم و زیاد کنی
            overflowY: 'auto',  // اسکرول عمودی رو فعال می‌کنه
            padding: '8px',
            border: '1px solid #e5e7eb', // یه حاشیه کمرنگ و تمیز
            borderRadius: '6px',
            backgroundColor: '#fafafa' // یه بک‌گراند خیلی ملایم که کارت‌ها خودشون رو نشون بدن
        }}>
            {Object.entries(groups).map(([groupName, items]) => {
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