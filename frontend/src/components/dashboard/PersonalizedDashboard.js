import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function PersonalizedDashboard({ userId, userRole = 'user' }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [widgets, setWidgets] = useState([]);
  const [customLayout, setCustomLayout] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecommendations();
    fetchNotifications();
  }, [userId, selectedTimeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call - in production this would fetch real user data
      const mockData = generateMockDashboardData();
      setDashboardData(mockData);
      
      // Initialize default widgets
      const defaultWidgets = [
        { id: 'activity', type: 'activity', title: 'Recent Activity', size: 'large', position: { x: 0, y: 0 } },
        { id: 'bidding', type: 'bidding', title: 'Bidding Overview', size: 'medium', position: { x: 1, y: 0 } },
        { id: 'watchlist', type: 'watchlist', title: 'Watchlist', size: 'medium', position: { x: 2, y: 0 } },
        { id: 'saved', type: 'saved', title: 'Saved Searches', size: 'small', position: { x: 0, y: 1 } },
        { id: 'stats', type: 'stats', title: 'Personal Stats', size: 'small', position: { x: 1, y: 1 } },
        { id: 'trending', type: 'trending', title: 'Trending Items', size: 'medium', position: { x: 2, y: 1 } }
      ];
      setWidgets(defaultWidgets);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    // Mock personalized recommendations
    const mockRecommendations = [
      {
        id: 1,
        title: 'Ancient Roman Coin',
        category: 'coins',
        reason: 'Based on your interest in ancient artifacts',
        matchScore: 92,
        image: '/api/placeholder/200/200'
      },
      {
        id: 2,
        title: 'Vintage Pocket Watch',
        category: 'watches',
        reason: 'You viewed similar items recently',
        matchScore: 87,
        image: '/api/placeholder/200/200'
      },
      {
        id: 3,
        title: 'Antique Chinese Vase',
        category: 'pottery',
        reason: 'Trending in your area',
        matchScore: 78,
        image: '/api/placeholder/200/200'
      }
    ];
    setRecommendations(mockRecommendations);
  };

  const fetchNotifications = async () => {
    // Mock notifications
    const mockNotifications = [
      {
        id: 1,
        type: 'outbid',
        message: 'You were outbid on "Vintage Camera"',
        time: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
        action: { text: 'View Auction', url: '/auctions/123' }
      },
      {
        id: 2,
        type: 'ending',
        message: 'Auction "Antique Lamp" ending in 1 hour',
        time: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        action: { text: 'Place Bid', url: '/auctions/456' }
      },
      {
        id: 3,
        type: 'won',
        message: 'Congratulations! You won "Vintage Book"',
        time: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        action: { text: 'View Details', url: '/orders/789' }
      }
    ];
    setNotifications(mockNotifications);
  };

  const generateMockDashboardData = () => {
    const days = selectedTimeRange === '24h' ? 1 : selectedTimeRange === '7d' ? 7 : 30;
    const activityData = [];
    const biddingData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      activityData.push({
        date: format(date, 'MMM dd'),
        views: Math.floor(Math.random() * 50) + 10,
        bids: Math.floor(Math.random() * 10) + 2,
        wins: Math.floor(Math.random() * 3)
      });
      
      biddingData.push({
        date: format(date, 'MMM dd'),
        totalBids: Math.floor(Math.random() * 5000) + 1000,
        avgBid: Math.floor(Math.random() * 1000) + 500,
        successRate: Math.random() * 30 + 10
      });
    }
    
    const categories = [
      { name: 'Artifacts', value: 35, color: '#3b82f6' },
      { name: 'Vintage', value: 25, color: '#10b981' },
      { name: 'Art', value: 20, color: '#f59e0b' },
      { name: 'Watches', value: 15, color: '#ef4444' },
      { name: 'Other', value: 5, color: '#8b5cf6' }
    ];
    
    return {
      activityData,
      biddingData,
      categories,
      summary: {
        totalBids: 156,
        totalWins: 12,
        totalSpent: 45678,
        avgWinRate: 7.7,
        favoriteCategory: 'Artifacts',
        activeBids: 8,
        watchlistItems: 24,
        savedSearches: 6
      }
    };
  };

  const moveWidget = (widgetId, newPosition) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, position: newPosition }
        : widget
    ));
  };

  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
    toast.success('Widget removed from dashboard');
  };

  const addWidget = (type) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      size: 'medium',
      position: { x: 0, y: 2 }
    };
    setWidgets(prev => [...prev, newWidget]);
    toast.success('Widget added to dashboard');
  };

  const renderWidget = (widget) => {
    const { type, size, title } = widget;
    
    const sizeClasses = {
      small: 'col-span-1 row-span-1',
      medium: 'col-span-2 row-span-1',
      large: 'col-span-3 row-span-2'
    };
    
    return (
      <motion.div
        key={widget.id}
        layout
        className={`${sizeClasses[size]} bg-white/5 rounded-lg p-4 border border-white/10`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">{title}</h3>
          {customLayout && (
            <button
              onClick={() => removeWidget(widget.id)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {type === 'activity' && <ActivityWidget data={dashboardData?.activityData} />}
        {type === 'bidding' && <BiddingWidget data={dashboardData?.biddingData} />}
        {type === 'watchlist' && <WatchlistWidget />}
        {type === 'saved' && <SavedSearchesWidget />}
        {type === 'stats' && <StatsWidget summary={dashboardData?.summary} />}
        {type === 'trending' && <TrendingWidget />}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
            <p className="text-white/60">Personalized auction experience</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={() => setCustomLayout(!customLayout)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                customLayout
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {customLayout ? 'Layout Locked' : 'Customize Layout'}
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickStat
            label="Active Bids"
            value={dashboardData?.summary?.activeBids || 0}
            icon="hammer"
            color="blue"
          />
          <QuickStat
            label="Total Wins"
            value={dashboardData?.summary?.totalWins || 0}
            icon="trophy"
            color="green"
          />
          <QuickStat
            label="Watchlist"
            value={dashboardData?.summary?.watchlistItems || 0}
            icon="eye"
            color="purple"
          />
          <QuickStat
            label="Win Rate"
            value={`${dashboardData?.summary?.avgWinRate || 0}%`}
            icon="chart"
            color="orange"
          />
          <QuickStat
            label="Total Spent"
            value={`¥${(dashboardData?.summary?.totalSpent || 0).toLocaleString()}`}
            icon="wallet"
            color="red"
          />
          <QuickStat
            label="Notifications"
            value={notifications.filter(n => !n.read).length}
            icon="bell"
            color="yellow"
          />
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <AnimatePresence>
          {widgets.map(widget => renderWidget(widget))}
        </AnimatePresence>
      </div>

      {/* Recommendations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personalized Recommendations */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Recommended for You</h3>
          <div className="space-y-4">
            {recommendations.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-white/60 text-sm">{item.reason}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="text-xs text-blue-400">{item.matchScore}% match</div>
                    <div className="text-xs text-white/40">{item.category}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg border ${
                  notification.read 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-blue-600/20 border-blue-600/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white text-sm">{notification.message}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {format(notification.time, 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-1"></div>
                  )}
                </div>
                {notification.action && (
                  <button
                    onClick={() => window.location.href = notification.action.url}
                    className="mt-2 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                  >
                    {notification.action.text} &rarr;
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Widget Components
function ActivityWidget({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
        <YAxis stroke="rgba(255,255,255,0.5)" />
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
          labelStyle={{ color: '#fff' }}
        />
        <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
        <Area type="monotone" dataKey="bids" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BiddingWidget({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
        <YAxis stroke="rgba(255,255,255,0.5)" />
        <Tooltip
          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
          labelStyle={{ color: '#fff' }}
        />
        <Line type="monotone" dataKey="totalBids" stroke="#f59e0b" strokeWidth={2} />
        <Line type="monotone" dataKey="avgBid" stroke="#ef4444" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function WatchlistWidget() {
  const watchlistItems = [
    { title: 'Vintage Camera', currentBid: 450, endsIn: '2h' },
    { title: 'Antique Clock', currentBid: 1200, endsIn: '5h' },
    { title: 'Rare Book', currentBid: 350, endsIn: '1d' }
  ];
  
  return (
    <div className="space-y-3">
      {watchlistItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <div>
            <div className="text-white font-medium">{item.title}</div>
            <div className="text-white/60">¥{item.currentBid}</div>
          </div>
          <div className="text-blue-400">{item.endsIn}</div>
        </div>
      ))}
    </div>
  );
}

function SavedSearchesWidget() {
  const searches = [
    { query: 'ancient coins', results: 23 },
    { query: 'vintage watches', results: 15 },
    { query: 'art deco', results: 8 }
  ];
  
  return (
    <div className="space-y-2">
      {searches.map((search, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span className="text-white/80">{search.query}</span>
          <span className="text-blue-400">{search.results} new</span>
        </div>
      ))}
    </div>
  );
}

function StatsWidget({ summary }) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{summary?.favoriteCategory || 'N/A'}</div>
        <div className="text-white/60 text-sm">Favorite Category</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{summary?.avgWinRate || 0}%</div>
        <div className="text-white/60 text-sm">Win Rate</div>
      </div>
    </div>
  );
}

function TrendingWidget() {
  const trending = [
    { title: 'Roman Artifacts', change: '+12%' },
    { title: 'Vintage Watches', change: '+8%' },
    { title: 'Asian Antiques', change: '+15%' }
  ];
  
  return (
    <div className="space-y-2">
      {trending.map((item, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span className="text-white/80">{item.title}</span>
          <span className="text-green-400">{item.change}</span>
        </div>
      ))}
    </div>
  );
}

function QuickStat({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-400 border-blue-600/50',
    green: 'bg-green-600/20 text-green-400 border-green-600/50',
    purple: 'bg-purple-600/20 text-purple-400 border-purple-600/50',
    orange: 'bg-orange-600/20 text-orange-400 border-orange-600/50',
    red: 'bg-red-600/20 text-red-400 border-red-600/50',
    yellow: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50'
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-4 rounded-lg border ${colorClasses[color]}`}
    >
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </motion.div>
  );
}
