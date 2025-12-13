import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Report, type Category } from '../lib/supabase';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import {
  Plus,
  MapPin,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  LogOut,
  BarChart3
} from 'lucide-react';

interface HomeProps {
  onNavigate: (page: 'create-report' | 'report-details' | 'education' | 'profile') => void;
  onSelectReport: (reportId: string) => void;
}

export function Home({ onNavigate, onSelectReport }: HomeProps) {
  const { profile, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setReports(reportsData || []);

      const resolved = reportsData?.filter(r => r.status === 'resolved' || r.status === 'closed').length || 0;
      const pending = reportsData?.filter(r => r.status === 'submitted' || r.status === 'under_review').length || 0;

      setStats({
        total: reportsData?.length || 0,
        resolved,
        pending
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#2E5BBA] to-[#1e3a7a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
              <p className="text-blue-100 text-sm mt-1">
                {profile?.neighborhood || 'Your City'} • Active Citizen
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Award size={18} className="text-yellow-300" />
                <p className="text-xs text-blue-100">Points</p>
              </div>
              <p className="text-2xl font-bold">{profile?.points || 0}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={18} className="text-green-300" />
                <p className="text-xs text-blue-100">Resolved</p>
              </div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={18} className="text-orange-300" />
                <p className="text-xs text-blue-100">Pending</p>
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Button
          onClick={() => onNavigate('create-report')}
          size="lg"
          fullWidth
          className="shadow-lg"
        >
          <Plus size={24} />
          Report a Problem
        </Button>

        <div className="grid md:grid-cols-2 gap-4">
          <Card hover className="cursor-pointer" onClick={() => onNavigate('education')}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <BookOpen size={24} className="text-[#4CAF50]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Urban Education</h3>
                <p className="text-sm text-gray-600">Learn about sustainability</p>
              </div>
            </div>
          </Card>

          {profile?.role === 'admin' && (
            <Card hover className="cursor-pointer" onClick={() => onNavigate('profile')}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 size={24} className="text-[#2E5BBA]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                  <p className="text-sm text-gray-600">Manage city reports</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Recent Reports</h2>
            <TrendingUp size={20} className="text-[#4CAF50]" />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#2E5BBA]"></div>
              <p className="text-gray-600 mt-3">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <AlertCircle size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No reports yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Start making a difference in your community by reporting your first issue.
                </p>
                <Button onClick={() => onNavigate('create-report')}>
                  <Plus size={20} />
                  Create First Report
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectReport(report.id);
                    onNavigate('report-details');
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: report.category?.color + '20' }}
                    >
                      <MapPin size={24} style={{ color: report.category?.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{report.title}</h3>
                        <StatusBadge status={report.status} size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {report.neighborhood}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {getTimeAgo(report.created_at)}
                        </span>
                        <span className="font-mono text-gray-400">
                          {report.protocol_number}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
