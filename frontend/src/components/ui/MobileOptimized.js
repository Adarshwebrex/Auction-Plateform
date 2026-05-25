import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Mobile-optimized bottom navigation
export function MobileBottomNav({ items, activeItem, onItemClick }) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 md:hidden z-50"
    >
      <div className="grid grid-cols-5 gap-1 p-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
              activeItem === item.id
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <motion.div
              className={`w-6 h-6 ${activeItem === item.id ? 'text-blue-400' : 'text-white/60'}`}
              whileTap={{ scale: 0.9 }}
            >
              {item.icon}
            </motion.div>
            <span className="text-xs mt-1 truncate max-w-full">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Mobile-optimized bid card
export function MobileBidCard({ auction, onBid, currentBid, className = '' }) {
  return (
    <div className={`bg-white/5 rounded-lg p-4 space-y-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="w-20 h-20 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
          {auction.image ? (
            <img src={auction.image} alt={auction.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{auction.title}</h3>
          <p className="text-sm text-white/60 truncate">{auction.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60">Current Bid</div>
              <div className="text-lg font-bold text-white">
                {Number(auction.currentPrice || 0).toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                })}
              </div>
            </div>
            <button
              onClick={() => onBid(auction)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Bid Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized search bar
export function MobileSearchBar({ value, onChange, onClear, placeholder = 'Search auctions...' }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <svg className="h-5 w-5 text-white/40 hover:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Mobile-optimized filter panel
export function MobileFilterPanel({ filters, onChange, isOpen, onClose }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-white/10 z-50 md:hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        <button
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Category</label>
          <select
            value={filters.category || 'all'}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="all">All Categories</option>
            <option value="antique">Antique</option>
            <option value="vintage">Vintage</option>
            <option value="collectables">Collectables</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Price Range</label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.priceMin || ''}
              onChange={(e) => onChange('priceMin', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.priceMax || ''}
              onChange={(e) => onChange('priceMax', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Sort By</label>
          <select
            value={filters.sort || 'none'}
            onChange={(e) => onChange('sort', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="none">None</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="ending-soon">Ending Soon</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

// Mobile gesture handlers
export function useSwipeGestures(onSwipeLeft, onSwipeRight) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft?.();
    }
    if (isRightSwipe) {
      onSwipeRight?.();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Mobile-optimized carousel
export function MobileCarousel({ items, renderItem, className = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };
  
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex transition-transform duration-300 ease-out">
        {items.map((item, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      {items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Dots indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
