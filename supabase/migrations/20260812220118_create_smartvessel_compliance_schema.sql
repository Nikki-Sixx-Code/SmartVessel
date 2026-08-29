/*
# SmartVessel Compliance - core schema

## Summary
Creates the tables that back the SmartVessel Compliance fleet app: the fleet
roster, per-ship checklist tier completion tracking, and the engine-room
daily inspection records (with their individual pass/fail/n-a items). This
app has no login screen, so all data is treated as shared operational data
for the whole fleet office and crew, readable and writable by the anon key.

## 1. New Tables

### `ships`
Roster of vessels tracked by the fleet office.
- `id` (uuid, primary key)
- `name` (text) - vessel name, e.g. "M/V AEGEAN GLORY"
- `imo` (text) - IMO registry number
- `vessel_type` (text) - e.g. "Container", "Tanker"
- `current_zone` (text) - current geographic/regulatory zone, e.g. "Mediterranean Area"
- `online_status` (text) - 'online' or 'offline' (local sync state)
- `starlink_status` (text) - 'connected', 'pending', or 'offline'
- `last_sync_at` (timestamptz) - last time the vessel synced data ashore
- `compliance_rating` (integer) - 0-100 compliance score
- `active_alerts` (integer) - count of open alerts for this vessel
- `payload_kb_today` (numeric) - data payload sent today, in KB
- `created_at` (timestamptz)

### `ship_checklist_status`
Tracks completion state of each reference checklist item (organized in 4
tiers: security, MARPOL special area, port-specific, routine SMS) per ship.
The checklist item catalog itself lives in frontend config; this table only
stores the per-ship completion state so it persists across reloads.
- `id` (uuid, primary key)
- `ship_id` (uuid, references ships)
- `tier` (integer) - 1 to 4
- `item_key` (text) - stable key matching the frontend checklist item
- `status` (text) - 'pending', 'in_progress', or 'complete'
- `updated_at` (timestamptz)
- unique on (ship_id, item_key)

### `inspections`
A single inspection record (e.g. "Engine Room Daily Inspection") for a ship.
- `id` (uuid, primary key)
- `ship_id` (uuid, references ships)
- `title` (text)
- `status` (text) - 'draft' or 'submitted'
- `elapsed_seconds` (integer) - time spent filling out the form
- `signed_by` (text) - name of the signer
- `signature_confirmed` (boolean) - whether the signature pad was signed
- `submitted_at` (timestamptz, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### `inspection_items`
Individual checklist questions belonging to an inspection.
- `id` (uuid, primary key)
- `inspection_id` (uuid, references inspections)
- `position` (integer) - display order
- `question` (text)
- `response` (text, nullable) - 'pass', 'fail', or 'na'
- `has_photo` (boolean) - whether a defect photo was attached
- `photo_label` (text, nullable) - dummy file label, e.g. "defect_0847.jpg (188 KB)"
- `updated_at` (timestamptz)

## 2. Security
RLS is enabled on all four tables. Because this app has no sign-in screen,
every policy grants access `TO anon, authenticated` — this is intentionally
shared operational data, not per-user private data.
*/

CREATE TABLE IF NOT EXISTS ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  imo text NOT NULL,
  vessel_type text NOT NULL DEFAULT 'Vessel',
  current_zone text NOT NULL DEFAULT 'Unknown',
  online_status text NOT NULL DEFAULT 'online',
  starlink_status text NOT NULL DEFAULT 'pending',
  last_sync_at timestamptz NOT NULL DEFAULT now(),
  compliance_rating integer NOT NULL DEFAULT 100,
  active_alerts integer NOT NULL DEFAULT 0,
  payload_kb_today numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ship_checklist_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id uuid NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  tier integer NOT NULL,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ship_id, item_key)
);

CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id uuid NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  elapsed_seconds integer NOT NULL DEFAULT 0,
  signed_by text,
  signature_confirmed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  question text NOT NULL,
  response text,
  has_photo boolean NOT NULL DEFAULT false,
  photo_label text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ship_checklist_status_ship_id ON ship_checklist_status(ship_id);
CREATE INDEX IF NOT EXISTS idx_inspections_ship_id ON inspections(ship_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection_id ON inspection_items(inspection_id);

ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_checklist_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ships" ON ships;
CREATE POLICY "anon_select_ships" ON ships FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ships" ON ships;
CREATE POLICY "anon_insert_ships" ON ships FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ships" ON ships;
CREATE POLICY "anon_update_ships" ON ships FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ships" ON ships;
CREATE POLICY "anon_delete_ships" ON ships FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_ship_checklist_status" ON ship_checklist_status;
CREATE POLICY "anon_select_ship_checklist_status" ON ship_checklist_status FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ship_checklist_status" ON ship_checklist_status;
CREATE POLICY "anon_insert_ship_checklist_status" ON ship_checklist_status FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ship_checklist_status" ON ship_checklist_status;
CREATE POLICY "anon_update_ship_checklist_status" ON ship_checklist_status FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ship_checklist_status" ON ship_checklist_status;
CREATE POLICY "anon_delete_ship_checklist_status" ON ship_checklist_status FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_inspections" ON inspections;
CREATE POLICY "anon_select_inspections" ON inspections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inspections" ON inspections;
CREATE POLICY "anon_insert_inspections" ON inspections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inspections" ON inspections;
CREATE POLICY "anon_update_inspections" ON inspections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inspections" ON inspections;
CREATE POLICY "anon_delete_inspections" ON inspections FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_inspection_items" ON inspection_items;
CREATE POLICY "anon_select_inspection_items" ON inspection_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inspection_items" ON inspection_items;
CREATE POLICY "anon_insert_inspection_items" ON inspection_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inspection_items" ON inspection_items;
CREATE POLICY "anon_update_inspection_items" ON inspection_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inspection_items" ON inspection_items;
CREATE POLICY "anon_delete_inspection_items" ON inspection_items FOR DELETE TO anon, authenticated USING (true);
