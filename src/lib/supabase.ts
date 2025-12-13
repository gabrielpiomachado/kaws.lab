import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  cpf?: string;
  role: 'citizen' | 'admin';
  neighborhood?: string;
  points: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority_weight: number;
  created_at: string;
};

export type Report = {
  id: string;
  protocol_number: string;
  user_id: string;
  category_id?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  photo_url?: string;
  status: 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ai_confidence?: number;
  ai_suggested_category?: string;
  assigned_to?: string;
  estimated_resolution_days: number;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
};

export type ReportNote = {
  id: string;
  report_id: string;
  user_id: string;
  content: string;
  is_public: boolean;
  created_at: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  badge_type: string;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
};

export type EducationalContent = {
  id: string;
  title: string;
  description: string;
  content_type: 'esg_campaign' | 'urban_tip' | 'sustainability';
  image_url?: string;
  published: boolean;
  created_at: string;
};
