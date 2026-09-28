import { useState } from 'react';
import { useAiChat, type AiMessage } from '../../components/AiChatContext';

// یه کامپوننت کوچیک برای دکمه کپی تا بتونیم وضعیت "کپی شد" رو برای هر پیام جداگانه مدیریت کنیم
const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // بعد از ۲ ثانیه برگرده به حالت اول
        } catch (err) {
            console.error('خطا در کپی کردن متن:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors self-end"
        >
            {copied ? '✓ کپی شد' : 'کپی متن'}
        </button>
    );
};

export default function AiFileAnalyzePage() {
    const { messages, isStreaming, analyzeFile, clearHistory } = useAiChat();
    const [file, setFile] = useState<File | null>(null);

    const handleSend = () => {
        if (file) analyzeFile(file);
    };

    return (
        <div className="flex flex-col h-full p-4">
            {/* دکمه پاک کردن */}
            <button
                onClick={clearHistory}
                className="mb-4 self-start bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition-colors"
            >
                پاک کردن تاریخچه
            </button>

            {/* نمایش پیام‌ها */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-inner flex flex-col">
                {messages.map((msg: AiMessage) => (
                    <div
                        key={msg.id}
                        className={`p-3 mb-3 rounded-lg w-fit max-w-[80%] flex flex-col ${
                            msg.role === 'ai'
                                ? 'bg-blue-50 border border-blue-100 self-start'
                                : 'bg-gray-100 border border-gray-200 self-end ml-auto'
                        }`}
                    >
                        {/* استفاده از pre-wrap برای حفظ فاصله‌ها و اینترها در جواب AI */}
                        <pre className="whitespace-pre-wrap font-sans text-gray-800">
                            {msg.text}
                        </pre>

                        {/* نمایش دکمه کپی فقط برای پیام‌های هوش مصنوعی */}
                        {msg.role === 'ai' && msg.text && (
                            <CopyButton text={msg.text} />
                        )}
                    </div>
                ))}
                {isStreaming && (
                    <div className="text-gray-500 text-sm animate-pulse self-start">
                        درحال دریافت پاسخ...
                    </div>
                )}
            </div>

            {/* انتخاب فایل و دکمه ارسال */}
            <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <input
                    type="file"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                    onClick={handleSend}
                    disabled={!file || isStreaming}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                    ارسال فایل
                </button>
            </div>
        </div>
    );
}