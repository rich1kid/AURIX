
import React, { PropsWithChildren } from 'react';

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

const Modal: React.FC<PropsWithChildren<ModalProps>> = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md m-4 p-6 transform transition-all duration-300 ease-out animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close modal">
                        <CloseIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="mt-5">
                    {children}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default Modal;