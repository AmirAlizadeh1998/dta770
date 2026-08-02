import { useEffect, useState } from 'react';
import Select from 'react-select';
import { apiFetch } from "../../api/ApiClient.ts";
import type { Device, DeviceDetailsResponse } from "../../models/device.ts";
import {
    BasicInfoTab,
    CurrentTab, FrqTab,
    PowerTab,
    TimeInfoTable,
    VoltageTab
} from "../../components/deviceMonitorPage/MonitorComponents";
import { TABS } from "../../models/consts";
import ChartDashboard from "../../components/deviceMonitorPage/ChartView.tsx";
import { VoltageAlarmTable } from "../../components/deviceMonitorPage/AlarmTableComponent.tsx";

interface DeviceMonitorProps {
    initialImei?: string | null;
}

const DeviceMonitorPage = ({ initialImei }: DeviceMonitorProps) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedImei, setSelectedImei] = useState<string | null>(null);
    const [deviceDetails, setDeviceDetails] = useState<DeviceDetailsResponse | null>(null);
    const [activeTab, setActiveTab] = useState('basic');
    const token = localStorage.getItem("token");

    const isDeviceOffline = deviceDetails?.data?.IMEI === "offline";
    const isMissionEnded = !!(deviceDetails?.end_time && new Date(deviceDetails.end_time) < new Date());

    const options = devices.map((device) => ({
        value: device.imei,
        label: `${device.device_name} - ${device.imei}`,
        originalData: device
    }));

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

    useEffect(() => {
        if (initialImei && devices.length > 0) {
            const optionToSelect = options.find(opt => opt.value === initialImei);
            if (optionToSelect && selectedImei !== initialImei) {
                handleDeviceChange(optionToSelect);
            }
        }
    }, [initialImei, devices]);

    const fetchDeviceDetails = async (imei: string) => {
        try {
            const response = await fetch(`/api/monitor/devices?imei=${imei}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('خطا در دریافت اطلاعات دستگاه');
            const data = await response.json();
            setDeviceDetails(data);
        } catch (error) {
            console.error("خطا:", error);
        }
    };

    const handleDeviceChange = (selectedOption: any) => {
        if (!selectedOption) {
            setSelectedImei(null);
            setDeviceDetails(null);
            return;
        }
        setSelectedImei(selectedOption.value);
    };

    useEffect(() => {
        if (!selectedImei) return;
        fetchDeviceDetails(selectedImei);
        const intervalId = setInterval(() => {
            fetchDeviceDetails(selectedImei);
        }, 30000);
        return () => clearInterval(intervalId);
    }, [selectedImei, token]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1000px',
            margin: '20px auto',
            padding: '15px',
            fontFamily: 'IRANSans, Tahoma, sans-serif',
            boxSizing: 'border-box'
        }}>
            {/* استایل‌های کمکی برای حل چالش‌های رسپانسیو مدیا کوئری در اینلاین */}
            <style>{`
                .tabs-container {
                    display: flex;
                    border-bottom: 2px solid #eee;
                    margin-top: 30px;
                    direction: rtl;
                    gap: 15px;
                    padding-bottom: 0;
                    overflow-x: auto;
                    white-space: nowrap;
                    -webkit-overflow-scrolling: touch;
                }
                .tabs-container::-webkit-scrollbar {
                    display: none; /* مخفی کردن اسکرول‌بار برای زیبایی بیشتر */
                }
                .tab-item {
                    padding: 10px 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    flex-shrink: 0; /* جلوگیری از فشرده شدن تب‌ها در موبایل */
                }
                @media (max-width: 600px) {
                    .tab-item {
                        font-size: 13px;
                        padding: 8px 6px;
                    }
                }
            `}</style>

            {/* بخش انتخاب دستگاه */}
            <div style={{ marginBottom: '20px', direction: 'rtl' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '15px' }}>
                    دستگاه مورد نظر رو انتخاب کن:
                </label>
                <Select
                    options={options}
                    value={options.find(option => option.value === selectedImei) || null}
                    onChange={handleDeviceChange}
                    isRtl={true}
                    isSearchable={true}
                    isClearable={true}
                    placeholder="انتخاب دستگاه..."
                    noOptionsMessage={() => "دستگاهی پیدا نشد"}
                    styles={{
                        control: (base) => ({
                            ...base,
                            padding: '2px',
                            borderRadius: '8px',
                            borderColor: '#ddd',
                            fontSize: '15px',
                            minHeight: '40px'
                        })
                    }}
                />
            </div>

            {deviceDetails && (
                <>
                    {/* اطلاعات زمانی (اطمینان حاصل کن که داخل خود این کامپوننت هم ریسپانسیو چیده شده باشه) */}
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <TimeInfoTable
                            deviceDetails={deviceDetails}
                            isDeviceOffline={isDeviceOffline}
                            isMissionEnded={isMissionEnded}
                        />
                    </div>

                    {/* هدر تب‌ها با قابلیت اسکرول روی موبایل */}
                    <div className="tabs-container">
                        {TABS.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="tab-item"
                                style={{
                                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                    color: activeTab === tab.id ? '#17a2b8' : '#888',
                                    borderBottom: activeTab === tab.id ? '3px solid #17a2b8' : '3px solid transparent',
                                }}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>

                    {/* محتوای تب‌ها */}
                    <div style={{
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        padding: '15px',
                        marginTop: '15px',
                        direction: 'rtl',
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        overflowX: 'auto' /* اگر جداول داخلی عریض بودن، اسکرول افقی بخورند و قالب به هم نریزد */
                    }}>
                        {activeTab === 'basic' && <BasicInfoTab deviceDetails={deviceDetails} isDeviceOffline={isDeviceOffline} />}
                        {activeTab === 'voltage' && <VoltageTab deviceDetails={deviceDetails} />}
                        {activeTab === 'current' && <CurrentTab deviceDetails={deviceDetails} />}
                        {activeTab === 'power' && <PowerTab deviceDetails={deviceDetails} />}
                        {activeTab === 'frequency' && <FrqTab deviceDetails={deviceDetails} />}
                    </div>

                    {/* بخش نمودار و آلارم‌ها */}
                    <div style={{ width: '100%', overflowX: 'hidden', marginTop: '20px' }}>
                        <ChartDashboard imei={deviceDetails.imei}/>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto', marginTop: '20px' }}>
                        <VoltageAlarmTable deviceDetails={deviceDetails} />
                    </div>
                </>
            )}
        </div>
    );
};

export default DeviceMonitorPage;