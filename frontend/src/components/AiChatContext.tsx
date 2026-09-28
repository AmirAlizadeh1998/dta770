import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AiMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

interface AiChatContextType {
    messages: AiMessage[];
    isStreaming: boolean;
    clearHistory: () => void;
    analyzeFile: (file: File) => Promise<void>;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export function AiChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<AiMessage[]>(() => {
        const saved = localStorage.getItem("ai_analyzer_chat_history");
        return saved ? JSON.parse(saved) : [];
    });
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        localStorage.setItem("ai_analyzer_chat_history", JSON.stringify(messages));
    }, [messages]);

    const clearHistory = () => {
        if (window.confirm("مطمئنی می‌خوای تاریخچه رو پاک کنی؟")) {
            setMessages([]);
            localStorage.removeItem("ai_analyzer_chat_history");
        }
    };

    const analyzeFile = async (file: File) => {
        if (isStreaming) return;
        setIsStreaming(true);

        const userMsgId = Date.now().toString();
        const aiMsgId = (Date.now() + 1).toString();

        setMessages(prev => [
            ...prev,
            { id: userMsgId, role: 'user', text: `فایل ارسالی: ${file.name}` },
            { id: aiMsgId, role: 'ai', text: '' }
        ]);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("token");

            const res = await fetch("/api/ai/file-search", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData
            });

            if (!res.ok || !res.body) throw new Error(`خطای سرور: ${res.status}`);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let buffer = ""; // نگه داشتن خطوطی که هنوز کامل دریافت نشدن

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');

                    // خط آخر ممکنه نصفه باشه، پس برش می‌گردونیم تو بافر برای دفعه بعد
                    buffer = lines.pop() || "";

                    let chunkText = "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;

                        if (trimmed.includes("[DONE]")) {
                            done = true;
                            break;
                        }

                        if (trimmed.includes("[ERROR:")) {
                            console.error("خطای سرور استریم:", trimmed);
                            chunkText += "\n[خطای پردازش در سرور]";
                            done = true;
                            break;
                        }

                        // استخراج دیتای واقعی بعد از "data:"
                        if (trimmed.startsWith("data:")) {
                            let text = trimmed.replace(/^data:\s*/, "");
                            // تبدیل کاراکترهای اسکیپ شده به فرمت اصلی (مثل نیولاین‌ها)
                            text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                            chunkText += text;
                        }
                    }

                    // اگه متنی اضافه شده، آپدیتش کن
                    if (chunkText) {
                        setMessages(prev => prev.map(msg =>
                            msg.id === aiMsgId ? { ...msg, text: msg.text + chunkText } : msg
                        ));
                    }
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, text: msg.text + "\n[خطا در دریافت پاسخ]" } : msg
            ));
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <AiChatContext.Provider value={{ messages, isStreaming, clearHistory, analyzeFile }}>
            {children}
        </AiChatContext.Provider>
    );
}

export const useAiChat = () => {
    const context = useContext(AiChatContext);
    if (!context) throw new Error("useAiChat must be used within AiChatProvider");
    return context;
};
