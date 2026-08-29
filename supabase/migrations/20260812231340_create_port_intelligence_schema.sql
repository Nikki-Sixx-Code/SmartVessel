/*
# Port Inspection Intelligence & Officer Feedback

## Summary
Adds three new tables to power the "Port Inspection Intelligence" feature:
a directory of ports with risk scoring, officer post-inspection feedback
records, and per-port focus-area probability data. This is shared
operational data for the whole fleet office and crew — no sign-in screen,
so all policies grant access to `anon, authenticated`.

## 1. New Tables

### `ports`
Directory of major ports with inspection risk metadata.
- `id` (uuid, primary key)
- `name` (text) — e.g. "Port of Houston, USA"
- `country` (text) — e.g. "USA"
- `authority` (text) — inspecting body, e.g. "USCG", "Paris MOU"
- `risk_index` (integer) — 0-100, higher = more stringent
- `risk_label` (text) — e.g. "High Vetting Risk"
- `risk_description` (text) — short explanation
- `created_at` (timestamptz)

### `port_focus_areas`
Top probable inspection focus areas per port, with likelihood percentages.
- `id` (uuid, primary key)
- `port_id` (uuid, references ports)
- `area` (text) — e.g. "Oily Water Separator"
- `likelihood` (integer) — 0-100 percent
- `position` (integer) — display order
- `created_at` (timestamptz)

### `port_feedback`
Officer post-inspection feedback records, submitted after completing an
inspection. Anonymous-style attribution (rank + initial, not full names).
- `id` (uuid, primary key)
- `port_id` (uuid, references ports)
- `ship_id` (uuid, references ships)
- `inspector_authority` (text) — e.g. "USCG", "Paris MOU", "Tokyo MOU", "Vetting/SIRE 2.0"
- `focus_tags` (text[]) — multi-select tags for what was checked most strictly
- `outcome` (text) — 'passed', 'defects', or 'detention'
- `comments` (text) — officer notes
- `officer_label` (text) — anonymous label, e.g. "Capt. M."
- `created_at` (timestamptz)

## 2. Security
RLS enabled on all three tables. Because the app has no sign-in screen,
every policy grants `TO anon, authenticated` with `USING (true)` / `WITH
CHECK (true)` — this is intentionally shared operational data.

## 3. Seed Data
- 6 ports (Houston, Rotterdam, Singapore, Shanghai, Piraeus, Antwerp)
- 3 focus areas per port (18 rows total) with realistic likelihoods
- 4 sample officer feedback entries for Houston to populate the feed
*/

CREATE TABLE IF NOT EXISTS ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  authority text NOT NULL,
  risk_index integer NOT NULL DEFAULT 50,
  risk_label text NOT NULL DEFAULT 'Moderate Risk',
  risk_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS port_focus_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  port_id uuid NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  area text NOT NULL,
  likelihood integer NOT NULL DEFAULT 50,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS port_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  port_id uuid NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  ship_id uuid REFERENCES ships(id) ON DELETE SET NULL,
  inspector_authority text NOT NULL,
  focus_tags text[] NOT NULL DEFAULT '{}',
  outcome text NOT NULL DEFAULT 'passed',
  comments text NOT NULL DEFAULT '',
  officer_label text NOT NULL DEFAULT 'Anon.',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_port_focus_areas_port_id ON port_focus_areas(port_id);
CREATE INDEX IF NOT EXISTS idx_port_feedback_port_id ON port_feedback(port_id);
CREATE INDEX IF NOT EXISTS idx_port_feedback_created_at ON port_feedback(created_at DESC);

ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ports" ON ports;
CREATE POLICY "anon_select_ports" ON ports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ports" ON ports;
CREATE POLICY "anon_insert_ports" ON ports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ports" ON ports;
CREATE POLICY "anon_update_ports" ON ports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ports" ON ports;
CREATE POLICY "anon_delete_ports" ON ports FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_port_focus_areas" ON port_focus_areas;
CREATE POLICY "anon_select_port_focus_areas" ON port_focus_areas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_port_focus_areas" ON port_focus_areas;
CREATE POLICY "anon_insert_port_focus_areas" ON port_focus_areas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_port_focus_areas" ON port_focus_areas;
CREATE POLICY "anon_update_port_focus_areas" ON port_focus_areas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_port_focus_areas" ON port_focus_areas;
CREATE POLICY "anon_delete_port_focus_areas" ON port_focus_areas FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_port_feedback" ON port_feedback;
CREATE POLICY "anon_select_port_feedback" ON port_feedback FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_port_feedback" ON port_feedback;
CREATE POLICY "anon_insert_port_feedback" ON port_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_port_feedback" ON port_feedback;
CREATE POLICY "anon_update_port_feedback" ON port_feedback FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_port_feedback" ON port_feedback;
CREATE POLICY "anon_delete_port_feedback" ON port_feedback FOR DELETE TO anon, authenticated USING (true);

-- Seed ports
INSERT INTO ports (name, country, authority, risk_index, risk_label, risk_description) VALUES
  ('Port of Houston, USA', 'USA', 'USCG', 92, 'High Vetting Risk', 'USCG focuses heavily on environmental equipment and OWS records. Expect detailed bilge/ballast log review.'),
  ('Port of Rotterdam, Netherlands', 'Netherlands', 'Paris MOU', 78, 'Moderate-High Risk', 'Paris MOU inspectors target lifeboats, fire dampers, and garbage records. Thorough but predictable.'),
  ('Port of Singapore, Singapore', 'Singapore', 'Tokyo MOU', 85, 'High Risk', 'Tokyo MOU port state control with strong emphasis on ECDIS, passage plans, and emergency drills.'),
  ('Port of Shanghai, China', 'China', 'Tokyo MOU', 88, 'High Risk', 'Strict Tokyo MOU inspections. ECDIS updates and fuel sulphur logs frequently checked.'),
  ('Port of Piraeus, Greece', 'Greece', 'Paris MOU', 65, 'Moderate Risk', 'Paris MOU with focus on SMS documentation and crew certification. Generally efficient inspections.'),
  ('Port of Antwerp, Belgium', 'Belgium', 'Paris MOU', 72, 'Moderate-High Risk', 'Paris MOU inspections with emphasis on fire fighting systems and quick-closing valves.')
ON CONFLICT DO NOTHING;

-- Seed focus areas for Houston
INSERT INTO port_focus_areas (port_id, area, likelihood, position)
SELECT p.id, x.area, x.likelihood, x.position
FROM ports p
JOIN (VALUES
  ('Oily Water Separator (OWS) overboard valve seal & 15ppm alarm test', 88, 0),
  ('Ballast Water Management Plan & record book', 75, 1),
  ('Emergency Fire Pump pressure test at hydrants', 60, 2)
) AS x(area, likelihood, position)
ON p.name = 'Port of Houston, USA'
ON CONFLICT DO NOTHING;

-- Seed focus areas for Rotterdam
INSERT INTO port_focus_areas (port_id, area, likelihood, position)
SELECT p.id, x.area, x.likelihood, x.position
FROM ports p
JOIN (VALUES
  ('Lifeboat engine start & propulsion test', 82, 0),
  ('Fire dampers & engine room skylight sealing', 70, 1),
  ('Garbage Record Book & Annex V compliance', 65, 2)
) AS x(area, likelihood, position)
ON p.name = 'Port of Rotterdam, Netherlands'
ON CONFLICT DO NOTHING;

-- Seed focus areas for Singapore
INSERT INTO port_focus_areas (port_id, area, likelihood, position)
SELECT p.id, x.area, x.likelihood, x.position
FROM ports p
JOIN (VALUES
  ('ECDIS update & passage plan approval by Master', 90, 0),
  ('Emergency generator auto-start on load test', 78, 1),
  ('Steering gear dual pump & emergency steering test', 68, 2)
) AS x(area, likelihood, position)
ON p.name = 'Port of Singapore, Singapore'
ON CONFLICT DO NOTHING;

-- Seed focus areas for Shanghai
INSERT INTO port_focus_areas (port_id, area, likelihood, position)
SELECT p.id, x.area, x.likelihood, x.position
FROM ports p
JOIN (VALUES
  ('ECDIS Notice to Mariners & backup arrangement', 85, 0),
  ('Fuel sulphur content logs (MARPOL Annex VI)', 80, 1),
  ('Quick closing valves fuel tank operation test', 62, 2)
) AS x(area, likelihood, position)
ON p.name = 'Port of Shanghai, China'
ON CONFLICT DO NOTHING;

-- Seed focus areas for Piraeus
INSERT INTO port_focus_areas (port_id, area, likelihood, position)
SELECT p.id, x.area, x.likelihood, x.position
FROM ports p
JOIN (VALUES
  ('SMS documentation & crew certification review', 72, 0),
  ('Fire detection system & smoke detector log', 58, 1),
  ('Bridge navigation equipment test log', 50, 2)
) AS x(area, likelihood, position)
ON p.name = 'Port of Piraeus, Greece'
ON CONFLICT DO NOTHING;

-- Seed focus areas for Antwerp
INSERT INTO port_focus_areas (port_id, area, likelihood, position)
SELECT p.id, x.area, x.likelihood, x.position
FROM ports p
JOIN (VALUES
  ('Fixed fire fighting CO2 system inspection', 76, 0),
  ('Quick closing valves & fuel tank isolation', 68, 1),
  ('Emergency fire pump & water mist system', 55, 2)
) AS x(area, likelihood, position)
ON p.name = 'Port of Antwerp, Belgium'
ON CONFLICT DO NOTHING;

-- Seed sample officer feedback for Houston
INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'USCG', ARRAY['OWS & Bilge Record Book', 'Emergency Generator & Fire Pumps'], 'defects',
  'Inspector in Houston checked OWS overboard valve seal twice and asked for 3 months of maintenance logs. Had the 15ppm alarm test kit ready on the workbench — that saved us.',
  'Capt. M.'
FROM ports p, ships s
WHERE p.name = 'Port of Houston, USA' AND s.imo = '9876543'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'USCG', ARRAY['OWS & Bilge Record Book', 'ECDIS & passage plans'], 'passed',
  'USCG boarded at Houston. Very thorough on OWS — tested the 15ppm alarm and checked the bilge water record book line by line. ECDIS backup arrangement was also verified.',
  'Ch. Off. K.'
FROM ports p, ships s
WHERE p.name = 'Port of Houston, USA' AND s.imo = '9765432'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'USCG', ARRAY['OWS & Bilge Record Book', 'Lifeboat Drills & Quick Closing Valves'], 'detention',
  'Houston USCG detained us for 3 days. OWS overboard valve seal was not logged as checked in 2 weeks. Quick closing valve on FO tank was seized. Bring spare seals and test QCVs before arrival.',
  '2nd Eng. R.'
FROM ports p, ships s
WHERE p.name = 'Port of Houston, USA' AND s.imo = '9654321'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'USCG', ARRAY['Emergency Generator & Fire Pumps', 'Garbage & Scrubber Logs'], 'passed',
  'Smooth inspection. USCG focused on emergency generator auto-start and fire pump pressure. Garbage log was checked for last port of call. Have everything labeled and ready.',
  'Capt. T.'
FROM ports p, ships s
WHERE p.name = 'Port of Houston, USA' AND s.imo = '9543210'
ON CONFLICT DO NOTHING;
