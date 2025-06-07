/*
  # Add unique constraint to subscription_usage table

  1. Changes
    - Add unique constraint on `user_id` column in `subscription_usage` table
    - This enables UPSERT operations using ON CONFLICT for usage tracking

  2. Security
    - No changes to existing RLS policies
    - Maintains data integrity by ensuring one usage record per user

  3. Notes
    - This constraint is required for the analyzeSite edge function to work properly
    - Allows proper conflict resolution in UPSERT operations
*/

-- Add unique constraint on user_id column
ALTER TABLE subscription_usage 
ADD CONSTRAINT subscription_usage_user_id_unique UNIQUE (user_id);