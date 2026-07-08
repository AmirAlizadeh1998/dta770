import React, { useState, useEffect, useMemo } from "react"
import JalaliDatePicker from "../../components/JalaliDatePicker.tsx"

import {FormatToJalali} from "../../utils/Formatters.ts";
import { UserRole } from "../../models/consts.ts";
import {jwtDecode} from "jwt-decode";

type Device = {
    id: number | string
    device_name: string
    owner_name: string
    imei: string
    start_time: string
    end_time: string
    phone: string
    address?: string
    longitude?: string
    latitude?: string
    fuse_box?: boolean
    null_connection?: boolean
    fuse_comb?: boolean
    line_balance?: boolean
    unit_earth?: boolean
    ups_battery?: boolean
    distance_from_trans?: string
    cable_size?: string
    three_phase?: boolean
    materials?: string
    description?: string
    is_active: boolean
    // آبجکت آلارم که از دیتابیس میاد
    alarm?: {
        line_to_line_upper?: string | null
        line_to_line_lower?: string | null
        line_to_phase_upper?: string | null
        line_to_phase_lower?: string | null
    } | string
}

type DeviceForm = {
    deviceName: string
    ownerName: string
    imei: string
    startTime: string
    endTime: string
    phone: string
    address: string
    longitude: string
    latitude: string
    distanceFromTrans: string
    cableSize: string
    threePhase: boolean
    materials: string
    description: string
    isActive: boolean
    fuseBox: boolean
    nullConnection: boolean
    fuseComb: boolean
    lineBalance: boolean
    unitEarth: boolean
    upsBattery: boolean
    lineToLineUpper: string
    lineToLineLower: string
    lineToPhaseUpper: string
    lineToPhaseLower: string
    // استیت‌های جدید برای کنترل چک‌باکس ولتاژها
    enableLineToLine: boolean
    enableLineToNull: boolean
}

const initialForm: DeviceForm = {
    deviceName: "", ownerName: "", imei: "", startTime: "", endTime: "",
    phone: "", address: "", longitude: "", latitude: "",
    distanceFromTrans: "", cableSize: "", threePhase: false,
    materials: "", description: "", isActive: false,
    fuseBox: false, nullConnection: false, fuseComb: false,
    lineBalance: false, unitEarth: false, upsBattery: false,
    lineToLineUpper: "", lineToLineLower: "",
    lineToPhaseUpper: "", lineToPhaseLower: "",
    enableLineToLine: false,
    enableLineToNull: false,
}

const connectionFields: { key: keyof DeviceForm; label: string }[] = [
    { key: "fuseBox", label: "اتصالات و جعبه فیوز" },
    { key: "nullConnection", label: "اتصالات نول" },
    { key: "fuseComb", label: "شانه فیوز" },
    { key: "lineBalance", label: "بالانس خط‌ها" },
    { key: "unitEarth", label: "ارت واحد" },
    { key: "upsBattery", label: "UPS باطری" },
]

type FieldProps = {
    label: string
    fieldKey: keyof DeviceForm
    value: string
    required?: boolean
    placeholder?: string
    error?: string
    onChange: (key: keyof DeviceForm, value: string) => void
}

function Field({ label, fieldKey, value, required, placeholder, onChange, error }: FieldProps) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <label className="w-32 shrink-0 text-sm text-gray-600 text-left">
                {label}{required && <span className="text-red-500"> *</span>}
            </label>
            <div className="flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(fieldKey, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        error ? "border-red-400" : "border-gray-300"
                    }`}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        </div>
    )
}

export default function DeviceManagePage() {
    const [form, setForm] = useState<DeviceForm>(initialForm)
    const [errors, setErrors] = useState<Partial<Record<keyof DeviceForm, string>>>({})
    const [devices, setDevices] = useState<Device[]>([])

    const [editingId, setEditingId] = useState<number | string | null>(null)

    const fetchDevices = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch("/api/devices", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setDevices(data.data || data || [])
            } else {
                console.error("سرور ارور داد:", response.status)
            }
        } catch (error) {
            console.error("خطا در دریافت لیست دستگاه‌ها:", error)
        }
    }

    useEffect(() => {
        fetchDevices()
    }, [])

    const validate = (): boolean => {
        const e: Partial<Record<keyof DeviceForm, string>> = {}
        if (!form.deviceName.trim()) e.deviceName = "نام دستگاه اجباری است"
        if (!form.ownerName.trim()) e.ownerName = "نام مالک اجباری است"
        if (!form.imei.trim()) {
            e.imei = "IMEI اجباری است"
        } else if (!/^\d{15}$/.test(form.imei)) {
            e.imei = "IMEI باید ۱۵ رقم باشد"
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleChange = (key: keyof DeviceForm, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (editingId && !canEdit) {
            alert("شما مجاز به ویرایش نمی‌باشید! 🚫");
            return;
        }
        
        if (form.startTime && form.endTime) {
            const start = new Date(form.startTime).getTime();
            const end = new Date(form.endTime).getTime();

            if (end <= start) {
                alert("تاریخ و ساعت پایان باید حتماً بعد از تاریخ شروع باشد!");
                return;
            }
        }
        if (!validate()) return

        const alarmData = {
            line_to_line_upper: form.enableLineToLine && form.lineToLineUpper ? form.lineToLineUpper : null,
            line_to_line_lower: form.enableLineToLine && form.lineToLineLower ? form.lineToLineLower : null,
            line_to_phase_upper: form.enableLineToNull && form.lineToPhaseUpper ? form.lineToPhaseUpper : null,
            line_to_phase_lower: form.enableLineToNull && form.lineToPhaseLower ? form.lineToPhaseLower : null,
        }

        try {
            const token = localStorage.getItem("token")
            const method = editingId ? "PUT" : "POST"
            const endpoint = editingId ? `/api/devices/${editingId}` : "/api/devices"

            const response = await fetch(`${endpoint}`, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    device_name: form.deviceName,
                    owner_name: form.ownerName,
                    imei: form.imei,
                    start_time: form.startTime,
                    end_time: form.endTime,
                    phone: form.phone,
                    address: form.address,
                    longitude: form.longitude,
                    latitude: form.latitude,
                    fuse_box: form.fuseBox,
                    null_connection: form.nullConnection,
                    fuse_comb: form.fuseComb,
                    line_balance: form.lineBalance,
                    unit_earth: form.unitEarth,
                    ups_battery: form.upsBattery,
                    distance_from_trans: form.distanceFromTrans,
                    cable_size: form.cableSize,
                    three_phase: form.threePhase,
                    materials: form.materials,
                    description: form.description,
                    is_active: form.isActive,
                    alarm: JSON.stringify(alarmData),
                    voice_note_path: "",
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                // اگه سرور ارور داد (مثل خطای تکراری بودن IMEI)، همون پیام رو نشون میدیم
                console.error(data.message || "خطا در ذخیره اطلاعات")
                alert(data.message || "خطایی رخ داده است ❌")

                // اگه دوست داشتی زیر فیلد اینپوت هم قرمز بشه، این خط رو هم از کامنت دربیار:
                setErrors((prev) => ({ ...prev, imei: data.message || "IMEI تکراری است" }))

                return // 👈 این return خیلی مهمه! باعث میشه کد ادامه پیدا نکنه و پیام موفقیت نده
            }

            alert(data.message || "با موفقیت ثبت شد!")
            setForm(initialForm)
            setEditingId(null)
            fetchDevices()
        } catch (err) {
            console.error(err)
            alert("خطا در ارتباط با سرور")
        }
    }

    const handleDelete = async (id: number | string) => {
        if (!window.confirm("رفیق، مطمئنی میخوای این دستگاه رو حذف کنی؟")) return;

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`/api/devices/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.ok) {
                alert("دستگاه با موفقیت حذف شد.");
                fetchDevices();

                if (editingId === id) {
                    setForm(initialForm);
                    setEditingId(null);
                }
            } else {
                alert("خطا در حذف دستگاه");
            }
        } catch (error) {
            console.error("خطا:", error);
            alert("مشکلی در ارتباط با سرور پیش اومد.");
        }
    }

    const handleEditClick = (device: Device) => {
        setEditingId(device.id);

        let parsedAlarm: any = {};
        if (device.alarm) {
            if (typeof device.alarm === 'string') {
                try {
                    parsedAlarm = JSON.parse(device.alarm);
                } catch (e) {
                    console.error("خطا در پارس کردن جیسون آلارم", e);
                }
            } else {
                parsedAlarm = device.alarm;
            }
        }

        // یه تابع کمکی مینویسیم که اگه null یا undefined بود، رشته خالی برگردونه
        const safeString = (val: any) => (val !== null && val !== undefined ? String(val) : "");

        const l2lUpper = parsedAlarm?.line_to_line_upper;
        const l2lLower = parsedAlarm?.line_to_line_lower;
        const l2nUpper = parsedAlarm?.line_to_null_upper ?? parsedAlarm?.line_to_phase_upper;
        const l2nLower = parsedAlarm?.line_to_null_lower ?? parsedAlarm?.line_to_phase_lower;

        // اگه حداقل یکیشون مقدار معتبر داشته باشه، چک‌باکس فعال میشه
        const hasLineToLine = (l2lUpper !== null && l2lUpper !== undefined) || (l2lLower !== null && l2lLower !== undefined);
        const hasLineToNull = (l2nUpper !== null && l2nUpper !== undefined) || (l2nLower !== null && l2nLower !== undefined);

        setForm({
            deviceName: device.device_name || "",
            ownerName: device.owner_name || "بدون مالک مشخص",
            imei: device.imei || "",
            startTime: device.start_time || "",
            endTime: device.end_time || "",
            phone: device.phone || "",
            address: device.address || "",
            longitude: device.longitude || "",
            latitude: device.latitude || "",
            distanceFromTrans: device.distance_from_trans || "",
            cableSize: device.cable_size || "",
            threePhase: device.three_phase || false,
            materials: device.materials || "",
            description: device.description || "",
            isActive: device.is_active || false,
            fuseBox: device.fuse_box || false,
            nullConnection: device.null_connection || false,
            fuseComb: device.fuse_comb || false,
            lineBalance: device.line_balance || false,
            unitEarth: device.unit_earth || false,
            upsBattery: device.ups_battery || false,

            // استفاده از تابع کمکی برای جلوگیری از چاپ شدن کلمه "null"
            lineToLineUpper: safeString(l2lUpper),
            lineToLineLower: safeString(l2lLower),
            lineToPhaseUpper: safeString(l2nUpper),
            lineToPhaseLower: safeString(l2nLower),
            enableLineToLine: hasLineToLine,
            enableLineToNull: hasLineToNull,
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleCancelEdit = () => {
        setForm(initialForm);
        setEditingId(null);
        setErrors({});
    }

    const userRole = useMemo(() => {
        const token = localStorage.getItem("token");
        if (!token) return UserRole.USER;
        try {
            const decoded: any = jwtDecode(token);
            return decoded.role ?? UserRole.USER;
        } catch {
            return UserRole.USER;
        }
    }, []);

    // فقط ادمین اجازه ویرایش/حذف داره
    const canEdit = userRole === UserRole.ADMIN;
    const canDelete = userRole === UserRole.ADMIN;

    // گروه‌بندی دستگاه‌ها بر اساس نام مالک
    const groupedDevices = useMemo(() => {
        return devices.reduce((acc, device) => {
            // اگه نام مالک خالی بود، یه اسم پیش‌فرض می‌ذاریم
            const owner = device.owner_name || "بدون مالک مشخص";

            if (!acc[owner]) {
                acc[owner] = [];
            }
            acc[owner].push(device);

            return acc;
        }, {} as Record<string, Device[]>);
    }, [devices]);

    return (
        <div dir="rtl" className="space-y-12">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* مشخصات مشتری */}
                    <section className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-bold text-gray-800 mb-4">مشخصات مشتری</h3>
                        <Field label="نام دستگاه" fieldKey="deviceName" error={errors.deviceName} value={form.deviceName} onChange={handleChange} required />
                        <Field label="نام مالک" fieldKey="ownerName" error={errors.ownerName} value={form.ownerName} onChange={handleChange} required />
                        <Field label="IMEI" fieldKey="imei" error={errors.imei} value={form.imei} onChange={handleChange} required />
                        <JalaliDatePicker label="زمان شروع" value={form.startTime} onChange={(val) => handleChange("startTime", val)} error={errors.startTime} />
                        <JalaliDatePicker label="زمان پایان" value={form.endTime} onChange={(val) => handleChange("endTime", val)} error={errors.endTime} />
                        <Field label="تلفن" fieldKey="phone" error={errors.phone} value={form.phone} onChange={handleChange} />
                        <Field label="آدرس" fieldKey="address" error={errors.address} value={form.address} onChange={handleChange} />
                        <Field label="طول جغرافیایی" fieldKey="longitude" error={errors.longitude} value={form.longitude} onChange={handleChange} />
                        <Field label="عرض جغرافیایی" fieldKey="latitude" error={errors.latitude} value={form.latitude} onChange={handleChange} />
                    </section>

                    {/* مشخصات اتصالات */}
                    <section className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-bold text-gray-800 mb-4">مشخصات اتصالات</h3>
                        <div className="space-y-3">
                            {connectionFields.map((item) => (
                                <label key={item.key} className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-gray-600">{item.label}:</span>
                                    <input type="checkbox" checked={form[item.key] as boolean} onChange={(e) => handleChange(item.key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* توضیحات */}
                    <section className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-bold text-gray-800 mb-4">توضیحات</h3>
                        <div className="flex gap-3 mb-3">
                            <label className="w-24 shrink-0 text-sm text-gray-600 text-left pt-2">توضیحات</label>
                            <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                        </div>
                        <label className="flex items-center justify-end gap-2 mb-3 cursor-pointer">
                            <span className="text-sm text-gray-600">فعال؟</span>
                            <input type="checkbox" checked={form.isActive} onChange={(e) => handleChange("isActive", e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="w-24 shrink-0 text-sm text-gray-600 text-left">یادداشت صوتی</label>
                            <button type="button" className="flex-1 bg-orange-400 hover:bg-orange-500 text-white py-2 rounded-md text-sm transition">🎙️ ضبط صدا</button>
                        </div>
                    </section>

                    {/* تجهیزات */}
                    <section className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-base font-bold text-gray-800 mb-4">تجهیزات</h3>

                        <Field label="فاصله از ترانس" fieldKey="distanceFromTrans" error={errors.distanceFromTrans} value={form.distanceFromTrans} onChange={handleChange} />
                        <Field label="سایز کابل" fieldKey="cableSize" error={errors.cableSize} value={form.cableSize} onChange={handleChange} />

                        {/* ولتاژ فاز به فاز به همراه چک باکس */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-32 shrink-0 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.enableLineToLine}
                                    onChange={(e) => {
                                        handleChange("enableLineToLine", e.target.checked);
                                        // اگه تیک برداشته شد مقادیر رو خالی میکنیم
                                        if (!e.target.checked) {
                                            handleChange("lineToLineLower", "");
                                            handleChange("lineToLineUpper", "");
                                        }
                                    }}
                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                />
                                <label className="text-sm text-gray-600 text-left">ولتاژ فاز به فاز</label>
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="number"
                                    placeholder="حد پایین"
                                    value={form.lineToLineLower}
                                    disabled={!form.enableLineToLine}
                                    onChange={(e) => handleChange("lineToLineLower", e.target.value)}
                                    className={`w-1/2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${!form.enableLineToLine ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                                <input
                                    type="number"
                                    placeholder="حد بالا"
                                    value={form.lineToLineUpper}
                                    disabled={!form.enableLineToLine}
                                    onChange={(e) => handleChange("lineToLineUpper", e.target.value)}
                                    className={`w-1/2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${!form.enableLineToLine ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>

                        {/* ولتاژ فاز به نول به همراه چک باکس */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-32 shrink-0 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.enableLineToNull}
                                    onChange={(e) => {
                                        handleChange("enableLineToNull", e.target.checked);
                                        // اگه تیک برداشته شد مقادیر رو خالی میکنیم
                                        if (!e.target.checked) {
                                            handleChange("lineToPhaseLower", "");
                                            handleChange("lineToPhaseUpper", "");
                                        }
                                    }}
                                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                                />
                                <label className="text-sm text-gray-600 text-left">ولتاژ فاز به نول</label>
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="number"
                                    placeholder="حد پایین"
                                    value={form.lineToPhaseLower}
                                    disabled={!form.enableLineToNull}
                                    onChange={(e) => handleChange("lineToPhaseLower", e.target.value)}
                                    className={`w-1/2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${!form.enableLineToNull ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                                <input
                                    type="number"
                                    placeholder="حد بالا"
                                    value={form.lineToPhaseUpper}
                                    disabled={!form.enableLineToNull}
                                    onChange={(e) => handleChange("lineToPhaseUpper", e.target.value)}
                                    className={`w-1/2 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${!form.enableLineToNull ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>

                        <label className="flex items-center justify-end gap-2 mb-3 cursor-pointer">
                            <span className="text-sm text-gray-600">سه فاز</span>
                            <input type="checkbox" checked={form.threePhase} onChange={(e) => handleChange("threePhase", e.target.checked)} className="w-4 h-4 accent-blue-600" />
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="w-32 shrink-0 text-sm text-gray-600 text-left">متریال‌ها</label>
                            <select value={form.materials} onChange={(e) => handleChange("materials", e.target.value)} className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                <option value="">انتخاب...</option>
                                <option value="copper">مس</option>
                                <option value="aluminum">آلومینیوم</option>
                            </select>
                        </div>
                    </section>
                </div>

                <div className="flex justify-start gap-3">
                    <button type="submit" className={`${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-2 rounded-md transition`}>
                        {editingId ? "بروزرسانی دستگاه" : "ذخیره دستگاه"}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-md transition">
                            انصراف
                        </button>
                    )}
                </div>
            </form>

            {/* بخش جدول لیست دستگاه‌ها */}
            <section className="bg-white rounded-lg border border-gray-200 p-5 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-800 mb-4">لیست دستگاه‌های ثبت شده</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-700 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 border-b">نام دستگاه</th>
                            <th scope="col" className="px-6 py-3 border-b">نام مالک</th>
                            <th scope="col" className="px-6 py-3 border-b">IMEI</th>
                            <th scope="col" className="px-6 py-3 border-b">زمان شروع</th>
                            <th scope="col" className="px-6 py-3 border-b">زمان پایان</th>
                            <th scope="col" className="px-6 py-3 border-b">تلفن</th>
                            <th scope="col" className="px-6 py-3 border-b">وضعیت</th>
                            {canEdit && <th className="px-6 py-3 border-b text-center">عملیات</th>}
                        </tr>
                        </thead>
                        <tbody>
                            {Object.keys(groupedDevices).length > 0 ? (
                                Object.entries(groupedDevices).map(([owner, ownerDevices]) => (
                                    <React.Fragment key={owner}>
                                        {/* سطر جداکننده برای هر مالک */}
                                        <tr className="bg-blue-100 border-b-2 border-blue-200">
                                            <td colSpan={canEdit ? 8 : 7} className="px-6 py-3 font-bold text-blue-900 text-center">
                                                👤 مالک: {owner} (تعداد دستگاه: {ownerDevices.length})
                                            </td>
                                        </tr>

                                        {/* دستگاه‌های مربوط به این مالک */}
                                        {ownerDevices.map((device) => (
                                            <tr key={device.id} className={`border-b transition ${editingId === device.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}>
                                                <td className="px-6 py-4">{device.device_name}</td>
                                                <td className="px-6 py-4">{device.owner_name}</td>
                                                <td className="px-6 py-4 font-mono">{device.imei}</td>
                                                <td className="px-6 py-4" dir="ltr">{FormatToJalali(device.start_time)}</td>
                                                <td className="px-6 py-4" dir="ltr">{FormatToJalali(device.end_time)}</td>
                                                <td className="px-6 py-4" dir="ltr">{device.phone}</td>
                                                <td className="px-6 py-4">
                                                    {device.is_active ? (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">فعال</span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">غیرفعال</span>
                                                    )}
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(device)}
                                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs transition"
                                                        >
                                                            ویرایش
                                                        </button>
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDelete(device.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition"
                                                            >
                                                                حذف
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={canEdit ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                                        هیچ دستگاهی یافت نشد!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
