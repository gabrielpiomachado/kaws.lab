import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Category } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ArrowLeft, MapPin, Camera, CheckCircle2, Loader } from 'lucide-react';

interface CreateReportProps {
  onBack: () => void;
  onSuccess: (reportId: string) => void;
}

export function CreateReport({ onBack, onSuccess }: CreateReportProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    latitude: 0,
    longitude: 0,
    address: '',
    neighborhood: profile?.neighborhood || '',
    photo_url: '',
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState('');

  useEffect(() => {
    loadCategories();
    getLocation();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, latitude, longitude }));

          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, address }));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setFormData(prev => ({
            ...prev,
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'São Paulo, SP'
          }));
          setLocationLoading(false);
        }
      );
    } else {
      setFormData(prev => ({
        ...prev,
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'São Paulo, SP'
      }));
      setLocationLoading(false);
    }
  };

  const simulateAICategorizaton = (description: string, categories: Category[]) => {
    const keywords: Record<string, string[]> = {
      'Infrastructure': ['pothole', 'sidewalk', 'road', 'pavement', 'crack', 'bridge'],
      'Lighting': ['light', 'lamp', 'dark', 'illumination', 'street light'],
      'Waste Management': ['garbage', 'trash', 'waste', 'dump', 'litter', 'recycle'],
      'Water & Sewage': ['water', 'leak', 'sewage', 'drain', 'flood', 'pipe'],
      'Parks & Recreation': ['park', 'playground', 'tree', 'grass', 'bench', 'garden'],
      'Traffic & Signage': ['traffic', 'sign', 'signal', 'parking', 'lane'],
      'Public Safety': ['danger', 'hazard', 'unsafe', 'risk', 'broken'],
      'Noise Pollution': ['noise', 'loud', 'sound', 'disturbance'],
    };

    const descLower = description.toLowerCase();
    let bestMatch = categories[0];
    let maxMatches = 0;

    for (const [categoryName, words] of Object.entries(keywords)) {
      const matches = words.filter(word => descLower.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        const found = categories.find(c => c.name === categoryName);
        if (found) bestMatch = found;
      }
    }

    const confidence = maxMatches > 0 ? Math.min(75 + maxMatches * 5, 95) : 65;
    return { category: bestMatch, confidence };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const aiResult = simulateAICategorizaton(formData.description, categories);
      const selectedCategoryId = formData.category_id || aiResult.category.id;

      const { data: functionData } = await supabase.rpc('generate_protocol_number');
      const protocol = functionData || `URB-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;

      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          protocol_number: protocol,
          user_id: user!.id,
          category_id: selectedCategoryId,
          title: formData.title,
          description: formData.description,
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address,
          neighborhood: formData.neighborhood,
          photo_url: formData.photo_url || null,
          status: 'submitted',
          priority: 'medium',
          ai_confidence: aiResult.confidence,
          ai_suggested_category: aiResult.category.name,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('report_status_history').insert({
        report_id: report.id,
        old_status: null,
        new_status: 'submitted',
        changed_by: user!.id,
        notes: 'Report created by citizen',
      });

      const pointsToAdd = 10;
      await supabase
        .from('profiles')
        .update({ points: (profile?.points || 0) + pointsToAdd })
        .eq('id', user!.id);

      await refreshProfile();

      setProtocolNumber(protocol);
      setStep('success');

      setTimeout(() => {
        onSuccess(report.id);
      }, 3000);
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Error creating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-[#4CAF50]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-4">Your report has been successfully submitted and is now under review.</p>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Protocol Number</p>
            <p className="text-xl font-mono font-bold text-[#2E5BBA]">{protocolNumber}</p>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Estimated response: 3-7 business days
            </p>
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              You earned 10 points!
            </p>
          </div>

          <div className="animate-pulse text-gray-500 text-sm">
            Redirecting to home...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Report a Problem</h1>
            <p className="text-sm text-gray-600">Help improve your neighborhood</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                <MapPin size={20} className="text-[#2E5BBA] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Current Location</p>
                  <p className="text-sm text-gray-600">
                    {locationLoading ? 'Getting your location...' : formData.address}
                  </p>
                </div>
                {locationLoading && <Loader size={20} className="animate-spin text-[#2E5BBA]" />}
              </div>

              <Input
                label="Neighborhood"
                type="text"
                placeholder="Enter neighborhood name"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                required
                helperText="This helps us route your report to the right team"
              />

              <Input
                label="Specific Address (Optional)"
                type="text"
                placeholder="Street name, building number, etc."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>

            <div className="space-y-4">
              <Input
                label="Problem Title"
                type="text"
                placeholder="Brief description (e.g., Broken street light)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                helperText="Keep it short and clear"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detailed Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base min-h-[120px]
                    focus:outline-none focus:ring-2 focus:ring-[#2E5BBA] focus:border-[#2E5BBA]
                    transition-colors duration-200"
                  placeholder="Describe the problem in detail. What happened? When did you notice it?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Example: The street light at the corner has been out for 3 days, making it difficult to walk safely at night.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category (Optional)
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
                    focus:outline-none focus:ring-2 focus:ring-[#2E5BBA] focus:border-[#2E5BBA]"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Let AI suggest a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Our AI will automatically categorize your report if you don't select one
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Photo (Optional)
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  helperText="Photos help us understand and resolve issues faster"
                />
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Camera size={14} />
                  Paste an image URL or use a stock photo from Pexels
                </div>
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Submitting Report...' : 'Submit Report'}
          </Button>
        </form>
      </div>
    </div>
  );
}
