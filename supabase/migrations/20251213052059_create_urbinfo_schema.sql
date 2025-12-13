/*
  # UrbInfo Civic Engagement Platform - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for UrbInfo, a civic engagement 
  platform connecting citizens with municipal governments for urban issue reporting and resolution.

  ## New Tables

  ### 1. profiles
  Extended user profile information beyond auth.users
  - `id` (uuid, FK to auth.users) - User identifier
  - `full_name` (text) - User's full name
  - `cpf` (text, optional) - Brazilian CPF for verification
  - `role` (text) - User role: 'citizen' or 'admin'
  - `neighborhood` (text) - User's neighborhood
  - `points` (integer) - Gamification points earned
  - `avatar_url` (text, optional) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. categories
  Incident/report categories for classification
  - `id` (uuid, PK) - Category identifier
  - `name` (text) - Category name (Infrastructure, Lighting, Waste, etc.)
  - `description` (text) - Category description
  - `icon` (text) - Icon name for UI display
  - `color` (text) - Color code for visual identification
  - `priority_weight` (integer) - Base priority for this category
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. reports
  Citizen-submitted urban incident reports
  - `id` (uuid, PK) - Report identifier
  - `protocol_number` (text, unique) - Human-readable protocol (URB-2025-XXXXX)
  - `user_id` (uuid, FK) - Submitting citizen
  - `category_id` (uuid, FK) - Report category
  - `title` (text) - Brief report title
  - `description` (text) - Detailed description
  - `latitude` (numeric) - Location latitude
  - `longitude` (numeric) - Location longitude
  - `address` (text) - Human-readable address
  - `neighborhood` (text) - Neighborhood name
  - `photo_url` (text, optional) - Incident photo
  - `status` (text) - Current status: 'submitted', 'under_review', 'in_progress', 'resolved', 'closed'
  - `priority` (text) - Priority level: 'low', 'medium', 'high', 'urgent'
  - `ai_confidence` (numeric) - AI categorization confidence (0-100)
  - `ai_suggested_category` (text, optional) - AI's category suggestion
  - `assigned_to` (uuid, FK, optional) - Assigned admin user
  - `estimated_resolution_days` (integer) - Expected days to resolve
  - `resolved_at` (timestamptz, optional) - Resolution timestamp
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. report_status_history
  Audit trail for report status changes
  - `id` (uuid, PK) - History entry identifier
  - `report_id` (uuid, FK) - Associated report
  - `old_status` (text) - Previous status
  - `new_status` (text) - New status
  - `changed_by` (uuid, FK) - User who made the change
  - `notes` (text, optional) - Status change notes
  - `created_at` (timestamptz) - Change timestamp

  ### 5. report_notes
  Internal notes and communications about reports
  - `id` (uuid, PK) - Note identifier
  - `report_id` (uuid, FK) - Associated report
  - `user_id` (uuid, FK) - Note author
  - `content` (text) - Note content
  - `is_public` (boolean) - Visible to citizen (true) or internal only (false)
  - `created_at` (timestamptz) - Note creation timestamp

  ### 6. achievements
  Gamification achievement definitions
  - `id` (uuid, PK) - Achievement identifier
  - `name` (text) - Achievement name
  - `description` (text) - Achievement description
  - `icon` (text) - Icon name
  - `points_required` (integer) - Points needed to unlock
  - `badge_type` (text) - Type: 'active_citizen', 'neighborhood_guardian', etc.
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. user_achievements
  Tracks which users have earned which achievements
  - `id` (uuid, PK) - Record identifier
  - `user_id` (uuid, FK) - User who earned achievement
  - `achievement_id` (uuid, FK) - Earned achievement
  - `earned_at` (timestamptz) - When achievement was earned

  ### 8. educational_content
  Urban education and ESG content
  - `id` (uuid, PK) - Content identifier
  - `title` (text) - Content title
  - `description` (text) - Content description
  - `content_type` (text) - Type: 'esg_campaign', 'urban_tip', 'sustainability'
  - `image_url` (text, optional) - Content image
  - `published` (boolean) - Published status
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Citizens can view their own data and public information
  - Admins have broader access for municipal management
  - Audit trails maintained for all status changes
  - LGPD compliance through proper data access controls
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cpf text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  neighborhood text,
  points integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  priority_weight integer DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  title text NOT NULL,
  description text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text NOT NULL,
  neighborhood text NOT NULL,
  photo_url text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ai_confidence numeric,
  ai_suggested_category text,
  assigned_to uuid REFERENCES auth.users(id),
  estimated_resolution_days integer DEFAULT 7,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- REPORT STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of own reports"
  ON report_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_status_history.report_id
      AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all history"
  ON report_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert history"
  ON report_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- REPORT NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public notes on own reports"
  ON report_notes FOR SELECT
  TO authenticated
  USING (
    is_public = true AND EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = report_notes.report_id
      AND reports.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all notes"
  ON report_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create notes"
  ON report_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon text NOT NULL,
  points_required integer DEFAULT 0,
  badge_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- USER ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- EDUCATIONAL CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS educational_content (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('esg_campaign', 'urban_tip', 'sustainability')),
  image_url text,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published content is viewable by everyone"
  ON educational_content FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Admins can manage content"
  ON educational_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default categories
INSERT INTO categories (name, description, icon, color, priority_weight) VALUES
  ('Infrastructure', 'Roads, sidewalks, bridges, and public structures', 'Construction', '#FF6B6B', 80),
  ('Lighting', 'Street lights, public lighting issues', 'Lightbulb', '#FFD93D', 70),
  ('Waste Management', 'Garbage collection, recycling, illegal dumping', 'Trash2', '#4CAF50', 75),
  ('Water & Sewage', 'Water leaks, sewage problems, drainage', 'Droplet', '#2196F3', 90),
  ('Parks & Recreation', 'Public parks, playgrounds, green spaces', 'Trees', '#8BC34A', 50),
  ('Traffic & Signage', 'Traffic lights, road signs, traffic issues', 'TrafficCone', '#FF9800', 65),
  ('Public Safety', 'Safety hazards, security concerns', 'Shield', '#F44336', 95),
  ('Noise Pollution', 'Excessive noise complaints', 'Volume2', '#9C27B0', 40)
ON CONFLICT (name) DO NOTHING;

-- Insert achievement badges
INSERT INTO achievements (name, description, icon, points_required, badge_type) VALUES
  ('First Report', 'Submitted your first civic report', 'Award', 0, 'active_citizen'),
  ('Active Citizen', 'Submitted 5 quality reports', 'Medal', 50, 'active_citizen'),
  ('Neighborhood Guardian', 'Submitted 10 reports in your neighborhood', 'Shield', 100, 'neighborhood_guardian'),
  ('Civic Champion', 'Submitted 25 reports helping improve the city', 'Trophy', 250, 'active_citizen'),
  ('Photo Documenter', 'Added photos to 10 reports', 'Camera', 100, 'active_citizen'),
  ('Sustainability Hero', 'Reported 5 environmental issues', 'Leaf', 75, 'neighborhood_guardian')
ON CONFLICT (name) DO NOTHING;

-- Insert educational content
INSERT INTO educational_content (title, description, content_type, image_url, published) VALUES
  (
    'Sustainable Waste Sorting',
    'Learn how to properly sort your waste for recycling. Separate plastics, paper, glass, and organic materials to help create a cleaner, more sustainable city.',
    'sustainability',
    'https://images.pexels.com/photos/3951383/pexels-photo-3951383.jpeg',
    true
  ),
  (
    'Water Conservation Tips',
    'Every drop counts! Simple daily actions like fixing leaks, taking shorter showers, and reusing water can make a significant impact on our water resources.',
    'urban_tip',
    'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg',
    true
  ),
  (
    'Report Responsibly',
    'Help us serve you better by providing clear descriptions, accurate locations, and photos when reporting issues. Quality reports lead to faster resolutions.',
    'urban_tip',
    'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg',
    true
  ),
  (
    'Green Spaces Matter',
    'Urban green spaces improve air quality, reduce heat, and enhance mental wellbeing. Help us maintain parks and trees in your neighborhood.',
    'esg_campaign',
    'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg',
    true
  )
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_neighborhood ON reports(neighborhood);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_status_history_report_id ON report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_notes_report_id ON report_notes(report_id);

-- Create function to generate protocol numbers
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS text AS $$
DECLARE
  year text;
  sequence_num text;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  sequence_num := LPAD((SELECT COUNT(*) + 1 FROM reports WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE))::text, 5, '0');
  RETURN 'URB-' || year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;