import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function ARViewer({ auction, images, onClose }) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(false);
  const [viewMode, setViewMode] = useState('2d'); // 2d, 3d, ar
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [measurements, setMeasurements] = useState({ width: 0, height: 0, depth: 0 });
  const [showMeasurements, setShowMeasurements] = useState(false);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    checkCapabilities();
    if (auction) {
      setMeasurements({
        width: auction.dimensions?.width || 30,
        height: auction.dimensions?.height || 40,
        depth: auction.dimensions?.depth || 20
      });
    }
  }, [auction]);

  const checkCapabilities = async () => {
    // Check WebXR AR support
    if ('xr' in navigator) {
      try {
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsARSupported(isSupported);
      } catch (error) {
        console.log('WebXR not supported:', error);
      }
    }

    // Check WebGL support for 3D
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setIs3DSupported(!!gl);
  };

  const startARSession = async () => {
    if (!isARSupported) {
      toast.error('AR is not supported on this device');
      return;
    }

    setIsLoading(true);
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local', 'hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation']
      });

      // In a real implementation, you would set up the AR scene here
      // For demo purposes, we'll simulate AR mode
      setViewMode('ar');
      toast.success('AR mode started! Point your camera at a surface to place the item.');
      
      // Simulate AR session ending after 30 seconds
      setTimeout(() => {
        session.end();
        setViewMode('2d');
        toast.info('AR session ended');
      }, 30000);
      
    } catch (error) {
      console.error('Failed to start AR session:', error);
      toast.error('Failed to start AR session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    if (viewMode === '3d') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && viewMode === '3d') {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setRotation(prev => ({
        x: prev.x + deltaY * 0.5,
        y: prev.y + deltaX * 0.5
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (viewMode === '3d') {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const render3DView = () => {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div
          className="relative"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* 3D Box representing the item */}
          <div className="relative w-48 h-64" style={{ transformStyle: 'preserve-3d' }}>
            {/* Front face */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 border border-white/20 flex items-center justify-center">
              <img src={images[currentImageIndex]} alt={auction.title} className="w-full h-full object-cover rounded" />
            </div>
            
            {/* Back face */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 border border-white/20" 
                 style={{ transform: 'rotateY(180deg) translateZ(1px)' }}>
              <div className="flex items-center justify-center h-full text-white text-center p-4">
                <div>
                  <h3 className="font-bold mb-2">{auction.title}</h3>
                  <p className="text-sm opacity-80">{auction.description}</p>
                </div>
              </div>
            </div>
            
            {/* Side faces */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-600 opacity-80" 
                 style={{ transform: 'rotateY(90deg) translateZ(96px)' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-purple-600 opacity-80" 
                 style={{ transform: 'rotateY(-90deg) translateZ(96px)' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-teal-600 opacity-80" 
                 style={{ transform: 'rotateX(90deg) translateZ(128px)' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600 opacity-80" 
                 style={{ transform: 'rotateX(-90deg) translateZ(128px)' }} />
          </div>
          
          {/* Measurement indicators */}
          {showMeasurements && (
            <div className="absolute -top-8 left-0 right-0 text-center text-white text-sm">
              <div className="bg-black/60 rounded px-2 py-1">
                {measurements.width}cm × {measurements.height}cm × {measurements.depth}cm
              </div>
            </div>
          )}
        </div>
        
        {/* 3D Controls hint */}
        <div className="absolute bottom-4 left-4 bg-black/60 rounded-lg p-3 text-white text-sm">
          <div className="font-medium mb-1">3D Controls:</div>
          <div className="text-xs opacity-80">
            <div>Drag to rotate</div>
            <div>Scroll to zoom</div>
          </div>
        </div>
      </div>
    );
  };

  const renderARView = () => {
    return (
      <div className="relative w-full h-full bg-black">
        {/* Camera view simulation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50">
          <img src={images[currentImageIndex]} alt={auction.title} className="w-full h-full object-cover opacity-80" />
        </div>
        
        {/* AR overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 border-2 border-green-400 rounded-lg animate-pulse" />
            <div className="text-green-400 text-center mt-4 font-medium">
              Tap to place item
            </div>
          </div>
        </div>
        
        {/* AR controls */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg">
            End AR
          </button>
          <div className="flex space-x-2">
            <button className="bg-white/20 text-white px-4 py-2 rounded-lg">
              Reset
            </button>
            <button className="bg-white/20 text-white px-4 py-2 rounded-lg">
              Capture
            </button>
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
              <h2 className="text-white font-semibold">{auction?.title}</h2>
              <p className="text-white/60 text-sm">Interactive 3D/AR View</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Selector */}
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === '2d' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === '3d' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
                disabled={!is3DSupported}
              >
                3D
              </button>
              <button
                onClick={startARSession}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'ar' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
                }`}
                disabled={!isARSupported || isLoading}
              >
                AR
              </button>
            </div>
            
            {/* Additional Controls */}
            <button
              onClick={() => setShowMeasurements(!showMeasurements)}
              className={`p-2 rounded transition-colors ${
                showMeasurements ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === '2d' && (
            <motion.div
              key="2d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center bg-gray-900"
            >
              <div className="relative max-w-4xl max-h-full">
                <img
                  ref={imageRef}
                  src={images[currentImageIndex]}
                  alt={auction.title}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-full px-3 py-1 text-white text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {viewMode === '3d' && (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {render3DView()}
            </motion.div>
          )}
          
          {viewMode === 'ar' && (
            <motion.div
              key="ar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {renderARView()}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
              <p className="text-white">Initializing AR...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-black/80 backdrop-blur-sm p-4 border-t border-white/20">
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center space-x-4">
            <span>Current Bid: ¥{auction?.currentPrice?.toLocaleString() || 'N/A'}</span>
            <span>Ends: {new Date(auction?.endTime || Date.now() + 3600000).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            {is3DSupported && <span className="text-green-400">3D Available</span>}
            {isARSupported && <span className="text-blue-400">AR Available</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
