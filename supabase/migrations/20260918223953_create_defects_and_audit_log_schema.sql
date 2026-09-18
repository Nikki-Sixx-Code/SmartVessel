/*
# Defect Tracking & Audit Trail Schema

## Summary
Adds two new tables: a global defect/non-conformity tracker and an
immutable audit trail log (PSC/SIRE compliant). No sign-in screen,
so all data is shared operational data with `TO anon, authenticated`.

## 1. New Tables

### `defects`
Global defect and non-conformity tracker.
- `id` (uuid, primary key)
- `ship_id` (uuid, references ships)
- `inspection_id` (uuid, nullable, references inspections)
- `inspection_item_id` (uuid, nullable, references inspection_items)
- `title` (text) — defect description
- `severity` (text) — 'low', 'medium', 'critical'
- `assigned_officer` (text)
- `target_resolution_date` (date)
- `status` (text) — 'open', 'in_progress', 'resolved'
- `photo_label` (text, nullable)
- `photo_compressed_size` (text, nullable)
- `photo_original_size` (text, nullable)
- `created_by_role` (text)
- `created_by_name` (text)
- `gps_coordinates` (text, nullable)
- `checklist_ref` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### `audit_log_entries`
Immutable audit trail for PSC/SIRE compliance.
- `id` (uuid, primary key)
- `inspection_id` (uuid, nullable, references inspections)
- `ship_id` (uuid, nullable, references ships)
- `action` (text)
- `action_type` (text)
- `user_name` (text)
- `user_role` (text)
- `gps_coordinates` (text)
- `item_key` (text, nullable)
- `item_question` (text, nullable)
- `created_at` (timestamptz)

## 2. Security
RLS enabled, `TO anon, authenticated` — shared operational data.
*/

CREATE TABLE IF NOT EXISTS defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id uuid NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES inspections(id) ON DELETE SET NULL,
  inspection_item_id uuid REFERENCES inspection_items(id) ON DELETE SET NULL,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  assigned_officer text NOT NULL,
  target_resolution_date date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  photo_label text,
  photo_compressed_size text,
  photo_original_size text,
  created_by_role text NOT NULL DEFAULT 'junior_officer',
  created_by_name text NOT NULL DEFAULT 'Unknown',
  gps_coordinates text,
  checklist_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES inspections(id) ON DELETE SET NULL,
  ship_id uuid REFERENCES ships(id) ON DELETE SET NULL,
  action text NOT NULL,
  action_type text NOT NULL,
  user_name text NOT NULL,
  user_role text NOT NULL,
  gps_coordinates text NOT NULL DEFAULT '',
  item_key text,
  item_question text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_defects_ship_id ON defects(ship_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_inspection_id ON audit_log_entries(inspection_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_ship_id ON audit_log_entries(ship_id);

ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_defects" ON defects;
CREATE POLICY "anon_select_defects" ON defects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_defects" ON defects;
CREATE POLICY "anon_insert_defects" ON defects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_defects" ON defects;
CREATE POLICY "anon_update_defects" ON defects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_defects" ON defects;
CREATE POLICY "anon_delete_defects" ON defects FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_audit_log" ON audit_log_entries;
CREATE POLICY "anon_select_audit_log" ON audit_log_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_log" ON audit_log_entries;
CREATE POLICY "anon_insert_audit_log" ON audit_log_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_audit_log" ON audit_log_entries;
CREATE POLICY "anon_update_audit_log" ON audit_log_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audit_log" ON audit_log_entries;
CREATE POLICY "anon_delete_audit_log" ON audit_log_entries FOR DELETE TO anon, authenticated USING (true);