-- Allow whole-item foods (e.g. "Ei (volledig)") to be tracked per piece instead of per gram
ALTER TABLE foods DROP CONSTRAINT foods_unit_check;
ALTER TABLE foods ADD CONSTRAINT foods_unit_check CHECK (unit IN ('g', 'ml', 'stuk'));
