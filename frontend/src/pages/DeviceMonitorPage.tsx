import {useEffect, useState} from 'react';
import Select from 'react-select';
import {apiFetch} from "../api/ApiClient.ts";
import type {Device, DeviceDetailsResponse} from "../models/device.ts";
import {
    BasicInfoTab,
    CurrentTab, FrqTab,
    PowerTab,
    TimeInfoTable,
    VoltageTab
} from "../components/deviceMonitorPage/MonitorComponents";
import {TABS} from "../models/consts";
import ChartDashboard from "../components/deviceMonitorPage/ChartView.tsx";
import {VoltageAlarmTable} from "../components/deviceMonitorPage/AlarmTableComponent.tsx";

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
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'IRANSans, Tahoma, sans-serif' }}>

            {/* بخش انتخاب دستگاه */}
            <div style={{ marginBottom: '30px', direction: 'rtl' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
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
                            ...base, padding: '4px', borderRadius: '8px', borderColor: '#ddd', fontSize: '16px'
                        })
                    }}
                />
            </div>

            {deviceDetails && (
                <>
                    {/* اطلاعات زمانی */}
                    <TimeInfoTable
                        deviceDetails={deviceDetails}
                        isDeviceOffline={isDeviceOffline}
                        isMissionEnded={isMissionEnded}
                    />

                    {/* هدر تب‌ها */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginTop: '30px', direction: 'rtl', gap: '30px', paddingBottom: '0' }}>
                        {TABS.map((tab) => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '10px 5px', cursor: 'pointer', fontSize: '14px',
                                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                    color: activeTab === tab.id ? '#17a2b8' : '#888',
                                    borderBottom: activeTab === tab.id ? '3px solid #17a2b8' : '3px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>

                    {/* محتوای تب‌ها */}
                    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', marginTop: '20px', direction: 'rtl', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        {activeTab === 'basic' && <BasicInfoTab deviceDetails={deviceDetails} isDeviceOffline={isDeviceOffline} />}
                        {activeTab === 'voltage' && <VoltageTab deviceDetails={deviceDetails} />}
                        {activeTab === 'current' && <CurrentTab deviceDetails={deviceDetails} />}
                        {activeTab === 'power' && <PowerTab deviceDetails={deviceDetails} />}
                        {activeTab === 'frequency' && <FrqTab deviceDetails={deviceDetails} />}
                    </div>

                    <ChartDashboard imei={deviceDetails.imei}/>
                    <VoltageAlarmTable deviceDetails={deviceDetails} />
                </>
            )}
        </div>
    );
};

export default DeviceMonitorPage;