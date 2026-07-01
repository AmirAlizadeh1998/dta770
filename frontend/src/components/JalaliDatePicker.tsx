// components/JalaliDatePicker.tsx
import { useState, useRef, useEffect } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import TimePicker from "react-multi-date-picker/plugins/time_picker";

const DatePickerComponent = (DatePicker as any).default || DatePicker;
const TimePickerPlugin = (TimePicker as any).default || TimePicker;

type Props = {
    label: string
    value: string
    onChange: (val: string) => void
    error?: string
    required?: boolean
}

export default function JalaliDatePicker({ label, value, onChange, error, required }: Props) {
    const datePickerRef = useRef<any>(null);
    const [tempDate, setTempDate] = useState<DateObject | Date | null>(value ? new Date(value) : null);

    useEffect(() => {
        setTempDate(value ? new Date(value) : null);
    }, [value]);

    const handleConfirm = () => {
        if (tempDate) {
            const dateToSave = tempDate instanceof DateObject ? tempDate.toDate() : tempDate;
            onChange((dateToSave as Date).toISOString());
        } else {
            onChange("");
        }
        datePickerRef.current?.closeCalendar();
    };

    const handleClear = () => {
        setTempDate(null);
        onChange("");
        datePickerRef.current?.closeCalendar();
    };

    return (
        <div className="flex items-center gap-3 mb-3">
            <label className="w-32 shrink-0 text-sm text-gray-600 text-left">
                {label}{required && <span className="text-red-500"> *</span>}
            </label>
            <div className="flex-1">
                <DatePickerComponent
                    ref={datePickerRef}
                    calendar={persian}
                    locale={persian_fa}

                    // ✨ جادوی واقعی اینجاست ✨
                    multiple // تقویم رو چندتایی می‌کنیم تا بسته نشه
                    value={tempDate ? [tempDate] : []} // مقدار رو به صورت آرایه میدیم
                    onChange={(dates: DateObject[]) => {
                        if (dates && dates.length > 0) {
                            const selected = dates[dates.length - 1];
                            setTempDate(selected);
                            // همون لحظه به کامپوننت پدر هم خبر می‌دیم!
                            onChange(selected.toDate().toISOString());
                        } else {
                            setTempDate(null);
                            onChange("");
                        }
                    }}

                    format="YYYY/MM/DD HH:mm:ss"
                    plugins={[
                        <TimePickerPlugin position="bottom" />
                    ]}
                    placeholder="انتخاب تاریخ..."
                    inputClass={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        error ? "border-red-400" : "border-gray-300"
                    }`}
                >
                    <div className="flex justify-end p-3 border-t border-gray-200 mt-2 bg-gray-50 gap-2">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-1.5 rounded-md text-sm transition-colors"
                        >
                            پاک کردن
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-1.5 rounded-md text-sm transition-colors shadow-sm"
                        >
                            تایید
                        </button>
                    </div>
                </DatePickerComponent>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        </div>
    )
}