import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function GamificationSystem({ userId }) {
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchGamificationData();
  }, [userId]);

  const fetchGamificationData = async () => {
    try {
      // Mock data - in production this would fetch from API
      const mockStats = generateMockUserStats();
      const mockAchievements = generateMockAchievements();
      const mockLeaderboard = generateMockLeaderboard();
      const mockRewards = generateMockRewards();
      const mockChallenges = generateMockChallenges();
      
      setUserStats(mockStats);
      setAchievements(mockAchievements);
      setLeaderboard(mockLeaderboard);
      setRewards(mockRewards);
      setChallenges(mockChallenges);
      setUserLevel(mockStats.level);
      setUserPoints(mockStats.points);
      setStreak(mockStats.streak);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    }
  };

  const generateMockUserStats = () => ({
    level: 12,
    points: 3450,
    streak: 7,
    totalBids: 156,
    totalWins: 23,
    favoriteCategory: 'ancient',
    badges: ['early_bird', 'bid_master', 'collector'],
    nextLevelPoints: 4000,
    rank: 15,
    title: 'Antique Enthusiast'
  });

  const generateMockAchievements = () => [
    {
      id: 1,
      title: 'First Bid',
      description: 'Place your first bid',
      icon: 'hammer',
      points: 10,
      unlocked: true,
      unlockedAt: new Date('2024-01-15'),
      rarity: 'common'
    },
    {
      id: 2,
      title: 'Winning Streak',
      description: 'Win 3 auctions in a row',
      icon: 'trophy',
      points: 50,
      unlocked: true,
      unlockedAt: new Date('2024-02-20'),
      rarity: 'rare'
    },
    {
      id: 3,
      title: 'Collector',
      description: 'Win 10 different categories',
      icon: 'star',
      points: 100,
      unlocked: false,
      progress: 7,
      total: 10,
      rarity: 'epic'
    },
    {
      id: 4,
      title: 'Night Owl',
      description: 'Place a bid after midnight',
      icon: 'moon',
      points: 25,
      unlocked: true,
      unlockedAt: new Date('2024-03-10'),
      rarity: 'uncommon'
    },
    {
      id: 5,
      title: 'Big Spender',
      description: 'Spend over ¥10,000 in a month',
      icon: 'wallet',
      points: 75,
      unlocked: false,
      progress: 6500,
      total: 10000,
      rarity: 'rare'
    }
  ];

  const generateMockLeaderboard = () => [
    { rank: 1, username: 'CollectorKing', points: 8900, level: 25, badge: 'crown' },
    { rank: 2, username: 'AntiqueHunter', points: 7650, level: 22, badge: 'medal' },
    { rank: 3, username: 'VintageLover', points: 6800, level: 20, badge: 'medal' },
    { rank: 4, username: 'BidMaster99', points: 5400, level: 18, badge: 'star' },
    { rank: 5, username: 'RareFinder', points: 4890, level: 16, badge: 'star' },
    { rank: 15, username: 'You', points: 3450, level: 12, badge: 'user', isCurrentUser: true }
  ];

  const generateMockRewards = () => [
    {
      id: 1,
      title: 'Free Shipping',
      description: 'Free shipping on next purchase',
      points: 500,
      category: 'discount',
      available: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      title: 'Bid Credit',
      description: '¥100 bidding credit',
      points: 1000,
      category: 'credit',
      available: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      title: 'Premium Badge',
      description: 'Exclusive premium collector badge',
      points: 2000,
      category: 'cosmetic',
      available: false,
      expiresAt: null
    }
  ];

  const generateMockChallenges = () => [
    {
      id: 1,
      title: 'Weekly Bidder',
      description: 'Place 20 bids this week',
      progress: 14,
      total: 20,
      points: 100,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      completed: false
    },
    {
      id: 2,
      title: 'Category Explorer',
      description: 'Bid on 5 different categories',
      progress: 3,
      total: 5,
      points: 75,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completed: false
    },
    {
      id: 3,
      title: 'Early Bird',
      description: 'Win 3 auctions before 10 AM',
      progress: 2,
      total: 3,
      points: 50,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      completed: false
    }
  ];

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-500 bg-gray-500/20',
      uncommon: 'border-green-500 bg-green-500/20',
      rare: 'border-blue-500 bg-blue-500/20',
      epic: 'border-purple-500 bg-purple-500/20',
      legendary: 'border-yellow-500 bg-yellow-500/20'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityTextColor = (rarity) => {
    const colors = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400'
    };
    return colors[rarity] || colors.common;
  };

  const unlockReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && userPoints >= reward.points) {
      setUserPoints(prev => prev - reward.points);
      toast.success(`Unlocked: ${reward.title}!`);
      
      // Update reward availability
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, available: false } : r
      ));
    } else {
      toast.error('Not enough points to unlock this reward');
    }
  };

  const getLevelProgress = () => {
    const currentLevelPoints = (userLevel - 1) * 350; // 350 points per level
    const nextLevelPoints = userLevel * 350;
    const progress = ((userPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getLevelTitle = (level) => {
    const titles = [
      'Newcomer', 'Novice', 'Enthusiast', 'Collector', 'Expert',
      'Connoisseur', 'Specialist', 'Master', 'Authority', 'Legend'
    ];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header with User Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* User Avatar & Level */}
            <div className="text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl font-bold text-white">{userLevel}</span>
              </div>
              <div className="text-white font-medium">Level {userLevel}</div>
              <div className="text-white/80 text-sm">{getLevelTitle(userLevel)}</div>
            </div>
            
            {/* Stats */}
            <div className="space-y-2">
              <div>
                <div className="text-white font-semibold text-lg">{userPoints} Points</div>
                <div className="text-white/80 text-sm">Rank #{userStats?.rank}</div>
              </div>
              
              {/* Level Progress */}
              <div className="w-64">
                <div className="flex justify-between text-white/80 text-xs mb-1">
                  <span>Level {userLevel}</span>
                  <span>Level {userLevel + 1}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
              </div>
              
              {/* Streak */}
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium">{streak} day streak</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userStats?.totalBids}</div>
              <div className="text-white/80 text-sm">Total Bids</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userStats?.totalWins}</div>
              <div className="text-white/80 text-sm">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{achievements.filter(a => a.unlocked).length}</div>
              <div className="text-white/80 text-sm">Achievements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Achievements */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border ${getRarityColor(achievement.rarity)} ${
                    achievement.unlocked ? 'opacity-100' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRarityTextColor(achievement.rarity)}`}>
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${achievement.unlocked ? 'text-white' : 'text-white/60'}`}>
                          {achievement.title}
                        </h3>
                        <span className={`text-sm ${getRarityTextColor(achievement.rarity)}`}>
                          {achievement.points} pts
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mt-1">{achievement.description}</p>
                      
                      {achievement.unlocked ? (
                        <p className="text-white/40 text-xs mt-2">
                          Unlocked {format(achievement.unlockedAt, 'MMM dd, yyyy')}
                        </p>
                      ) : (
                        <div className="mt-2">
                          <div className="flex justify-between text-white/60 text-xs mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress || 0}/{achievement.total || 1}</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-1">
                            <div
                              className="bg-white h-1 rounded-full"
                              style={{ width: `${((achievement.progress || 0) / (achievement.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Active Challenges */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 mt-6">
            <h2 className="text-xl font-semibold text-white mb-6">Active Challenges</h2>
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{challenge.title}</h3>
                    <span className="text-blue-400 text-sm">+{challenge.points} pts</span>
                  </div>
                  <p className="text-white/60 text-sm mb-3">{challenge.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-white/60 text-xs">
                      <span>Progress</span>
                      <span>{challenge.progress}/{challenge.total}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-white/40 text-xs">
                      Expires {format(challenge.expiresAt, 'MMM dd, HH:mm')}
                    </span>
                    {challenge.completed && (
                      <span className="text-green-400 text-sm font-medium">Completed!</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((user) => (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    user.isCurrentUser ? 'bg-blue-600/20 border border-blue-600/50' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.rank <= 3 ? 'bg-yellow-500 text-black' : 'bg-white/20 text-white'
                    }`}>
                      {user.rank}
                    </div>
                    <div>
                      <div className={`font-medium ${user.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                        {user.username}
                      </div>
                      <div className="text-white/60 text-xs">Level {user.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{user.points}</div>
                    <div className="text-white/60 text-xs">points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Rewards Store */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Rewards Store</h2>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border ${
                    reward.available
                      ? 'bg-white/5 border-white/20 cursor-pointer hover:bg-white/10'
                      : 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => reward.available && unlockReward(reward.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{reward.title}</h3>
                    <span className={`text-sm ${reward.available ? 'text-blue-400' : 'text-gray-400'}`}>
                      {reward.points} pts
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{reward.description}</p>
                  {!reward.available && (
                    <p className="text-red-400 text-xs mt-2">Not available</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Unlock Modal */}
      <AnimatePresence>
        {showAchievementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setShowAchievementModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Achievement Unlocked!</h2>
                <p className="text-white/80 mb-4">{showAchievementModal.title}</p>
                <p className="text-white/60 text-sm mb-6">{showAchievementModal.description}</p>
                <div className="text-yellow-300 font-semibold mb-6">
                  +{showAchievementModal.points} Points
                </div>
                <button
                  onClick={() => setShowAchievementModal(null)}
                  className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getAchievementIcon(iconName) {
  const icons = {
    hammer: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    trophy: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v6H2a2 2 0 110-4h1.17C3.06 5.687 3.78 5 5 5zm6 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    ),
    star: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    moon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    ),
    wallet: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  };
  return icons[iconName] || icons.star;
}
