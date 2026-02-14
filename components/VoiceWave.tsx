
import React from 'react';

const VoiceWave: React.FC = () => {
    return (
        <div className="flex justify-center items-center h-12 space-x-1.5" aria-label="Listening indicator">
            <span className="block w-1.5 h-3 bg-blue-400 rounded-full animate-[voice-wave_1s_infinite_ease-in-out]" style={{ animationDelay: '0s' }} />
            <span className="block w-1.5 h-6 bg-blue-400 rounded-full animate-[voice-wave_1s_infinite_ease-in-out]" style={{ animationDelay: '0.2s' }} />
            <span className="block w-1.5 h-8 bg-blue-400 rounded-full animate-[voice-wave_1s_infinite_ease-in-out]" style={{ animationDelay: '0.4s' }} />
            <span className="block w-1.5 h-6 bg-blue-400 rounded-full animate-[voice-wave_1s_infinite_ease-in-out]" style={{ animationDelay: '0.6s' }} />
            <span className="block w-1.5 h-3 bg-blue-400 rounded-full animate-[voice-wave_1s_infinite_ease-in-out]" style={{ animationDelay: '0.8s' }} />
            <style>{`
                @keyframes voice-wave {
                    0%, 100% { transform: scaleY(0.5); }
                    50% { transform: scaleY(1.5); }
                }
            `}</style>
        </div>
    );
};

export default VoiceWave;