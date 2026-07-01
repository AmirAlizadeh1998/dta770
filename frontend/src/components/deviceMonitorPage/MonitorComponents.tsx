import type {DeviceDetails, DeviceDetailsResponse} from "../../models/device";
import {FormatSignalQuality, FormatToJalali, FormatWorkClock} from "../../utils/Formatters";
import {CURRENT_CARDS, POWER_CARDS, VOLTAGE_CARDS, FRQ_CARDS} from "../../models/consts.ts"

export const TimeInfoTable = ({deviceDetails, isDeviceOffline, isMissionEnded}: {
    deviceDetails: DeviceDetailsResponse,
    isDeviceOffline: boolean,
    isMissionEnded: boolean
}) => (
    <>
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            marginTop: '20px',
            direction: 'rtl',
            backgroundColor: '#fff'
        }}>
            <div style={{
                backgroundColor: '#2c3e50',
                color: 'white',
                textAlign: 'center',
                padding: '12px',
                fontWeight: 'bold',
                fontSize: '15px'
            }}>
                اطلاعات زمانی دستگاه
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px'}}>
                <tbody>
                <tr>
                    <td style={{padding: '12px', borderBottom: '1px solid #eee'}}>
                        <div style={{color: '#666'}}>زمان شروع نصب</div>
                        <div style={{color: '#0056b3', direction: 'ltr'}}>
                            {deviceDetails.start_time ? FormatToJalali(deviceDetails.start_time) : '-'}
                        </div>
                    </td>

                    <td style={{padding: '12px', borderRight: '1px solid #ddd', borderBottom: '1px solid #eee'}}>
                        <div style={{color: '#666'}}>زمان اتمام ماموریت</div>
                        <div style={{color: '#0056b3', direction: 'ltr'}}>
                            {deviceDetails.end_time ? FormatToJalali(deviceDetails.end_time) : '-'}
                        </div>
                    </td>
                </tr>

                <tr>
                    <td style={{padding: '12px'}}>
                        <div style={{color: '#666'}}>آخرین ارتباط با سرور</div>
                        <div style={{
                            color: isDeviceOffline ? '#dc3545' : '#28a745',
                            direction: 'ltr',
                            fontWeight: 'bold'
                        }}>
                            {deviceDetails.created_at ? FormatToJalali(deviceDetails.created_at) : '-'}
                        </div>
                    </td>

                    <td style={{padding: '12px', borderRight: '1px solid #ddd'}}>
                        <div style={{color: '#666'}}>زمان آخرین دیتا</div>
                        <div style={{color: '#0056b3', direction: 'ltr'}}>
                            {deviceDetails.last_valid_data_time
                                ? FormatToJalali(deviceDetails.last_valid_data_time)
                                : '-'}
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        {isMissionEnded && (
            <div style={{
                backgroundColor: '#fd7e14',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '8px',
                marginTop: '20px',
                direction: 'rtl',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span>🚩 ماموریت این دستگاه در تاریخ {deviceDetails.end_time ? FormatToJalali(deviceDetails.end_time) : '-'} پایان یافته است</span>
            </div>
        )}
    </>
);

export const BasicInfoTab = ({deviceDetails, isDeviceOffline}: {
    deviceDetails: DeviceDetailsResponse,
    isDeviceOffline: boolean
}) => (
    <div>
        <h4 style={{
            color: '#444',
            marginBottom: '20px',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '10px'
        }}>اطلاعات دستگاه</h4>
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{color: '#888', fontSize: '13px'}}>وضعیت دستگاه</span>
                <span style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: isDeviceOffline ? '#dc3545' : '#28a745',
                    backgroundColor: isDeviceOffline ? '#fce8e6' : '#e6f4ea',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isDeviceOffline ? '#dc3545' : '#28a745',
                        display: 'inline-block'
                    }}></span>
                    {isDeviceOffline ? 'خاموش' : 'روشن'}
                </span>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #eee',
                paddingTop: '15px'
            }}>
                <span style={{color: '#888', fontSize: '13px'}}>شناسه یکتا دستگاه (IMEI)</span>
                <span style={{fontWeight: 'bold', fontSize: '14px'}}>{deviceDetails.imei || '-'}</span>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #eee',
                paddingTop: '15px'
            }}>
                <span style={{color: '#888', fontSize: '13px'}}>مدل دستگاه</span>
                <span style={{fontWeight: 'bold', fontSize: '14px'}}>{deviceDetails.data?.model || '-'}</span>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #eee',
                paddingTop: '15px'
            }}>
                <span style={{color: '#888', fontSize: '13px'}}>کد دستگاه</span>
                <span style={{fontWeight: 'bold', fontSize: '14px'}}>{deviceDetails.data?.customer_id || '-'}</span>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #eee',
                paddingTop: '15px'
            }}>
                <span style={{color: '#888', fontSize: '13px'}}>ساعت کارکرد دستگاه</span>
                <span style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    direction: 'rtl'
                }}>{deviceDetails.data?.work_clock ? FormatWorkClock(deviceDetails.data.work_clock) : '-'}</span>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #eee',
                paddingTop: '15px'
            }}>
                <span style={{color: '#888', fontSize: '13px'}}>کیفیت سیگنال ارتباطی</span>
                <span style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    direction: 'ltr'
                }}>{deviceDetails.data?.sig_quality ? FormatSignalQuality(deviceDetails.data.sig_quality) : '-'}</span>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px dashed #eee',
                paddingTop: '15px'
            }}>
                <span style={{color: '#888', fontSize: '13px'}}>وضعیت برق</span>
                <span style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: deviceDetails.data?.acin === "1" ? '#28a745' : '#dc3545',
                    backgroundColor: deviceDetails.data?.acin === "1" ? '#e6f4ea' : '#fce8e6',
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {deviceDetails.data?.acin === "1" ? 'وصل' : 'قطع'}
                </span>
            </div>
        </div>
    </div>
);

export const VoltageTab = ({deviceDetails}: { deviceDetails: DeviceDetailsResponse }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        direction: 'rtl'
    }}>
        {VOLTAGE_CARDS.map((card, cardIndex) => (
            <div key={cardIndex} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <h5 style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#334155',
                    fontWeight: 'bold',
                    fontSize: '15px'
                }}>{card.title}</h5>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    {card.items.map((item, itemIndex) => {
                        const value = deviceDetails.data?.[item.key as keyof DeviceDetails] ?? '0';
                        return (
                            <div key={itemIndex} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px dashed #e2e8f0'
                            }}>
                                {/* بخش سمت راست: لیبل فارسی + کلید انگلیسی */}
                                <span style={{color: '#64748b', fontSize: '13px'}}>
                                    {item.label}
                                    {' - '}
                                    {/* با این استایل، کلید انگلیسی کاملا از متن فارسی جدا میشه و خط تیره سر جاش میمونه */}
                                    <span dir="ltr" style={{
                                        color: '#94a3b8',
                                        display: 'inline-block', // مهم: برای ایزوله کردن جهت متن
                                        unicodeBidi: 'isolate'
                                    }}>
                                        {item.key}
                                    </span>
                                </span>

                                {/* بخش سمت چپ: مقدار (عدد) + واحد (انگلیسی) */}
                                <span dir="ltr" style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    display: 'inline-flex', // مهم: عدد و واحد رو تو یه باکس چپ‌به‌چپ نگه میداره
                                    gap: '4px',
                                    alignItems: 'center',
                                    unicodeBidi: 'isolate'
                                }}>
                                    <span>{value} V</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
);

export const CurrentTab = ({deviceDetails}: { deviceDetails: DeviceDetailsResponse }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        direction: 'rtl'
    }}>
        {CURRENT_CARDS.map((card, cardIndex) => (
            <div key={cardIndex} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <h5 style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#334155',
                    fontWeight: 'bold',
                    fontSize: '15px'
                }}>{card.title}</h5>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    {card.items.map((item, itemIndex) => {
                        const value = deviceDetails.data?.[item.key as keyof DeviceDetails] ?? '0';
                        return (
                            <div key={itemIndex} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px dashed #e2e8f0'
                            }}>
                                {/* بخش سمت راست: لیبل فارسی + کلید انگلیسی */}
                                <span style={{color: '#64748b', fontSize: '13px'}}>
                                    {item.label}
                                    {' - '}
                                    {/* با این استایل، کلید انگلیسی کاملا از متن فارسی جدا میشه و خط تیره سر جاش میمونه */}
                                    <span dir="ltr" style={{
                                        color: '#94a3b8',
                                        display: 'inline-block', // مهم: برای ایزوله کردن جهت متن
                                        unicodeBidi: 'isolate'
                                    }}>
                                        {item.key}
                                    </span>
                                </span>

                                {/* بخش سمت چپ: مقدار (عدد) + واحد (انگلیسی) */}
                                <span dir="ltr" style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    display: 'inline-flex', // مهم: عدد و واحد رو تو یه باکس چپ‌به‌چپ نگه میداره
                                    gap: '4px',
                                    alignItems: 'center',
                                    unicodeBidi: 'isolate'
                                }}>
                                    <span>{value} A</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
);

export const PowerTab = ({deviceDetails}: { deviceDetails: DeviceDetailsResponse }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr', // چون کارت‌ها طولانین، بهتره کل عرض رو بگیرن (یا ۲ ستونه بشن)
        gap: '20px',
        direction: 'rtl'
    }}>
        {POWER_CARDS.map((card, cardIndex) => (
            <div key={cardIndex} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <h5 style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#334155',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    borderBottom: '2px solid #f1f5f9',
                    paddingBottom: '10px'
                }}>{card.title}</h5>

                {/* اینجا به جای یه ستون، آیتم‌های داخل کارت رو ۲ ستونه کردیم که ارتفاع کم بشه */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '0 30px'
                }}>
                    {card.items.map((item, itemIndex) => {
                        const value = deviceDetails.data?.[item.key as keyof DeviceDetails] ?? '0';
                        return (
                            <div key={itemIndex} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px dashed #e2e8f0'
                            }}>
                                {/* بخش سمت راست: لیبل فارسی + کلید انگلیسی */}
                                <span style={{color: '#64748b', fontSize: '13px'}}>
                                    {item.label}
                                    {' - '}
                                    {/* با این استایل، کلید انگلیسی کاملا از متن فارسی جدا میشه و خط تیره سر جاش میمونه */}
                                    <span dir="ltr" style={{
                                        color: '#94a3b8',
                                        display: 'inline-block', // مهم: برای ایزوله کردن جهت متن
                                        unicodeBidi: 'isolate'
                                    }}>
                                        {item.key}
                                    </span>
                                </span>

                                {/* بخش سمت چپ: مقدار (عدد) + واحد (انگلیسی) */}
                                <span dir="ltr" style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    display: 'inline-flex', // مهم: عدد و واحد رو تو یه باکس چپ‌به‌چپ نگه میداره
                                    gap: '4px',
                                    alignItems: 'center',
                                    unicodeBidi: 'isolate'
                                }}>
                                    <span>{value}</span>
                                    {/* اگه واحد داشت، اینجا رندر میشه */}
                                    {card.unit && (
                                        <span style={{fontSize: '12px', color: '#475569'}}>
                                            {card.unit}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
);

export const FrqTab = ({deviceDetails}: { deviceDetails: DeviceDetailsResponse }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr', // چون کارت‌ها طولانین، بهتره کل عرض رو بگیرن (یا ۲ ستونه بشن)
        gap: '20px',
        direction: 'rtl'
    }}>
        {FRQ_CARDS.map((card, cardIndex) => (
            <div key={cardIndex} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <h5 style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#334155',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    borderBottom: '2px solid #f1f5f9',
                    paddingBottom: '10px'
                }}>{card.title}</h5>

                {/* اینجا به جای یه ستون، آیتم‌های داخل کارت رو ۲ ستونه کردیم که ارتفاع کم بشه */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '0 30px'
                }}>
                    {card.items.map((item, itemIndex) => {
                        const value = deviceDetails.data?.[item.key as keyof DeviceDetails] ?? '0';
                        return (
                            <div key={itemIndex} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: '1px dashed #e2e8f0'
                            }}>
                                {/* بخش سمت راست: لیبل فارسی + کلید انگلیسی */}
                                <span style={{color: '#64748b', fontSize: '13px'}}>
                                    {item.label}
                                    {' - '}
                                    {/* با این استایل، کلید انگلیسی کاملا از متن فارسی جدا میشه و خط تیره سر جاش میمونه */}
                                    <span dir="ltr" style={{
                                        color: '#94a3b8',
                                        display: 'inline-block', // مهم: برای ایزوله کردن جهت متن
                                        unicodeBidi: 'isolate'
                                    }}>
                                        {item.key}
                                    </span>
                                </span>

                                {/* بخش سمت چپ: مقدار (عدد) + واحد (انگلیسی) */}
                                <span dir="ltr" style={{
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    color: '#0f172a',
                                    display: 'inline-flex', // مهم: عدد و واحد رو تو یه باکس چپ‌به‌چپ نگه میداره
                                    gap: '4px',
                                    alignItems: 'center',
                                    unicodeBidi: 'isolate'
                                }}>
                                    <span>{value}</span>
                                    {/* اگه واحد داشت، اینجا رندر میشه */}
                                    {card.unit && (
                                        <span style={{fontSize: '12px', color: '#475569'}}>
                                            {card.unit}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
    </div>
);