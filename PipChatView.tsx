
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import ChatBubble from './ChatBubble';
import Logo from './Logo';
import VoiceWave from './VoiceWave';

type Status = 'idle' | 'listening' | 'processing';
type Theme = 'light' | 'dark';

interface PipChatViewProps {
    messages: ChatMessage[];
    status: Status;
    theme: Theme;
}

const PipChatView: React.FC<PipChatViewProps> = ({ messages, status, theme }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    let statusElement: React.ReactNode;
    switch (status) {
        case 'listening':
            statusElement = <VoiceWave />;
            break;
        case 'processing':
            statusElement = <p className="text-sm font-medium">Thinking...</p>;
            break;
        default:
            statusElement = <p className="text-sm">Say "Hey Aurix"</p>;
            break;
    }

    return (
        <div className={`h-full flex flex-col font-sans text-gray-900 dark:text-white bg-white dark:bg-black ${theme}`}>
             <header className="flex-shrink-0 flex items-center justify-between gap-2 p-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <Logo className="w-6 h-6" />
                    <span className="font-bold">Aurix</span>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    Floating Mode
                </div>
            </header>
            <main ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-6">
                 {messages.map((msg) => <ChatBubble key={msg.id} {...msg} />)}
                 {status === 'processing' && messages.length > 0 && messages[messages.length - 1]?.sender === 'user' && (
                    <ChatBubble id='pip-proc' sender='ai' text='...' />
                )}
            </main>
            <footer className="flex-shrink-0 h-16 flex items-center justify-center border-t border-gray-200 dark:border-gray-800">
                {statusElement}
            </footer>
        </div>
    );
};

export default PipChatView;