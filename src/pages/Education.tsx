import { useState, useEffect } from 'react';
import { supabase, type EducationalContent } from '../lib/supabase';
import { Card } from '../components/Card';
import { ArrowLeft, Leaf, Lightbulb, Recycle, Heart } from 'lucide-react';

interface EducationProps {
  onBack: () => void;
}

const contentTypeIcons = {
  'esg_campaign': Leaf,
  'urban_tip': Lightbulb,
  'sustainability': Recycle,
};

const contentTypeLabels = {
  'esg_campaign': 'ESG Campaign',
  'urban_tip': 'Urban Tip',
  'sustainability': 'Sustainability',
};

export function Education({ onBack }: EducationProps) {
  const [content, setContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors mb-4"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Leaf size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Urban Education</h1>
              <p className="text-green-100">Building a sustainable future together</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20 text-center">
              <Leaf size={24} className="mx-auto mb-2" />
              <p className="text-xs">ESG Initiatives</p>
            </Card>
            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20 text-center">
              <Lightbulb size={24} className="mx-auto mb-2" />
              <p className="text-xs">Urban Tips</p>
            </Card>
            <Card padding="sm" className="bg-white/10 backdrop-blur-sm border border-white/20 text-center">
              <Recycle size={24} className="mx-auto mb-2" />
              <p className="text-xs">Sustainability</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#4CAF50]"></div>
            <p className="text-gray-600 mt-3">Loading content...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.map((item) => {
              const Icon = contentTypeIcons[item.content_type];
              return (
                <Card key={item.id} hover className="overflow-hidden">
                  <div className="md:flex gap-6">
                    {item.image_url && (
                      <div className="md:w-48 h-48 flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg';
                          }}
                        />
                      </div>
                    )}
                    <div className={`flex-1 ${item.image_url ? 'mt-4 md:mt-0' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Icon size={18} className="text-[#4CAF50]" />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {contentTypeLabels[item.content_type]}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card className="bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Make a Difference Today</h3>
                  <p className="text-sm text-green-100">
                    Every small action counts. Report issues, share knowledge, and help build a more sustainable community.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
