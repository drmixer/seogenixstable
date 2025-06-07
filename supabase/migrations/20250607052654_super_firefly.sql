/*
  # API Usage Tracking Table

  1. New Tables
    - `api_usage`
      - `date` (date, primary key part)
      - `provider` (text, primary key part) 
      - `queries_used` (integer)
      - `queries_limit` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_usage` table
    - Add policy for system access only (no user access needed)

  3. Purpose
    - Track daily API usage to stay within free tier limits
    - Prevent exceeding quotas for Google, News API, Reddit
    - Enable smart quota management
*/

CREATE TABLE IF NOT EXISTS api_usage (
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  queries_used INTEGER DEFAULT 0,
  queries_limit INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (date, provider)
);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for system access (edge functions can access)
CREATE POLICY "System can manage API usage"
  ON api_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update queries_used
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_date DATE,
  p_provider TEXT,
  p_queries INTEGER DEFAULT 1
) RETURNS void AS $$
BEGIN
  INSERT INTO api_usage (date, provider, queries_used, queries_limit, updated_at)
  VALUES (p_date, p_provider, p_queries, 
    CASE p_provider
      WHEN 'google' THEN 100
      WHEN 'news' THEN 33
      WHEN 'reddit' THEN 1000
      ELSE 100
    END,
    now()
  )
  ON CONFLICT (date, provider)
  DO UPDATE SET
    queries_used = api_usage.queries_used + p_queries,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_date_provider ON api_usage(date, provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date);