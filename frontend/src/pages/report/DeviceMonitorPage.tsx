import { useEffect, useState } from 'react';
import Select from 'react-select';
import { apiFetch } from "../../api/ApiClient.ts";
import type {
    Device,
    DeviceDetailsResponse,
    DeviceMonitorSelection
} from "../../models/device.ts";
import {
    BasicInfoTab,
    CurrentTab, FrqTab,
    PowerTab,
    TimeInfoTable,
    VoltageTab
} from "../../components/deviceMonitorPage/MonitorComponents.tsx";
import { TABS } from "../../models/consts";
import ChartDashboard from "../../components/deviceMonitorPage/ChartView.tsx";
import { VoltageAlarmTable } from "../../components/deviceMonitorPage/AlarmTableComponent.tsx";

interface DeviceMonitorProps {
    initialImei?: string | null;
    initialDevice?: DeviceMonitorSelection | null;
}

// تایپ آپشن‌های Select برای تایپ سیف بودن کامل
interface DeviceOption {
    value: string;
    label: string;
    deviceName: string;
    imei: string;
    originalData: Device;
}

const getDeviceKey = (deviceName: string, imei: string) =>
    `${deviceName}-${imei}`;

const DeviceMonitorPage = ({ initialImei, initialDevice }: DeviceMonitorProps) => {
    const getDeviceStatus = (): 'unknown' | 'offline' | 'online' => {
        const data = deviceDetails?.data;

        // ۱. اگر دیتا کلا نیومده بود (null یا undefined)
        if (!data) return 'unknown';

        // ۲. اگر بک‌اند آبجکت یا آرایه خالی فرستاده بود {} یا []
        if (typeof data === 'object' && Object.keys(data).length === 0) return 'unknown';

        // ۳. اگر بک‌اند Go استراکت رو با مقادیر پیش‌فرض (خالی) فرستاده باشه
        // مثلا چک می‌کنیم اگر مدل، کد و ... خالی بود و آفلاین هم نبود، یعنی دیتای مفیدی نداریم
        if (!data.model && !data.customer_id && !data.work_clock && data.IMEI !== "offline") {
            return 'unknown';
        }

        // ۴. بررسی حالت آفلاین
        if (data.IMEI === "offline") {
            return 'offline';
        }

        // ۵. اگر هیچکدوم از بالا نبود، پس دستگاه واقعا روشنه و دیتا داره
        return 'online';
    };

    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceMonitorSelection | null>(null);
    const [deviceDetails, setDeviceDetails] = useState<DeviceDetailsResponse | null>(null);
    const [activeTab, setActiveTab] = useState('basic');
    const token = localStorage.getItem("token");

    const deviceStatus = getDeviceStatus();
    const isMissionEnded = !!(deviceDetails?.end_time && new Date(deviceDetails.end_time) < new Date());

    // مقدار گزینه، ترکیب نام دستگاه و IMEI است تا جستجو و انتخاب بر اساس همین شناسه انجام شود.
    const options: DeviceOption[] = devices.map((device) => ({
        value: getDeviceKey(device.device_name, device.imei),
        label: `${device.device_name} - ${device.imei}`,
        deviceName: device.device_name,
        imei: device.imei,
        originalData: device
    }));

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await apiFetch("/api/devices", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();
                const deviceList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];
                setDevices(deviceList);
            } catch (error) {
                console.error("خطا در دریافت لیست دستگاه‌ها:", error);
            }
        };
        fetchDevices();
    }, [token]);

    useEffect(() => {
        if (devices.length === 0) return;

        const requestedImei = initialDevice?.imei || initialImei;
        if (!requestedImei) return;

        const deviceToSelect = devices.find((device) => {
            if (initialDevice?.deviceName) {
                return device.device_name === initialDevice.deviceName &&
                    device.imei === requestedImei;
            }
            return device.imei === requestedImei;
        });

        if (deviceToSelect) {
            setDeviceDetails(null);
            setSelectedDevice({
                deviceName: deviceToSelect.device_name,
                imei: deviceToSelect.imei
            });
        }
    }, [initialDevice, initialImei, devices]);

    // دریافت جزئیات دستگاه با ترکیب نام و IMEI
    const fetchDeviceDetails = async (deviceName: string, imei: string) => {
        try {
            const queryParams = new URLSearchParams({
                device_name: deviceName,
                imei: imei
            });
            const response = await fetch(`/api/monitor/devices?${queryParams.toString()}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('خطا در دریافت اطلاعات دستگاه');
            const data = await response.json();
            setDeviceDetails({
                ...data,
                // برای سازگاری با پاسخ‌های قدیمی، نام انتخاب‌شده را نگه می‌داریم.
                device_name: data.device_name || deviceName
            });
        } catch (error) {
            console.error("خطا:", error);
        }
    };

    const handleDeviceChange = (selectedOption: DeviceOption | null) => {
        if (!selectedOption) {
            setSelectedDevice(null);
            setDeviceDetails(null);
            return;
        }
        setDeviceDetails(null);
        setSelectedDevice({
            deviceName: selectedOption.deviceName,
            imei: selectedOption.imei
        });
    };

    useEffect(() => {
        if (!selectedDevice) return;

        fetchDeviceDetails(selectedDevice.deviceName, selectedDevice.imei);
        const intervalId = setInterval(() => {
            fetchDeviceDetails(selectedDevice.deviceName, selectedDevice.imei);
        }, 30000);

        return () => clearInterval(intervalId);
    }, [selectedDevice, token]);

    return (
        <div style={{
            width: '100%',
            maxWidth: '1000px',
            margin: '20px auto',
            padding: '15px',
            fontFamily: 'IRANSans, Tahoma, sans-serif',
            boxSizing: 'border-box'
        }}>
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
                    display: none;
                }
                .tab-item {
                    padding: 10px 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
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
                    value={
                        selectedDevice
                            ? options.find(
                                (opt) =>
                                    opt.value === getDeviceKey(
                                        selectedDevice.deviceName,
                                        selectedDevice.imei
                                    )
                            ) || null
                            : null
                    }
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => option.value}
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
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <TimeInfoTable
                            deviceDetails={deviceDetails}
                            deviceStatus={deviceStatus}
                            isMissionEnded={isMissionEnded}
                        />
                    </div>

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

                    <div style={{
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        padding: '15px',
                        marginTop: '15px',
                        direction: 'rtl',
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        overflowX: 'auto'
                    }}>
                        {activeTab === 'basic' && <BasicInfoTab deviceDetails={deviceDetails} deviceStatus={deviceStatus} />}
                        {activeTab === 'voltage' && <VoltageTab deviceDetails={deviceDetails} />}
                        {activeTab === 'current' && <CurrentTab deviceDetails={deviceDetails} />}
                        {activeTab === 'power' && <PowerTab deviceDetails={deviceDetails} />}
                        {activeTab === 'frequency' && <FrqTab deviceDetails={deviceDetails} />}
                    </div>

                    <div style={{ width: '100%', overflowX: 'hidden', marginTop: '20px' }}>
                        <ChartDashboard
                            imei={deviceDetails.imei}
                            deviceName={selectedDevice?.deviceName || deviceDetails.device_name || ''}
                        />
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
