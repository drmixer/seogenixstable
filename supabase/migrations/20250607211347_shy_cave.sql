/*
  # Add INSERT policy for summaries table

  1. Security
    - Add policy for authenticated users to insert summaries for their own sites
    - This allows users to create summaries for sites they own
*/

CREATE POLICY "Users can create summaries for their sites"
  ON summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM sites
      WHERE sites.id = summaries.site_id
      AND sites.user_id = auth.uid()
    )
  );