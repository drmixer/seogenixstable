/*
  # Initial Database Schema
  Breaking down the migration into smaller chunks to avoid timeout
*/

-- Create tables first
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  url text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites ON DELETE CASCADE NOT NULL,
  ai_visibility_score integer NOT NULL,
  schema_score integer NOT NULL,
  semantic_score integer NOT NULL,
  citation_score integer NOT NULL,
  technical_seo_score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits ON DELETE CASCADE NOT NULL,
  schema_type text NOT NULL,
  markup text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL,
  snippet_text text NOT NULL,
  url text NOT NULL,
  detected_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites ON DELETE CASCADE NOT NULL,
  summary_type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites ON DELETE CASCADE NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  mention_count integer NOT NULL,
  gap boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
  ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
  ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create their own sites" ON sites;
  DROP POLICY IF EXISTS "Users can view their own sites" ON sites;
  DROP POLICY IF EXISTS "Users can update their own sites" ON sites;
  DROP POLICY IF EXISTS "Users can delete their own sites" ON sites;
  DROP POLICY IF EXISTS "Users can create audits for their sites" ON audits;
  DROP POLICY IF EXISTS "Users can view audits for their sites" ON audits;
  DROP POLICY IF EXISTS "Users can view schemas for their audits" ON schemas;
  DROP POLICY IF EXISTS "Users can view citations for their sites" ON citations;
  DROP POLICY IF EXISTS "Users can view summaries for their sites" ON summaries;
  DROP POLICY IF EXISTS "Users can view entities for their sites" ON entities;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for sites
CREATE POLICY "Users can create their own sites" ON sites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own sites" ON sites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own sites" ON sites FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sites" ON sites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for audits
CREATE POLICY "Users can create audits for their sites" ON audits FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()));

CREATE POLICY "Users can view audits for their sites" ON audits FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()));

-- Create policies for schemas
CREATE POLICY "Users can view schemas for their audits" ON schemas FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM audits 
  JOIN sites ON sites.id = audits.site_id 
  WHERE audits.id = audit_id AND sites.user_id = auth.uid()
));

-- Create policies for citations
CREATE POLICY "Users can view citations for their sites" ON citations FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()));

-- Create policies for summaries
CREATE POLICY "Users can view summaries for their sites" ON summaries FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()));

-- Create policies for entities
CREATE POLICY "Users can view entities for their sites" ON entities FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()));

-- Create indexes
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS sites_user_id_idx ON sites (user_id);
  CREATE INDEX IF NOT EXISTS audits_site_id_idx ON audits (site_id);
  CREATE INDEX IF NOT EXISTS schemas_audit_id_idx ON schemas (audit_id);
  CREATE INDEX IF NOT EXISTS citations_site_id_idx ON citations (site_id);
  CREATE INDEX IF NOT EXISTS summaries_site_id_idx ON summaries (site_id);
  CREATE INDEX IF NOT EXISTS entities_site_id_idx ON entities (site_id);
END $$;