import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import LiveAuctionStream from '../components/live/LiveAuctionStream';
import BidHeatmap from '../components/analytics/BidHeatmap';
import AuctionAnalytics from '../components/analytics/AuctionAnalytics';
import EnhancedChat from '../components/chat/EnhancedChat';
import ARViewer from '../components/experience/ARViewer';
import VirtualShowroom from '../components/experience/VirtualShowroom';
import PersonalizedDashboard from '../components/dashboard/PersonalizedDashboard';
import GamificationSystem from '../components/gamification/GamificationSystem';

export default function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState('overview');
  const [showARViewer, setShowARViewer] = useState(false);
  const [showShowroom, setShowShowroom] = useState(false);

  const mockAuction = {
    id: 'test-auction-123',
    title: 'Ancient Roman Coin Collection',
    category: 'artifacts',
    currentPrice: 15000,
    status: 'active',
    endTime: new Date(Date.now() + 3600000),
    description: 'A rare collection of ancient Roman coins from the 2nd century AD.',
    dimensions: { width: 5, height: 5, depth: 1 },
    image: '/api/placeholder/400/300',
    images: [
      '/api/placeholder/400/300',
      '/api/placeholder/400/301',
      '/api/placeholder/400/302'
    ]
  };

  const mockAuctions = [
    mockAuction,
    {
      ...mockAuction,
      id: 'test-auction-456',
      title: 'Vintage Pocket Watch',
      category: 'watches',
      currentPrice: 8500
    },
    {
      ...mockAuction,
      id: 'test-auction-789',
      title: 'Antique Chinese Vase',
      category: 'pottery',
      currentPrice: 25000
    }
  ];

  const features = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'All new features at a glance',
      icon: 'grid'
    },
    {
      id: 'stream',
      title: 'Live Streaming',
      description: 'Real-time auction streaming',
      icon: 'video'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Bid heatmaps and insights',
      icon: 'chart'
    },
    {
      id: 'chat',
      title: 'Enhanced Chat',
      description: 'Real-time messaging with typing indicators',
      icon: 'message'
    },
    {
      id: 'ar',
      title: '3D/AR Viewer',
      description: 'Immersive product visualization',
      icon: 'cube'
    },
    {
      id: 'showroom',
      title: 'Virtual Showroom',
      description: '3D gallery experience',
      icon: 'gallery'
    },
    {
      id: 'dashboard',
      title: 'Personal Dashboard',
      description: 'Customizable user dashboard',
      icon: 'dashboard'
    },
    {
      id: 'gamification',
      title: 'Gamification',
      description: 'Achievements and rewards system',
      icon: 'trophy'
    }
  ];

  const renderFeature = () => {
    switch (activeFeature) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveFeature(feature.id)}
                className="bg-white/5 p-6 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        );

      case 'stream':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Live Auction Stream</h2>
            <LiveAuctionStream 
              auctionId={mockAuction.id}
              isLive={true}
              onStreamStart={() => toast.success('Stream started')}
              onStreamEnd={() => toast.info('Stream ended')}
            />
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Auction Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BidHeatmap auctionId={mockAuction.id} />
              <AuctionAnalytics auctionId={mockAuction.id} />
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Enhanced Live Chat</h2>
            <EnhancedChat 
              auctionId={mockAuction.id}
              userId="test-user-123"
              userName="Test User"
            />
          </div>
        );

      case 'ar':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">3D/AR Product Viewer</h2>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <p className="text-white/60 mb-4">Experience this item in 3D and Augmented Reality</p>
              <button
                onClick={() => setShowARViewer(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Open 3D/AR Viewer
              </button>
            </div>
          </div>
        );

      case 'showroom':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Virtual Showroom</h2>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <p className="text-white/60 mb-4">Explore our immersive 3D gallery</p>
              <button
                onClick={() => setShowShowroom(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Enter Virtual Showroom
              </button>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Personalized Dashboard</h2>
            <PersonalizedDashboard 
              userId="test-user-123"
              userRole="user"
            />
          </div>
        );

      case 'gamification':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Gamification System</h2>
            <GamificationSystem 
              userId="test-user-123"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Feature Showcase</h1>
        <p className="text-white/60">Explore all the new features for AntiqueXX</p>
      </div>

      {/* Feature Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeFeature === feature.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              {feature.title}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Content */}
      <motion.div
        key={activeFeature}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderFeature()}
      </motion.div>

      {/* AR Viewer Modal */}
      {showARViewer && (
        <ARViewer
          auction={mockAuction}
          images={mockAuction.images}
          onClose={() => setShowARViewer(false)}
        />
      )}

      {/* Virtual Showroom Modal */}
      {showShowroom && (
        <VirtualShowroom
          auctions={mockAuctions}
          onClose={() => setShowShowroom(false)}
        />
      )}
    </div>
  );
}
