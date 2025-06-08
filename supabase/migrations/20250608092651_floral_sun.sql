/*
  # Add missing RLS policies for entities table

  1. Security
    - Add INSERT policy for authenticated users to create entities for their sites
    - Add UPDATE policy for authenticated users to modify entities for their sites  
    - Add DELETE policy for authenticated users to remove entities for their sites

  2. Changes
    - Users can insert entities for sites they own
    - Users can update entities for sites they own
    - Users can delete entities for sites they own
*/

-- Add INSERT policy for entities
CREATE POLICY "Users can create entities for their sites"
  ON entities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = entities.site_id 
      AND sites.user_id = auth.uid()
    )
  );

-- Add UPDATE policy for entities
CREATE POLICY "Users can update entities for their sites"
  ON entities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = entities.site_id 
      AND sites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = entities.site_id 
      AND sites.user_id = auth.uid()
    )
  );

-- Add DELETE policy for entities
CREATE POLICY "Users can delete entities for their sites"
  ON entities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = entities.site_id 
      AND sites.user_id = auth.uid()
    )
  );