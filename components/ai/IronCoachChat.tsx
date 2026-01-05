
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { getTranslated } from '../../utils';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    isThinking?: boolean;
}

const QUICK_PROMPTS = [
    { label: "Analyze Progress", prompt: "Analyze my last 3 workouts. Am I progressing in volume or load?" },
    { label: "Check Fatigue", prompt: "Based on my recent logs, do I need a deload?" },
    { label: "Motivation", prompt: "Give me a short, scientific motivation quote for hypertrophy." },
];

export const IronCoachChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { activeMeso, logs, lang, config } = useApp();
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', role: 'model', text: lang === 'en' ? "I am IronCoach. Analyze your data, ask about exercises, or get programming advice." : "Soy IronCoach. Analizo tus datos, pregunto sobre ejercicios o te doy consejos de programación." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const buildContext = () => {
        // Safe data gathering
        const safeLogs = Array.isArray(logs) ? logs : [];
        const recentLogs = safeLogs.slice(0, 5).map(l => ({
            date: new Date(l.endTime).toDateString(),
            name: l.name,
            duration: Math.round(l.duration / 60) + 'min',
            volume: l.exercises?.reduce((acc, ex) => acc + (ex.sets?.filter(s => s.completed).length || 0), 0)
        }));

        const context = `
            CURRENT STATE:
            - Active Mesocycle: ${activeMeso ? `${activeMeso.name} (Week ${activeMeso.week}, Type: ${activeMeso.mesoType})` : "None"}
            - Focus: Hypertrophy / Bodybuilding
            
            RECENT HISTORY (Last 5 sessions):
            ${JSON.stringify(recentLogs)}
            
            USER SETTINGS:
            - RIR Tracking: ${config.showRIR ? 'Enabled' : 'Disabled'}
            - Language: ${lang}
        `;
        return context;
    };

    const handleSend = async (textOverride?: string) => {
        const text = textOverride || input;
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const contextData = buildContext();
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemInstruction = `
                You are IronCoach, an elite hypertrophy coach AI integrated into the IronLog Pro app.
                Your tone is analytical, scientific, yet encouraging (Mike Israetel style).
                
                CONTEXT DATA:
                ${contextData}

                RULES:
                1. Keep answers concise (under 100 words unless asked for detail).
                2. Use Markdown-style bolding (**text**) for emphasis.
                3. Focus on Progressive Overload, RIR (Reps In Reserve), and Volume Management.
                4. Respond in the user's language (${lang === 'es' ? 'Spanish' : 'English'}).
            `;

            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text }] }
                ],
                config: {
                    systemInstruction,
                    temperature: 0.7,
                }
            });

            const reply = response.text;
            if (reply) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: reply }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection error. Check your API Key or internet." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Custom simple formatter to replace ReactMarkdown and avoid "Double React" issues
    const formatMessage = (text: string) => {
        // Split by newlines for paragraphs
        return text.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2"></div>;
            
            // Split by **bold** markers
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-1">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="text-indigo-600 dark:text-indigo-400 font-bold">{part.slice(2, -2)}</strong>;
                        }
                        // Handle bullet points manually for cleaner look
                        if (part.trim().startsWith('- ')) {
                            return <span key={j} className="pl-2 block border-l-2 border-indigo-200 dark:border-indigo-800 ml-1">{part.replace('- ', '')}</span>;
                        }
                        return <span key={j}>{part}</span>;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={onClose}>
            <div 
                className="bg-white dark:bg-zinc-900 w-full sm:max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-slideUp" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Icon name="Zap" size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="font-black text-zinc-900 dark:text-white leading-none">IronCoach AI</h3>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Powered by Gemini</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                        <Icon name="X" size={24} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-black/20 scroll-container">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black rounded-tr-sm' 
                                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-white/5 rounded-tl-sm'
                            }`}>
                                {formatMessage(msg.text)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-sm border border-zinc-100 dark:border-white/5 flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length < 3 && (
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto scroll-container">
                        {QUICK_PROMPTS.map((qp, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(qp.prompt)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                            >
                                {qp.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                            placeholder={lang === 'en' ? "Ask IronCoach..." : "Pregunta a IronCoach..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-1.5 bg-indigo-600 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
                        >
                            <Icon name="CornerDownRight" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
