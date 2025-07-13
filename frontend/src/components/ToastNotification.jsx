import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ToastNotification = ({ show, message, type, onClose }) => {
  if (!show) return null;
  
  return (
    <div className="fixed top-20 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`rounded-lg p-4 flex items-center shadow-lg max-w-xs ${
          type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}
      >
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>
        <p className="ml-3 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto flex-shrink-0 -mr-1 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};

export default ToastNotification;