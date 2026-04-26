import React from 'react';
import { CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info' | 'confirm';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function Modal({ isOpen, type, title, message, onClose, onConfirm }: ModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="text-green-500 w-16 h-16" />,
    error: <XCircle className="text-red-500 w-16 h-16" />,
    info: <Info className="text-blue-500 w-16 h-16" />,
    confirm: <HelpCircle className="text-yellow-500 w-16 h-16" />
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl scale-up-animation">
        <div className="flex justify-center mb-4">
          {icons[type]}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-8">{message}</p>
        
        {type === 'confirm' ? (
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-colors shadow-lg"
            >
              ยืนยัน
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors shadow-lg"
          >
            ตกลง
          </button>
        )}
      </div>
    </div>
  );
}