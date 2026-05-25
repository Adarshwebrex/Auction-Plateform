import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function LiveIndicator({ isLive = true, viewerCount = 0 }) {
  const [pulse, setPulse] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <motion.div
          className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-500'}`}
          animate={isLive ? { scale: pulse ? [1, 1.2, 1] : 1 } : {}}
          transition={{ duration: 0.5 }}
        />
        <span className={`text-xs font-medium ${isLive ? 'text-red-500' : 'text-gray-500'}`}>
          {isLive ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      {viewerCount > 0 && (
        <div className="flex items-center space-x-1 text-white/60 text-xs">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <span>{viewerCount}</span>
        </div>
      )}
    </div>
  );
}

export function BidActivityIndicator({ recentBids = [] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm text-white/60">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>Recent Activity</span>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        <AnimatePresence>
          {recentBids.slice(0, 5).map((bid, index) => (
            <motion.div
              key={`${bid.userId}-${bid.timestamp}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-xs"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {bid.userId?.toString().charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-white/80">
                  {bid.userId?.toString().slice(-4) || 'Anonymous'}
                </span>
              </div>
              <div className="text-white font-medium">
                {Number(bid.amount).toLocaleString('en-IN', { 
                  style: 'currency', 
                  currency: 'INR',
                  maximumFractionDigits: 0 
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function CountdownTimer({ endTime, onEnd, className = '' }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endTime) - new Date();
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        const timeString = hours > 0 
          ? `${hours}h ${minutes}m ${seconds}s`
          : minutes > 0 
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`;
          
        setTimeLeft(timeString);
        setIsUrgent(difference < 60000); // Last minute
      } else {
        setTimeLeft('Ended');
        setIsUrgent(false);
        if (onEnd) onEnd();
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [endTime, onEnd]);
  
  return (
    <motion.div
      className={`text-center ${className}`}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isUrgent ? Infinity : 0, duration: 1 }}
    >
      <div className={`text-sm font-medium ${isUrgent ? 'text-red-500' : 'text-white/80'}`}>
        {timeLeft}
      </div>
      {isUrgent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400 mt-1"
        >
          Auction ending soon!
        </motion.div>
      )}
    </motion.div>
  );
}
