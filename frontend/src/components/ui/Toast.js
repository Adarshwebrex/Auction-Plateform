import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export function Toast({ toast, onRemove }) {
  useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const variants = {
    success: 'bg-green-500/90 border-green-400',
    error: 'bg-red-500/90 border-red-400',
    loading: 'bg-blue-500/90 border-blue-400',
    custom: 'bg-purple-500/90 border-purple-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${variants[toast.type] || variants.custom} backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-md flex items-center space-x-3`}
    >
      {toast.type === 'loading' && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      )}
      {toast.type === 'success' && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      {toast.type === 'error' && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <div className="flex-1">
        {typeof toast.message === 'function' ? toast.message({ toast, onRemove }) : toast.message}
      </div>
      {toast.type !== 'loading' && (
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-auto hover:opacity-70 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
