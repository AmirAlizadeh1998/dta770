import { useState, useRef, useEffect } from 'react';
import { apiFetch } from "../../api/ApiClient.ts";

// تعریف ساختار پیام‌ها
interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

function AiChatPage() {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    // برای اسکرول خودکار به آخرین پیام
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const askOpenAI = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!prompt.trim()) return;

        // اضافه کردن پیام کاربر به لیست
        const userMsg: Message = { id: Date.now(), sender: 'user', text: prompt };
        setMessages(prev => [...prev, userMsg]);
        setPrompt('');
        setLoading(true);

        try {
            const res = await apiFetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ prompt: userMsg.text }),
            });

            const data = await res.json();

            // اضافه کردن جواب هوش مصنوعی به لیست
            const aiMsg: Message = { id: Date.now() + 1, sender: 'ai', text: data.reply };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('خطا:', error);
            const errorMsg: Message = { id: Date.now() + 1, sender: 'ai', text: 'ارتباط با سرور قطع شد دایی! 🤦‍♂️' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    // استایل‌های درون‌خطی (اگه از Tailwind یا CSS Modules استفاده می‌کنی میتونی اینا رو تبدیل کنی)
    const styles = {
        container: { display: 'flex', flexDirection: 'column' as const, height: '80vh', maxWidth: '600px', margin: '0 auto', fontFamily: 'Tahoma, sans-serif', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f5f7f9', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
        header: { backgroundColor: '#ffffff', padding: '15px 20px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' as const, fontSize: '18px', fontWeight: 'bold', color: '#333' },
        chatArea: { flex: 1, padding: '20px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: '15px' },
        messageRow: (isUser: boolean) => ({ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }), // فلکس برعکس برای راست‌چین بودن فارسی
        bubble: (isUser: boolean) => ({ maxWidth: '75%', padding: '12px 16px', borderRadius: '15px', lineHeight: '1.5', fontSize: '14px', whiteSpace: 'pre-wrap' as const, backgroundColor: isUser ? '#007bff' : '#ffffff', color: isUser ? '#ffffff' : '#333333', border: isUser ? 'none' : '1px solid #e0e0e0', borderBottomRightRadius: isUser ? '4px' : '15px', borderBottomLeftRadius: !isUser ? '4px' : '15px', direction: 'rtl' as const }),
        inputArea: { display: 'flex', padding: '15px', backgroundColor: '#ffffff', borderTop: '1px solid #e0e0e0', gap: '10px' },
        input: { flex: 1, padding: '12px 15px', borderRadius: '25px', border: '1px solid #cccccc', outline: 'none', fontSize: '14px', direction: 'rtl' as const, fontFamily: 'inherit' },
        button: { backgroundColor: loading ? '#99c2ff' : '#007bff', color: 'white', border: 'none', borderRadius: '25px', padding: '0 20px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background 0.3s' },
        typing: { fontSize: '13px', color: '#888', alignSelf: 'flex-end', direction: 'rtl' as const }
    };

    return (
        <div style={styles.container}>
            {/* هدر */}
            <div style={styles.header}>
                دستیار هوشمند کلینیک 🤖
            </div>

            {/* بخش پیام‌ها */}
            <div style={styles.chatArea}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                        سوالی داری بپرس تا کمکت کنم...
                    </div>
                )}

                {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div key={msg.id} style={styles.messageRow(isUser)}>
                            <div style={styles.bubble(isUser)}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div style={styles.typing}>دستیار داره تایپ می‌کنه... ✍️</div>
                )}

                {/* یک دیو خالی برای اسکرول خودکار */}
                <div ref={messagesEndRef} />
            </div>

            {/* بخش ورود متن */}
            <form onSubmit={askOpenAI} style={styles.inputArea}>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    style={styles.input}
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !prompt.trim()} style={styles.button}>
                    ارسال
                </button>
            </form>
        </div>
    );
}

export default AiChatPage;