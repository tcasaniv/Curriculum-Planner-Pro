import React from 'react';

interface ConfirmationModalProps {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
  confirmText?: string;
  confirmClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    title, 
    onClose, 
    onConfirm, 
    children, 
    confirmText = 'Confirmar', 
    confirmClass = 'bg-indigo-600 hover:bg-indigo-500' 
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
                <div className="text-gray-700 dark:text-gray-300 mb-6">{children}</div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded font-bold text-white transition-colors ${confirmClass}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;