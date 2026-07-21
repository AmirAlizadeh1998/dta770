interface DeviceProps {
    device: {
        id: number;
        device_name: string;
        owner_name: string;
        customer_id: string;
        acin: string;
        end_time: string;
        imei: string;
        last_seen_at: string;
    };
    onViewMonitor?: (deviceImei: string) => void;
}

export const DeviceCard = ({ device, onViewMonitor }: DeviceProps) => {
    // تبدیل تاریخ آخرین بازدید
    const lastSeen = new Date(device.last_seen_at).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    console.log("Current Time:", new Date());
    console.log("Device End Time (Raw):", device.end_time);
    console.log("Device End Time (Parsed):", new Date(device.end_time));

    // چک کردن اینکه آیا زمان الان از end_time رد شده یا نه
    const isOffline = device.end_time && !isNaN(new Date(device.end_time).getTime())
        ? new Date() > new Date(device.end_time) && String(device.acin) === "1"
        : false;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">

                {/* بخش وضعیت آنلاین / آفلاین */}
                {isOffline ? (
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-bold text-red-600 uppercase">Offline</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-600 uppercase">Online</span>
                    </div>
                )}

                <span className="text-gray-400 text-xs">IMEI: {device.imei}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1">{device.device_name}</h3>
            <p className="text-gray-500 text-sm mb-2">آخرین فعالیت: {lastSeen}</p>
            <p className="text-gray-500 text-sm mb-4">کد دستگاه: {device.customer_id || "نامشخص"}</p>

            <button
                onClick={() => onViewMonitor && onViewMonitor(device.imei)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
                مشاهده جزئیات
            </button>
        </div>
    );
};