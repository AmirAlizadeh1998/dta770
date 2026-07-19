import { useState, useRef, useEffect } from 'react';

// تعریف ساختار پیام‌ها
interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

function AiChatPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const analyzeFile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedFile) return;

        // پیام فرضی کاربر فقط برای نمایش در UI
        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            text: `لطفاً فایل ${selectedFile.name} را تحلیل کن 📊`
        };

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        // یک پیام در حال انتظار برای AI می‌سازیم
        const aiMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: 'در حال خواندن و تحلیل فایل... (این مرحله ممکن است زمان‌بر باشد) ⏳' }]);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const res = await fetch('/api/ai/file-search', {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'خطا در سرور');
            }

            // چون بک‌اند منتظر میمونه و در نهایت JSON میده، ما هم همون رو یکجا میخونیم
            const data = await res.json();

            // آپدیت کردن پیام دستیار با جواب نهایی
            setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                    ? { ...msg, text: data.message }
                    : msg
            ));

        } catch (error: any) {
            console.error('خطا:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                    ? { ...msg, text: `خطا در ارتباط با سرور دایی! 🤦‍♂️ \n جزئیات: ${error.message}` }
                    : msg
            ));
        } finally {
            setLoading(false);
            setSelectedFile(null); // خالی کردن فایل بعد از اتمام
        }
    };

    const handleCopy = (id: number, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }).catch(err => console.error("خطا در کپی کردن متن: ", err));
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column' as const, height: '80vh', maxWidth: '700px', margin: '0 auto', fontFamily: 'Tahoma, sans-serif', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f5f7f9', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
        header: { backgroundColor: '#ffffff', padding: '15px 20px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' as const, fontSize: '18px', fontWeight: 'bold', color: '#333' },
        chatArea: { flex: 1, padding: '20px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '15px' },
        messageRow: (isUser: boolean) => ({ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }),
        bubble: (isUser: boolean) => ({
            position: 'relative' as const,
            maxWidth: '85%',
            padding: '12px 16px',
            paddingBottom: isUser ? '12px' : '38px',
            borderRadius: '15px',
            lineHeight: '1.6',
            fontSize: '14px',
            whiteSpace: 'pre-wrap' as const,
            backgroundColor: isUser ? '#007bff' : '#ffffff',
            color: isUser ? '#ffffff' : '#333333',
            border: isUser ? 'none' : '1px solid #e0e0e0',
            borderBottomRightRadius: isUser ? '4px' : '15px',
            borderBottomLeftRadius: !isUser ? '4px' : '15px',
            direction: 'rtl' as const,
            textAlign: 'right' as const
        }),
        inputArea: { display: 'flex', justifyContent: 'center', padding: '15px', backgroundColor: '#ffffff', borderTop: '1px solid #e0e0e0', gap: '15px' },
        button: (isDisabled: boolean) => ({
            backgroundColor: isDisabled ? '#99c2ff' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '0 25px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.3s',
            height: '42px',
            fontSize: '15px'
        }),
        copyBtn: { position: 'absolute' as const, left: '10px', bottom: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px', color: '#666', transition: 'transform 0.2s' },
        fileInput: { display: 'none' },
        fileButton: {
            backgroundColor: '#f1f1f1',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '25px',
            padding: '0 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '15px',
            whiteSpace: 'nowrap' as const,
            display: 'inline-flex',
            alignItems: 'center',
            height: '40px',
            fontWeight: 'bold'
        },
        fileInfo: {
            fontSize: '14px',
            color: '#555',
            direction: 'rtl' as const,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '250px',
            alignSelf: 'center'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                دستیار هوشمند تحلیل فایل برق ⚡🤖
            </div>

            <div style={styles.chatArea}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '50px', direction: 'rtl', lineHeight: '2' }}>
                        فایل دیتای پاور آنالایزر را انتخاب کنید و روی شروع کلیک کنید.<br/>
                        سیستم به صورت خودکار تحلیل کامل را انجام خواهد داد.
                    </div>
                )}

                {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div key={msg.id} style={styles.messageRow(isUser)}>
                            <div style={styles.bubble(isUser)}>
                                {msg.text}

                                {!isUser && !loading && (
                                    <button
                                        onClick={() => handleCopy(msg.id, msg.text)}
                                        style={styles.copyBtn}
                                        title="کپی کردن"
                                    >
                                        {copiedId === msg.id ? '✅' : '📋'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={analyzeFile} style={styles.inputArea}>
                <label style={styles.fileButton}>
                    📎 انتخاب فایل
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt"
                        style={styles.fileInput}
                        disabled={loading}
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedFile(file);
                        }}
                    />
                </label>

                {selectedFile && (
                    <span style={styles.fileInfo} title={selectedFile.name}>
                        📁 {selectedFile.name}
                    </span>
                )}

                <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    style={styles.button(loading || !selectedFile)}
                >
                    شروع تحلیل 🚀
                </button>
            </form>
        </div>
    );
}

export default AiChatPage;