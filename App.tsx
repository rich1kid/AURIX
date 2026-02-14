
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, GroundingSource } from './types';
import { 
    getAiChatResponse, 
    generateTextToSpeech, 
    generateImage,
    editImage
} from './services/geminiService';
import { playAudio } from './utils/audioUtils';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import ChatBubble from './components/ChatBubble';
import MicrophoneIcon from './components/MicrophoneIcon';
import VoiceWave from './components/VoiceWave';
import SendIcon from './components/SendIcon';
import AttachmentIcon from './components/AttachmentIcon';
import Header from './components/Header';
import Modal from './components/Modal';
import Logo from './components/Logo';

type AppState = 'splash' | 'welcome' | 'chat';
type Status = 'idle' | 'listening' | 'processing';
type Theme = 'light' | 'dark';

const DEFAULT_WAKE_WORD = 'hey aurix';

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const storedHistory = localStorage.getItem('chatHistory');
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (e) { return []; }
    });

    const [appState, setAppState] = useState<AppState>('splash');
    const [status, setStatus] = useState<Status>('idle');
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('aurix-theme') as Theme | null;
        if (savedTheme) return savedTheme;
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    const [wakeWord, setWakeWord] = useState<string>(() => {
        return localStorage.getItem('aurix-wake-word') || DEFAULT_WAKE_WORD;
    });

    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('aurix-voice-enabled');
        return saved === null ? true : saved === 'true';
    });

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(console.error);
        }
        return audioContextRef.current;
    }, []);

    const stopSpeaking = useCallback(() => {
        if (activeAudioSourceRef.current) {
            try {
                activeAudioSourceRef.current.stop();
            } catch (e) {}
            activeAudioSourceRef.current = null;
        }
        setIsSpeaking(false);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('aurix-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (appState === 'splash') {
            const timer = setTimeout(() => setAppState(messages.length > 0 ? 'chat' : 'welcome'), 3000);
            return () => clearTimeout(timer);
        }
    }, [appState, messages.length]);

    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }, [messages]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const handleSpeechResult = useCallback((transcript: string) => {
        handleSendMessage(transcript);
    }, []);

    const { isListening, startListening, stopListening } = useSpeechRecognition(handleSpeechResult);

    const speakAndAddMessage = useCallback(async (text: string, sources?: GroundingSource[], imageUrl?: string) => {
        addMessage({ id: `ai-${crypto.randomUUID()}`, sender: 'ai', text, sources, imageUrl });
        
        stopListening();
        stopSpeaking();
        
        if (!isVoiceEnabled) return;

        const audio = await generateTextToSpeech(text);
        if (audio) {
            const { source, finished } = await playAudio(audio, getAudioContext());
            activeAudioSourceRef.current = source;
            setIsSpeaking(true);
            await finished;
            if (activeAudioSourceRef.current === source) {
                setIsSpeaking(false);
                activeAudioSourceRef.current = null;
            }
        }
    }, [addMessage, getAudioContext, stopListening, stopSpeaking, isVoiceEnabled]);

    const handleSendMessage = useCallback(async (message: string) => {
        if (isSpeaking) stopSpeaking();
        if (!message.trim() && !selectedImage) return;
        
        getAudioContext();
        setAppState('chat');
        setStatus('processing');
        
        const currentImage = selectedImage;
        addMessage({ 
            id: `user-${crypto.randomUUID()}`, 
            sender: 'user', 
            text: message, 
            userImageUrl: currentImage || undefined 
        });
        setSelectedImage(null);

        const command = message.trim().toLowerCase();
        
        try {
            // Trigger Image Generation Logic
            if (command.includes('create image') || command.includes('generate image')) {
                const prompt = message.replace(/create image|generate image/gi, '').trim();
                const genUrl = await generateImage(prompt || "a beautiful futuristic city");
                if (genUrl) {
                    await speakAndAddMessage("I've generated that image for you.", [], genUrl);
                } else {
                    await speakAndAddMessage("I'm sorry, I couldn't generate that image right now.");
                }
            } 
            // Trigger Image Editing Logic
            else if ((command.includes('edit image') || command.includes('modify image')) && currentImage) {
                const prompt = message.replace(/edit image|modify image/gi, '').trim();
                const editUrl = await editImage(prompt || "add more detail", currentImage);
                if (editUrl) {
                    await speakAndAddMessage("I've modified the image as requested.", [], editUrl);
                } else {
                    await speakAndAddMessage("I'm sorry, I couldn't edit that image.");
                }
            }
            // Standard Chat (including multimodal support)
            else {
                const aiResponse = await getAiChatResponse(message, currentImage || undefined);
                await speakAndAddMessage(aiResponse.text, aiResponse.sources);
            }
        } catch (error) {
            await speakAndAddMessage("I'm sorry, I encountered an issue. Please try again.");
        } finally {
            setStatus('idle');
        }
    }, [addMessage, speakAndAddMessage, getAudioContext, isSpeaking, stopSpeaking, selectedImage]);

    // File handling
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Wake-word listening
    useEffect(() => {
        if (appState === 'splash' || status === 'processing' || isSpeaking || isSettingsOpen || isHistoryOpen) {
            if (isListening) stopListening();
            return;
        }
        if (status === 'idle' && !isListening) {
            startListening(true, wakeWord);
        }
    }, [appState, status, isSpeaking, isListening, startListening, stopListening, isSettingsOpen, isHistoryOpen, wakeWord]);

    if (appState === 'splash') {
        return (
            <div className="bg-white dark:bg-black min-h-screen flex flex-col items-center justify-center transition-colors">
                <Logo className="w-32 h-32 text-black dark:text-white animate-pulse" />
                <h1 className="text-5xl font-bold mt-4 tracking-widest">AURIX</h1>
                <p className="text-sm font-medium text-gray-400 mt-8 uppercase tracking-widest">A Boakye Jeff Production</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-black min-h-screen flex flex-col font-sans text-gray-900 dark:text-white transition-colors duration-300">
            <Header
                onHistoryClick={() => setIsHistoryOpen(true)}
                onExperimentsClick={() => {}} 
                onSettingsClick={() => setIsSettingsOpen(true)}
                onPipClick={() => {}} 
                onShareClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("App link copied!");
                }}
            />
            
            <main className="flex-1 flex flex-col p-6 overflow-y-auto" ref={chatContainerRef}>
                {appState === 'welcome' && (
                     <div className="text-center flex-1 flex flex-col justify-center items-center">
                        <Logo className="w-16 h-16 mb-4 opacity-50" />
                        <h1 className="text-5xl font-bold">Aurix</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">Ready to assist you.</p>
                        <div className="mt-8 space-y-2 text-sm text-gray-400">
                            <p>Try: "Create image of a space cat"</p>
                            <p>Or: "Analyze this image" (with an attachment)</p>
                        </div>
                    </div>
                )}

                {appState === 'chat' && (
                    <div className="space-y-8 mb-4">
                        {messages.map((msg) => <ChatBubble key={msg.id} {...msg} />)}
                        {status === 'processing' && (
                            <div className="flex justify-center p-4">
                                <div className="loading-dots text-2xl font-bold">...</div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            
            <footer className="p-6 pt-0 flex flex-col items-center">
                <div className="h-12 flex items-center justify-center relative w-full max-w-2xl mb-2">
                    {status === 'listening' && <VoiceWave />}
                    {isSpeaking && (
                        <button 
                            onClick={stopSpeaking}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg animate-pulse"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M5.25 5.25h13.5v13.5H5.25V5.25z" />
                            </svg>
                            Stop Speaking
                        </button>
                    )}
                </div>

                <div className="w-full max-w-2xl flex flex-col gap-2">
                    {selectedImage && (
                        <div className="relative inline-block self-start">
                            <img src={selectedImage} className="h-20 w-20 object-cover rounded-lg border-2 border-blue-500" alt="Preview" />
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <AttachmentIcon className="w-6 h-6" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); setInputText(''); }} className="flex-grow relative">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={status === 'listening' ? 'Listening...' : `Say "${wakeWord}" or type...`}
                                disabled={status !== 'idle' || isSpeaking}
                                className="w-full h-14 pl-5 pr-14 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/70 disabled:opacity-50"
                            />
                            <button type="submit" disabled={isSpeaking || (!inputText && !selectedImage)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 flex items-center justify-center bg-blue-600 text-white disabled:bg-gray-400">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </form>

                        <button 
                            onClick={() => status === 'listening' ? stopListening() : startListening(false)}
                            disabled={isSpeaking}
                            className={`rounded-full w-14 h-14 flex items-center justify-center transition-all ${status === 'listening' ? 'bg-blue-500 scale-110 shadow-lg' : 'bg-gray-100 dark:bg-gray-800'} disabled:opacity-30`}
                        >
                            <MicrophoneIcon className={`h-7 w-7 ${status === 'listening' ? 'text-white' : 'text-gray-800 dark:text-white'}`} />
                        </button>
                    </div>
                </div>
            </footer>

            <Modal title="Settings" isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <label className="font-medium">Theme</label>
                         <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            {theme === 'light' ? 'Dark' : 'Light'} Mode
                         </button>
                    </div>
                    <div className="flex items-center justify-between">
                         <label className="font-medium">Voice Feedback</label>
                         <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className={`w-12 h-6 rounded-full transition-colors ${isVoiceEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-transform ${isVoiceEnabled ? 'translate-x-6' : ''}`} />
                         </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Wake Word</label>
                        <input type="text" value={wakeWord} onChange={(e) => setWakeWord(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </Modal>
            
            <Modal title="History" isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
                    {messages.map(msg => (
                        <div key={msg.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                            <span className="text-[10px] uppercase font-bold opacity-50">{msg.sender}</span>
                            <p className="text-sm mt-1 truncate">{msg.text || "[Image only]"}</p>
                        </div>
                    ))}
                    {messages.length === 0 && <p className="text-center text-gray-500 py-8">No history yet.</p>}
                </div>
                {messages.length > 0 && (
                    <button onClick={() => setMessages([])} className="w-full mt-4 text-red-500 text-sm font-bold p-2 hover:bg-red-50 rounded">Clear History</button>
                )}
            </Modal>
        </div>
    );
};

export default App;
