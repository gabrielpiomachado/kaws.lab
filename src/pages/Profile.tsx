import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Achievement, type UserAchievement } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  ArrowLeft,
  Award,
  Trophy,
  Medal,
  Shield,
  Camera,
  Leaf,
  Star,
  TrendingUp,
  Target,
} from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
  onNavigateToAdmin?: () => void;
}

const iconMap: Record<string, any> = {
  Award,
  Trophy,
  Medal,
  Shield,
  Camera,
  Leaf,
  Star,
};

export function Profile({ onBack, onNavigateToAdmin }: ProfileProps) {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const [achievementsRes, userAchievementsRes] = await Promise.all([
        supabase.from('achievements').select('*').order('points_required'),
        supabase
          .from('user_achievements')
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq('user_id', profile!.id),
      ]);

      if (achievementsRes.data) setAchievements(achievementsRes.data);
      if (userAchievementsRes.data) setUserAchievements(userAchievementsRes.data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAchievement = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getNextMilestone = () => {
    const milestones = [0, 50, 100, 250, 500, 1000];
    const current = profile?.points || 0;
    return milestones.find(m => m > current) || 1000;
  };

  const getProgressToNext = () => {
    const current = profile?.points || 0;
    const next = getNextMilestone();
    const previous = [0, 50, 100, 250, 500, 1000].reverse().find(m => m <= current) || 0;
    const progress = ((current - previous) / (next - previous)) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#2E5BBA] to-[#1e3a7a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors mb-4"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
              <p className="text-blue-100">{profile?.neighborhood || 'Citizen'}</p>
              <p className="text-sm text-blue-200 mt-1">
                {profile?.role === 'admin' ? 'Municipal Administrator' : 'Active Citizen'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={20} className="text-yellow-300" />
                <p className="text-xs text-blue-100">Total Points</p>
              </div>
              <p className="text-3xl font-bold">{profile?.points || 0}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Award size={20} className="text-green-300" />
                <p className="text-xs text-blue-100">Achievements</p>
              </div>
              <p className="text-3xl font-bold">{userAchievements.length}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {profile?.role === 'admin' && onNavigateToAdmin && (
          <Button
            onClick={onNavigateToAdmin}
            size="lg"
            fullWidth
            variant="primary"
          >
            <Shield size={20} />
            Open Admin Dashboard
          </Button>
        )}

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} className="text-[#2E5BBA]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Progress to Next Milestone</h2>
              <p className="text-sm text-gray-600">Keep contributing to earn more points!</p>
            </div>
          </div>

          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600">Current: {profile?.points || 0} points</span>
            <span className="text-gray-600">Next: {getNextMilestone()} points</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#2E5BBA] to-[#4CAF50] h-full rounded-full transition-all duration-500"
              style={{ width: `${getProgressToNext()}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-gray-600 mb-1">Points per Report</p>
              <p className="text-xl font-bold text-[#4CAF50]">+10</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-gray-600 mb-1">Points with Photo</p>
              <p className="text-xl font-bold text-[#2E5BBA]">+15</p>
            </div>
          </div>
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award size={24} className="text-[#2E5BBA]" />
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#2E5BBA]"></div>
              <p className="text-gray-600 mt-3">Loading achievements...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const earned = hasAchievement(achievement.id);
                const Icon = iconMap[achievement.icon] || Award;

                return (
                  <Card
                    key={achievement.id}
                    className={`${
                      earned
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                          earned
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Icon size={28} />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-bold mb-1 ${
                            earned ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {achievement.name}
                        </h3>
                        <p
                          className={`text-sm mb-2 ${
                            earned ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {achievement.description}
                        </p>
                        {earned ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Earned
                            </span>
                            <span className="text-xs text-gray-500">
                              {achievement.points_required} points
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Target size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Requires {achievement.points_required} points
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Star size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Community Impact</h3>
              <p className="text-sm text-green-100">
                Your contributions help build a better, more sustainable city for everyone. Every report matters!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
