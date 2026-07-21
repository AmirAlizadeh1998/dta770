import { useEffect, useState } from "react";
import { DeviceCard } from "./ActiveDevicesPage.tsx";
import {apiFetch} from "../../api/ApiClient.ts";

interface Device {
    id: number;
    device_name: string;
    owner_name: string;
    customer_id: string;
    acin: string;
    end_time: string;
    imei: string;
    last_seen_at: string;
}

export default function ActiveDevicesView() {
    const [devices, setDevices] = useState<Device[]>([]);

    useEffect(() => {
        const loadDevices = async () => {
            try {
                const res = await apiFetch("/api/devices/active", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });

                const data = await res.json();
                setDevices(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load devices", err);
                setDevices([]);
            }
        };

        loadDevices();

        const interval = setInterval(loadDevices, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">دستگاه‌های فعال</h2>
                <p className="text-gray-500">
                    دستگاه‌هایی که در ۱۰ دقیقه اخیر فعال بوده‌اند ({devices.length})
                </p>
            </div>

            {devices.length === 0 ? (
                <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed text-gray-500">
                    هیچ دستگاه فعالی وجود ندارد
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {devices.map((device) => (
                        <DeviceCard
                            key={device.id}
                            device={device}
                            onViewMonitor={(id) => {
                                // بفرست برای داشبورد
                                window.dispatchEvent(new CustomEvent("monitor-device", { detail: id }))
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}