import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function VirtualShowroom({ auctions, onClose }) {
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [viewMode, setViewMode] = useState('gallery'); // gallery, room, tour
  const [currentRoom, setCurrentRoom] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tourProgress, setTourProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [lighting, setLighting] = useState('day'); // day, night, spotlight
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, zoom: 1 });
  
  const containerRef = useRef(null);
  const tourIntervalRef = useRef(null);

  // Room configurations
  const rooms = useMemo(() => [
    {
      id: 0,
      name: 'Ancient Artifacts',
      theme: 'classical',
      auctions: auctions.filter(a => a.category === 'artifacts' || a.category === 'ancient'),
      description: 'Explore timeless pieces from ancient civilizations'
    },
    {
      id: 1,
      name: 'Vintage Collection',
      theme: 'vintage',
      auctions: auctions.filter(a => a.category === 'vintage' || a.category === 'retro'),
      description: 'Discover charming items from bygone eras'
    },
    {
      id: 2,
      name: 'Fine Art Gallery',
      theme: 'modern',
      auctions: auctions.filter(a => a.category === 'art' || a.category === 'paintings'),
      description: 'Admire stunning paintings and artistic masterpieces'
    },
    {
      id: 3,
      name: 'Luxury Watches',
      theme: 'luxury',
      auctions: auctions.filter(a => a.category === 'watches' || a.category === 'jewelry'),
      description: 'Browse exquisite timepieces and fine jewelry'
    }
  ], [auctions]);

  useEffect(() => {
    if (isPlaying && viewMode === 'tour') {
      startTour();
    } else {
      stopTour();
    }
    
    return () => stopTour();
  }, [isPlaying, viewMode]);

  const startTour = () => {
    let roomIndex = 0;
    tourIntervalRef.current = setInterval(() => {
      roomIndex = (roomIndex + 1) % rooms.length;
      setCurrentRoom(roomIndex);
      setTourProgress(((roomIndex + 1) / rooms.length) * 100);
      
      if (roomIndex === 0) {
        // Tour completed
        setIsPlaying(false);
        toast.success('Virtual tour completed!');
      }
    }, 5000); // 5 seconds per room
  };

  const stopTour = () => {
    if (tourIntervalRef.current) {
      clearInterval(tourIntervalRef.current);
      tourIntervalRef.current = null;
    }
    setTourProgress(0);
  };

  const handleRoomClick = (roomId) => {
    setCurrentRoom(roomId);
    if (viewMode === 'tour') {
      setIsPlaying(false);
    }
  };

  const getRoomBackground = () => {
    const room = rooms[currentRoom];
    const lightingStyles = {
      day: 'bg-gradient-to-br from-amber-50 to-orange-100',
      night: 'bg-gradient-to-br from-indigo-900 to-purple-900',
      spotlight: 'bg-gradient-to-br from-gray-900 to-black'
    };
    
    return `${lightingStyles[lighting]} transition-all duration-1000`;
  };

  const renderGalleryView = () => {
    return (
      <div className="w-full h-full overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, z: 100 }}
              className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer"
              onClick={() => setSelectedAuction(auction)}
            >
              <div className="aspect-square bg-gray-200">
                <img
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{auction.title}</h3>
                <p className="text-sm text-gray-600 truncate">{auction.description}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    ¥{auction.currentPrice?.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">{auction.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderRoomView = () => {
    const room = rooms[currentRoom];
    
    return (
      <div className={`relative w-full h-full ${getRoomBackground()} overflow-hidden`}>
        {/* Room Header */}
        <div className="absolute top-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-4 z-10">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">{room.name}</h2>
              <p className="text-white/80">{room.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {room.auctions.length} items
              </span>
            </div>
          </div>
        </div>

        {/* 3D Room Simulation */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full max-w-6xl h-full max-h-[600px]">
            {/* Room Walls */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            
            {/* Display Items */}
            <div className="grid grid-cols-3 gap-8 p-8 h-full items-center">
              {room.auctions.slice(0, 6).map((auction, index) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.1, z: 50 }}
                  className="relative group"
                >
                  {/* Display Stand */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-lg" />
                  
                  {/* Item Display */}
                  <div className="relative z-10">
                    <div className="w-32 h-40 bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
                      <img
                        src={auction.image}
                        alt={auction.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Item Info */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white p-2 rounded-lg text-center min-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="font-semibold text-sm truncate">{auction.title}</div>
                      <div className="text-xs text-blue-400">¥{auction.currentPrice?.toLocaleString()}</div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Room Decorations */}
            <div className="absolute top-20 left-8 w-16 h-32 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg opacity-30" />
            <div className="absolute top-20 right-8 w-16 h-32 bg-gradient-to-b from-amber-800 to-amber-900 rounded-lg opacity-30" />
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-24 h-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full opacity-40" />
          </div>
        </div>

        {/* Room Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room.id)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentRoom === room.id
                  ? 'bg-white w-8'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTourView = () => {
    return (
      <div className="relative w-full h-full">
        {renderRoomView()}
        
        {/* Tour Controls */}
        <div className="absolute top-24 right-8 bg-black/60 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Virtual Tour</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlaying ? 'Pause Tour' : 'Start Tour'}
            </button>
            
            {/* Tour Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-white text-sm">
                <span>Progress</span>
                <span>{Math.round(tourProgress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${tourProgress}%` }}
                />
              </div>
            </div>
            
            {/* Manual Navigation */}
            <div className="space-y-2">
              <div className="text-white text-sm">Navigate to room:</div>
              <div className="grid grid-cols-2 gap-2">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomClick(room.id)}
                    className={`px-3 py-2 rounded text-xs transition-colors ${
                      currentRoom === room.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="text-white font-semibold">Virtual Showroom</h2>
              <p className="text-white/60 text-sm">Immersive auction experience</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Selector */}
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'gallery' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setViewMode('room')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'room' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                3D Room
              </button>
              <button
                onClick={() => setViewMode('tour')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'tour' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Tour
              </button>
            </div>
            
            {/* Lighting Controls */}
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setLighting('day')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  lighting === 'day' ? 'bg-yellow-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setLighting('night')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  lighting === 'night' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Night
              </button>
              <button
                onClick={() => setLighting('spotlight')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  lighting === 'spotlight' ? 'bg-gray-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Spotlight
              </button>
            </div>
            
            {/* Info Toggle */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded transition-colors ${
                showInfo ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {viewMode === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {renderGalleryView()}
            </motion.div>
          )}
          
          {viewMode === 'room' && (
            <motion.div
              key="room"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {renderRoomView()}
            </motion.div>
          )}
          
          {viewMode === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {renderTourView()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Info Panel */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-8 left-8 bg-black/60 backdrop-blur-sm rounded-lg p-4 max-w-xs"
          >
            <h3 className="text-white font-semibold mb-2">Virtual Showroom</h3>
            <div className="text-white/80 text-sm space-y-1">
              <p>Explore our curated collection in immersive 3D environments.</p>
              <p className="pt-2">Total items: {auctions.length}</p>
              <p>Active rooms: {rooms.length}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Auction Detail Modal */}
      <AnimatePresence>
        {selectedAuction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setSelectedAuction(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedAuction.image}
                  alt={selectedAuction.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-lg mb-2">{selectedAuction.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{selectedAuction.description}</p>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{selectedAuction.currentPrice?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Current Bid</div>
                </div>
                <button
                  onClick={() => {
                    // Navigate to auction details
                    window.location.href = `/auctions/${selectedAuction.id}`;
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Auction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
