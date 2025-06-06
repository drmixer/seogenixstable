/*
  # Subscription System Tables

  1. New Tables
    - `subscriptions`: Stores user subscription details
    - `subscription_usage`: Tracks feature usage per user

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Functions
    - Add increment_usage function for tracking feature usage
    - Add check_usage_reset function to handle monthly resets
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription usage table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  citations_used integer DEFAULT 0,
  ai_content_used integer DEFAULT 0,
  last_audit_date timestamptz,
  reset_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage"
  ON subscription_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid, p_type text)
RETURNS subscription_usage
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage subscription_usage;
BEGIN
  -- Check if we need to reset usage (it's a new month)
  UPDATE subscription_usage
  SET
    citations_used = 0,
    ai_content_used = 0,
    reset_date = now(),
    updated_at = now()
  WHERE user_id = p_user_id
    AND date_trunc('month', reset_date) < date_trunc('month', now());

  -- Create usage record if it doesn't exist
  INSERT INTO subscription_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the appropriate counter
  UPDATE subscription_usage
  SET
    citations_used = CASE WHEN p_type = 'citations' THEN citations_used + 1 ELSE citations_used END,
    ai_content_used = CASE WHEN p_type = 'ai_content' THEN ai_content_used + 1 ELSE ai_content_used END,
    last_audit_date = CASE WHEN p_type = 'audits' THEN now() ELSE last_audit_date END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_usage;

  RETURN v_usage;
END;
$$;