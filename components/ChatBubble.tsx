
import React from 'react';
import { ChatMessage } from '../types';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const AiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


const ChatBubble: React.FC<ChatMessage> = ({ sender, text, sources, imageUrl, userImageUrl }) => {
    const isUser = sender === 'user';

    const bubbleClasses = isUser
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white';
    
    const containerClasses = isUser 
        ? 'flex-row-reverse' 
        : 'flex-row';

    const textToShow = text === '...' 
        ? <span className="inline-block content-[''] before:content-['.'] after:content-['.'] loading-dots"></span>
        : text;

    return (
        <div className={`flex items-start gap-4 w-full max-w-2xl mx-auto ${containerClasses}`}>
            <div className="flex-shrink-0">{isUser ? <UserIcon /> : <AiIcon />}</div>
            <div className={`rounded-xl p-4 transition-colors duration-300 w-full ${bubbleClasses}`}>
                 {(imageUrl || userImageUrl) && (
                    <div className="mb-3">
                        <img 
                            src={imageUrl || userImageUrl} 
                            alt="Chat attachment" 
                            className="rounded-lg max-w-full h-auto max-h-[300px] object-contain bg-black/5 dark:bg-white/5" 
                        />
                    </div>
                )}
                <p className="text-base whitespace-pre-wrap">{textToShow}</p>
                {sources && sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600/50">
                        <h4 className="text-xs font-bold tracking-wider text-gray-600 dark:text-gray-400 mb-2">SOURCES</h4>
                        <ul className="space-y-1.5">
                            {sources.map((source, index) => (
                                <li key={index} className="text-sm truncate">
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-2"
                                        title={source.title}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        <span className="truncate">{source.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;
