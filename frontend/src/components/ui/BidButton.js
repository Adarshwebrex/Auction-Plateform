import { motion } from 'framer-motion';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function BidButton({ 
  onBid, 
  disabled = false, 
  loading = false, 
  bidAmount = '', 
  currentBid = 0,
  minIncrement = 1,
  className = '',
  children = 'Place Bid'
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isValidBid = bidAmount && Number(bidAmount) > currentBid && Number(bidAmount) >= currentBid + minIncrement;
  const isDisabled = disabled || loading || !isValidBid;
  
  return (
    <motion.button
      className={`
        relative w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200
        ${isDisabled 
          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10' 
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] border border-transparent'
        }
        ${className}
      `}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={!isDisabled ? onBid : undefined}
      disabled={isDisabled}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span>{children}</span>
          {bidAmount && isValidBid && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm opacity-80"
            >
              {Number(bidAmount).toLocaleString('en-IN', { 
                style: 'currency', 
                currency: 'INR',
                maximumFractionDigits: 0 
              })}
            </motion.div>
          )}
        </div>
      )}
      
      {/* Tooltip for invalid bids */}
      {isHovered && !isValidBid && bidAmount && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/80 text-white text-xs rounded-lg whitespace-nowrap z-10"
        >
          {Number(bidAmount) <= currentBid 
            ? `Bid must be higher than current bid ( ${currentBid.toLocaleString('en-IN')} )`
            : `Minimum increment is ${minIncrement.toLocaleString('en-IN')}`
          }
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

export function QuickBidButtons({ currentBid, minIncrement, onQuickBid, disabled = false }) {
  const quickBids = [
    { label: '+1x', multiplier: 1 },
    { label: '+2x', multiplier: 2 },
    { label: '+5x', multiplier: 5 },
    { label: '+10x', multiplier: 10 }
  ];
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {quickBids.map(({ label, multiplier }) => {
        const amount = currentBid + (minIncrement * multiplier);
        return (
          <motion.button
            key={label}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors border border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuickBid(amount)}
            disabled={disabled}
          >
            <div className="font-medium">{label}</div>
            <div className="text-xs opacity-70">
              {amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
