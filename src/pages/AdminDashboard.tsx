import { useState, useEffect } from 'react';
import { supabase, type Report } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  MapPin,
  Filter,
  Users,
  TrendingUp,
  Map as MapIcon,
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

type FilterStatus = 'all' | 'submitted' | 'under_review' | 'in_progress' | 'resolved';

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    under_review: 0,
    in_progress: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, reports]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reportsData: Report[]) => {
    setStats({
      total: reportsData.length,
      submitted: reportsData.filter(r => r.status === 'submitted').length,
      under_review: reportsData.filter(r => r.status === 'under_review').length,
      in_progress: reportsData.filter(r => r.status === 'in_progress').length,
      resolved: reportsData.filter(r => r.status === 'resolved' || r.status === 'closed').length,
    });
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(r => r.status === filter));
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport || !newStatus) return;

    setUpdating(true);
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'under_review' && selectedReport.assigned_to === null) {
        updates.assigned_to = user!.id;
      }

      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', selectedReport.id);

      if (updateError) throw updateError;

      await supabase.from('report_status_history').insert({
        report_id: selectedReport.id,
        old_status: selectedReport.status,
        new_status: newStatus,
        changed_by: user!.id,
        notes: `Status updated by admin`,
      });

      if (publicNote.trim()) {
        await supabase.from('report_notes').insert({
          report_id: selectedReport.id,
          user_id: user!.id,
          content: publicNote,
          is_public: true,
        });
      }

      await loadReports();
      setModalOpen(false);
      setSelectedReport(null);
      setNewStatus('');
      setPublicNote('');
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Error updating report');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors mb-4"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          <h1 className="text-3xl font-bold mb-6">Municipal Dashboard</h1>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <MapIcon size={18} />
                <p className="text-xs text-blue-100">Total Reports</p>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={18} className="text-yellow-300" />
                <p className="text-xs text-blue-100">New</p>
              </div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={18} className="text-orange-300" />
                <p className="text-xs text-blue-100">In Review</p>
              </div>
              <p className="text-2xl font-bold">{stats.under_review}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={18} className="text-purple-300" />
                <p className="text-xs text-blue-100">In Progress</p>
              </div>
              <p className="text-2xl font-bold">{stats.in_progress}</p>
            </Card>

            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={18} className="text-green-300" />
                <p className="text-xs text-blue-100">Resolved</p>
              </div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6 overflow-x-auto">
          <Filter size={20} className="text-gray-600 flex-shrink-0" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-[#2E5BBA] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === 'submitted'
                ? 'bg-[#2E5BBA] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            New ({stats.submitted})
          </button>
          <button
            onClick={() => setFilter('under_review')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === 'under_review'
                ? 'bg-[#2E5BBA] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Review ({stats.under_review})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === 'in_progress'
                ? 'bg-[#2E5BBA] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Progress ({stats.in_progress})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === 'resolved'
                ? 'bg-[#2E5BBA] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Resolved ({stats.resolved})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#2E5BBA]"></div>
            <p className="text-gray-600 mt-3">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No reports in this category</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                hover
                className="cursor-pointer"
                onClick={() => {
                  setSelectedReport(report);
                  setNewStatus(report.status);
                  setModalOpen(true);
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
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{report.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <StatusBadge status={report.status} size="sm" />
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
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
                      {report.ai_confidence && (
                        <span className="text-blue-600">
                          AI: {report.ai_confidence}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
          setNewStatus('');
          setPublicNote('');
        }}
        title="Update Report Status"
        maxWidth="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Protocol Number</p>
              <p className="font-mono font-semibold text-gray-900">{selectedReport.protocol_number}</p>
              <p className="text-sm text-gray-600 mt-2">{selectedReport.title}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Update Status
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
                  focus:outline-none focus:ring-2 focus:ring-[#2E5BBA] focus:border-[#2E5BBA]"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Public Update (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base min-h-[100px]
                  focus:outline-none focus:ring-2 focus:ring-[#2E5BBA] focus:border-[#2E5BBA]"
                placeholder="Add a public note that the citizen will see..."
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be visible to the citizen who submitted the report
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setModalOpen(false);
                  setSelectedReport(null);
                  setNewStatus('');
                  setPublicNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleUpdateReport}
                loading={updating}
              >
                Update Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
