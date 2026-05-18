-- Client mag eigen training schemas lezen
-- Run in Supabase SQL Editor
CREATE POLICY "Client reads own training schemas" ON training_schemas
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Client reads own training exercises" ON training_exercises
  FOR SELECT USING (
    schema_id IN (
      SELECT ts.id FROM training_schemas ts
      JOIN clients c ON c.id = ts.client_id
      WHERE c.user_id = auth.uid()
    )
  );
