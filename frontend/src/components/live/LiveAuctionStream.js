import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { BidActivityIndicator, CountdownTimer } from '../ui/LiveIndicator';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function LiveAuctionStream({ auctionId, isLive = false, onStreamStart, onStreamEnd }) {
  const [streamStatus, setStreamStatus] = useState('offline'); // offline, connecting, live, ended
  const [viewerCount, setViewerCount] = useState(0);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamQuality, setStreamQuality] = useState('auto');
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isLive && auctionId) {
      initializeStream();
    }
    
    return () => {
      cleanupStream();
    };
  }, [isLive, auctionId]);

  const initializeStream = async () => {
    setStreamStatus('connecting');
    
    try {
      // In a real implementation, this would connect to your streaming service
      // For demo purposes, we'll simulate a stream connection
      await simulateStreamConnection();
      
      setStreamStatus('live');
      setViewerCount(Math.floor(Math.random() * 500) + 50);
      onStreamStart?.();
      
      // Simulate viewer count updates
      const viewerInterval = setInterval(() => {
        setViewerCount(prev => {
          const change = Math.floor(Math.random() * 20) - 10;
          return Math.max(10, prev + change);
        });
      }, 5000);
      
      return () => clearInterval(viewerInterval);
    } catch (error) {
      console.error('Failed to initialize stream:', error);
      setStreamStatus('offline');
      toast.error('Failed to start live stream');
    }
  };

  const simulateStreamConnection = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock stream URL - in production this would be from your streaming provider
        setStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        resolve();
      }, 2000);
    });
  };

  const cleanupStream = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setStreamStatus('offline');
    onStreamEnd?.();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleQualityChange = (quality) => {
    setStreamQuality(quality);
    // In a real implementation, this would switch video quality
    toast.success(`Stream quality set to ${quality}`);
  };

  if (!isLive) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium">Live Stream Not Active</p>
          <p className="text-sm mt-2">This auction will be live when it starts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden" ref={containerRef}>
      {/* Stream Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <BidActivityIndicator isLive={streamStatus === 'live'} viewerCount={viewerCount} />
          <div className="flex items-center space-x-2">
            <select
              value={streamQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
              className="bg-black/50 text-white text-sm px-2 py-1 rounded border border-white/20"
            >
              <option value="auto">Auto</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video Stream */}
      <div className="relative aspect-video bg-gray-900">
        {streamStatus === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-white mt-4">Connecting to live stream...</p>
            </div>
          </div>
        )}
        
        {streamStatus === 'live' && streamUrl && (
          <video
            ref={videoRef}
            src={streamUrl}
            autoPlay
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={() => {
              videoRef.current.play().catch(console.error);
            }}
          />
        )}
        
        {streamStatus === 'offline' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Stream has ended</p>
            </div>
          </div>
        )}
      </div>

      {/* Stream Controls */}
      {streamStatus === 'live' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMute}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                {isMuted ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="text-white text-sm">
              <CountdownTimer 
                endTime={new Date(Date.now() + 3600000)} // 1 hour from now
                className="text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Bid Overlay */}
      {streamStatus === 'live' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white max-w-xs"
        >
          <div className="text-sm font-medium mb-1">Current Bid</div>
          <div className="text-2xl font-bold">¥12,500</div>
          <div className="text-xs opacity-70 mt-1">Last bid 2 mins ago</div>
        </motion.div>
      )}
    </div>
  );
}
