import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-white border-t-transparent`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <LoadingSpinner size="lg" />
      <motion.p
        className="text-white/60 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </div>
  );
}

export function InlineLoader({ message = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size="sm" />
      <span className="text-white/60 text-sm">{message}</span>
    </div>
  );
}

export function ButtonLoader({ children, loading, className = '', ...props }) {
  return (
    <button
      className={`relative flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
    </button>
  );
}
