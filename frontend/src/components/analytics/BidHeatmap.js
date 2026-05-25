import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { api } from '../../utils/api';

export default function BidHeatmap({ auctionId, timeRange = '24h', width = 800, height = 400 }) {
  const [bidData, setBidData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentTimeRange, setCurrentTimeRange] = useState(timeRange);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchBidData();
  }, [auctionId, currentTimeRange]);

  const fetchBidData = async () => {
    setLoading(true);
    try {
      // Fetch real bid data
      const response = await api.get(`/bids/${auctionId}`);
      const bids = response.data || [];
      
      // Process real bid data for heatmap
      const processedData = processBidDataForHeatmap(bids, currentTimeRange);
      setBidData(processedData);
    } catch (error) {
      console.error('Failed to fetch bid data:', error);
      setBidData([]);
    } finally {
      setLoading(false);
    }
  };

  const processBidDataForHeatmap = (bids, timeRange) => {
    if (!bids || bids.length === 0) {
      return [];
    }

    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const data = [];

    // Group bids by hour
    const bidsByHour = {};
    bids.forEach(bid => {
      const bidTime = new Date(bid.createdAt || bid.timestamp || now);
      const hour = bidTime.getHours();
      const hourKey = hour;
      
      if (!bidsByHour[hourKey]) {
        bidsByHour[hourKey] = {
          bids: [],
          totalAmount: 0
        };
      }
      
      bidsByHour[hourKey].bids.push(bid);
      bidsByHour[hourKey].totalAmount += bid.amount || 0;
    });

    // Generate hourly data for heatmap
    for (let hour = 0; hour < 24; hour++) {
      const hourData = bidsByHour[hour] || { bids: [], totalAmount: 0 };
      const bidCount = hourData.bids.length;
      const avgAmount = bidCount > 0 ? hourData.totalAmount / bidCount : 0;
      
      // Only show hours with activity in the specified time range
      if (timeRange === '24h' || bidCount > 0) {
        data.push({
          hour,
          totalBids: bidCount,
          totalAmount: hourData.totalAmount,
          avgAmount: Math.floor(avgAmount),
          data: hourData.bids
        });
      }
    }

    return data;
  };

  const processedData = useMemo(() => {
    return bidData; // Data is already processed by processBidDataForHeatmap
  }, [bidData]);

  const maxIntensity = useMemo(() => {
    if (processedData.length === 0) return 1;
    return Math.max(...processedData.map(d => d.totalBids));
  }, [processedData]);

  const getColor = (intensity) => {
    const ratio = intensity / maxIntensity;
    if (ratio > 0.8) return 'rgba(239, 68, 68, 0.8)'; // red-500
    if (ratio > 0.6) return 'rgba(251, 146, 60, 0.8)'; // orange-400
    if (ratio > 0.4) return 'rgba(250, 204, 21, 0.8)'; // yellow-400
    if (ratio > 0.2) return 'rgba(34, 197, 94, 0.8)'; // green-500
    return 'rgba(59, 130, 246, 0.8)'; // blue-500
  };

  const handleCellClick = (hourData) => {
    setSelectedTime(hourData);
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
        <p className="text-white/60 mt-4">Loading bid activity...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-6" ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Bid Activity Heatmap</h3>
        <div className="flex items-center space-x-4">
          <select
            value={currentTimeRange}
            onChange={(e) => setCurrentTimeRange(e.target.value)}
            className="bg-white/10 text-white px-3 py-1 rounded border border-white/20 text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mb-6">
        <div className="grid grid-cols-24 gap-1 mb-2">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="text-xs text-white/60 text-center">
              {i}
            </div>
          ))}
        </div>
        
        <div className="space-y-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourData = processedData.find(d => d.hour === hour) || { 
              hour, 
              totalBids: 0, 
              totalAmount: 0, 
              avgAmount: 0,
              data: [] 
            };
            
            return (
              <motion.div
                key={hour}
                className="h-8 rounded cursor-pointer transition-all hover:scale-105"
                style={{ backgroundColor: getColor(hourData.totalBids) }}
                onClick={() => handleCellClick(hourData)}
                whileHover={{ opacity: 0.8 }}
              >
                <div className="h-full flex items-center justify-center text-white text-xs font-medium">
                  {hourData.totalBids > 0 ? `${hourData.totalBids} bids` : ''}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-white/60">Activity Level:</div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(0) }}></div>
            <span className="text-xs text-white/60">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(maxIntensity * 0.5) }}></div>
            <span className="text-xs text-white/60">Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(maxIntensity) }}></div>
            <span className="text-xs text-white/60">High</span>
          </div>
        </div>
      </div>

      {/* Selected Time Details */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">
                {selectedTime.hour}:00 - {selectedTime.hour + 1}:00
              </h4>
              <button
                onClick={() => setSelectedTime(null)}
                className="text-white/60 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{selectedTime.totalBids}</div>
                <div className="text-sm text-white/60">Total Bids</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(selectedTime.totalAmount / selectedTime.totalBids).toLocaleString()}
                </div>
                <div className="text-sm text-white/60">Avg Bid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {selectedTime.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-white/60">Total Value</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {processedData.reduce((sum, d) => sum + d.totalBids, 0)}
          </div>
          <div className="text-sm text-white/60">Total Bids</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {processedData.length > 0 
              ? Math.round(processedData.reduce((sum, d) => sum + d.totalBids, 0) / processedData.length)
              : 0}
          </div>
          <div className="text-sm text-white/60">Avg Hourly Bids</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {Math.max(...processedData.map(d => d.totalBids))}
          </div>
          <div className="text-sm text-white/60">Peak Hour</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {processedData.find(d => d.totalBids === Math.max(...processedData.map(d => d.totalBids)))?.hour || '--'
          }:00
          </div>
          <div className="text-sm text-white/60">Most Active</div>
        </div>
      </div>
    </div>
  );
}
