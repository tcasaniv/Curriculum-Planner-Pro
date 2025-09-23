import React from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const InfoModal: React.FC<ModalProps> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
            <div className="text-gray-700 dark:text-gray-300 mb-6">{children}</div>
            <div className="flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    </div>
);

export default InfoModal;