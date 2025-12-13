import { useState, useEffect } from 'react';
import { supabase, type Report, type ReportNote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface ReportDetailsProps {
  reportId: string;
  onBack: () => void;
}

export function ReportDetails({ reportId, onBack }: ReportDetailsProps) {
  const { profile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [notes, setNotes] = useState<ReportNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
    loadNotes();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('report_notes')
        .select('*')
        .eq('report_id', reportId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotes(data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const getStatusTimeline = () => {
    const statuses = [
      { key: 'submitted', label: 'Submitted', done: true },
      { key: 'under_review', label: 'Under Review', done: report?.status !== 'submitted' },
      { key: 'in_progress', label: 'In Progress', done: report?.status === 'in_progress' || report?.status === 'resolved' || report?.status === 'closed' },
      { key: 'resolved', label: 'Resolved', done: report?.status === 'resolved' || report?.status === 'closed' },
    ];
    return statuses;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#2E5BBA]"></div>
          <p className="text-gray-600 mt-3">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="text-center max-w-md">
          <AlertCircle size={48} className="text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-4">The report you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={onBack}
            className="text-[#2E5BBA] font-semibold hover:underline"
          >
            Go Back
          </button>
        </Card>
      </div>
    );
  }

  const timeline = getStatusTimeline();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Report Details</h1>
            <p className="text-sm text-gray-600 font-mono">{report.protocol_number}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {report.photo_url && (
          <Card padding="none" className="overflow-hidden">
            <img
              src={report.photo_url}
              alt="Report"
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg';
              }}
            />
          </Card>
        )}

        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: report.category?.color + '20' }}
            >
              <MapPin size={24} style={{ color: report.category?.color }} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h2>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {report.neighborhood}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {formatDate(report.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{report.description}</p>
          </div>

          {report.ai_suggested_category && report.ai_confidence && (
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">AI Analysis</p>
              <p className="text-sm font-semibold text-gray-900">
                Categorized as: {report.ai_suggested_category}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Confidence: {report.ai_confidence}%
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Progress</h3>

          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item.key} className="flex items-start gap-4">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.done
                        ? 'bg-[#4CAF50] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>
                  {index < timeline.length - 1 && (
                    <div
                      className={`absolute left-1/2 top-10 w-0.5 h-8 -ml-px ${
                        item.done ? 'bg-[#4CAF50]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className={`font-semibold ${item.done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Estimated Resolution Time</p>
            <p className="text-lg font-bold text-gray-900">
              {report.estimated_resolution_days} business days
            </p>
          </div>
        </Card>

        {notes.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle size={20} />
              Updates from Municipality
            </h3>

            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={18} className="text-[#2E5BBA]" />
              <span className="text-sm">{report.address}</span>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Coordinates</p>
              <p className="font-mono text-sm text-gray-800">
                {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
