export const FormatWorkClock = (hoursStr?: string) => {
    if (!hoursStr) return '-';

    // چون تو Go استرینگ تعریف کردیم، اول تبدیلش می‌کنیم به عدد
    const totalHours = parseInt(hoursStr, 10);
    if (isNaN(totalHours)) return `${hoursStr} ساعت`;

    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    if (days > 0) {
        return `${days} روز و ${remainingHours} ساعت`;
    }
    return `${remainingHours} ساعت`;
};

export const FormatToJalali = (isoDateString?: string | null) => {
    if (!isoDateString) return '-';

    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
};

export const FormatSignalQuality = (signalStr?: string) => {
    if (!signalStr) return '-';

    const signalValue = parseInt(signalStr, 10);
    // اگه به هر دلیلی عدد نبود (مثلا همون "-nan") خودشو برگردون
    if (isNaN(signalValue)) return signalStr;

    // تبدیل به درصد و رند کردنش که اعشاری زشت نشه
    const percentage = Math.round((signalValue / 31) * 100);

    // اگه خواستی میتونی محدودش کنی که از 100 نزنه بالا (محض احتیاط)
    const finalPercentage = percentage > 100 ? 100 : percentage;

    return `%${finalPercentage}`; // تو فارسی علامت درصد سمت راست عدد میاد
};
