/*
  # Add INSERT policy for citations table

  1. Security
    - Add policy for authenticated users to insert citations for their own sites
    - Ensures users can only create citations for sites they own
    - Maintains data security while enabling citation tracking functionality

  2. Changes
    - Creates INSERT policy on citations table
    - Policy checks that the site_id belongs to the authenticated user
    - Uses EXISTS clause to verify site ownership through sites.user_id
*/

-- Add INSERT policy for citations table
CREATE POLICY "Users can insert citations for their sites"
  ON citations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM sites 
      WHERE sites.id = citations.site_id 
      AND sites.user_id = auth.uid()
    )
  );