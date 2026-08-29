/*
# Fleet Management — Vessel-Specific & Area-Specific Checklists

## Summary
Adds two new ships (M/V Triton, C/V Nereus) to the fleet roster and creates
two new tables for fleet-level checklists: a catalog of checklist templates
(SMS base + special area) and per-vessel checklist item responses with
offline sync tracking. This is shared operational data — no sign-in screen,
so all policies grant `TO anon, authenticated`.

## 1. New Ships
- M/V TRITON (IMO 9432100) — Container, North Sea/Baltic ECA
- C/V NEREUS (IMO 9321000) — Container, Polar / Arctic route

## 2. New Tables

### `fleet_checklist_templates`
Catalog of checklist templates, either SMS base (standard for all fleet
vessels) or special-area/voyage-specific (triggered by deployment/route).
- `id` (uuid, primary key)
- `key` (text, unique) — stable identifier, e.g. "sms-pre-arrival"
- `title` (text)
- `category` (text) — 'sms' or 'special_area'
- `zone_tag` (text) — e.g. "SMS Standard", "USCG Specific", "ECA Special Area", "Polar Code"
- `applicable_zones` (text[]) — zones where this template is active; empty = all
- `items` (jsonb) — array of {key, question} objects
- `created_at` (timestamptz)

### `fleet_checklist_responses`
Per-vessel responses to checklist items, with offline sync state.
- `id` (uuid, primary key)
- `ship_id` (uuid, references ships)
- `template_key` (text) — references fleet_checklist_templates.key
- `item_key` (text) — stable key within the template
- `response` (text) — 'pass', 'fail', 'na', or null
- `signed_by` (text, nullable)
- `signed_at` (timestamptz, nullable)
- `sync_status` (text) — 'pending', 'synced' (default 'pending')
- `updated_at` (timestamptz)
- Unique on (ship_id, template_key, item_key)

## 3. Security
RLS enabled on both new tables. `TO anon, authenticated` with
`USING (true)` / `WITH CHECK (true)` — intentionally shared operational data.

## 4. Seed Data
- 6 checklist templates (3 SMS base + 3 special area)
- Each template has 4-5 items as JSONB
*/

-- Add new ships
INSERT INTO ships (name, imo, vessel_type, current_zone, online_status, starlink_status, compliance_rating, active_alerts, payload_kb_today)
VALUES
  ('M/V TRITON', '9432100', 'Container', 'North Sea / Baltic ECA', 'online', 'connected', 91, 1, 8.4),
  ('C/V NEREUS', '9321000', 'Container', 'Polar / Arctic Route', 'offline', 'pending', 87, 2, 0)
ON CONFLICT DO NOTHING;

-- Templates table
CREATE TABLE IF NOT EXISTS fleet_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  zone_tag text NOT NULL,
  applicable_zones text[] NOT NULL DEFAULT '{}',
  items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS fleet_checklist_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id uuid NOT NULL REFERENCES ships(id) ON DELETE CASCADE,
  template_key text NOT NULL,
  item_key text NOT NULL,
  response text,
  signed_by text,
  signed_at timestamptz,
  sync_status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ship_id, template_key, item_key)
);

CREATE INDEX IF NOT EXISTS idx_fleet_responses_ship_id ON fleet_checklist_responses(ship_id);
CREATE INDEX IF NOT EXISTS idx_fleet_responses_template ON fleet_checklist_responses(template_key);

ALTER TABLE fleet_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_checklist_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fleet_templates" ON fleet_checklist_templates;
CREATE POLICY "anon_select_fleet_templates" ON fleet_checklist_templates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fleet_templates" ON fleet_checklist_templates;
CREATE POLICY "anon_insert_fleet_templates" ON fleet_checklist_templates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fleet_templates" ON fleet_checklist_templates;
CREATE POLICY "anon_update_fleet_templates" ON fleet_checklist_templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fleet_templates" ON fleet_checklist_templates;
CREATE POLICY "anon_delete_fleet_templates" ON fleet_checklist_templates FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_fleet_responses" ON fleet_checklist_responses;
CREATE POLICY "anon_select_fleet_responses" ON fleet_checklist_responses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fleet_responses" ON fleet_checklist_responses;
CREATE POLICY "anon_insert_fleet_responses" ON fleet_checklist_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fleet_responses" ON fleet_checklist_responses;
CREATE POLICY "anon_update_fleet_responses" ON fleet_checklist_responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fleet_responses" ON fleet_checklist_responses;
CREATE POLICY "anon_delete_fleet_responses" ON fleet_checklist_responses FOR DELETE TO anon, authenticated USING (true);

-- Seed SMS base templates (applicable to all zones)
INSERT INTO fleet_checklist_templates (key, title, category, zone_tag, applicable_zones, items) VALUES
  ('sms-pre-arrival', 'Pre-Arrival Checklist (Port State Control Readiness)', 'sms', 'SMS Standard', '{}',
    '[{"key":"pa-1","question":"Crew list, certificates, and flag state documents ready for inspection?"},{"key":"pa-2","question":"Port State Control checklist reviewed and all items verified?"},{"key":"pa-3","question":"Garbage Record Book and Oil Record Book up to date and signed?"},{"key":"pa-4","question":"Emergency fire pump tested and delivering required pressure?"},{"key":"pa-5","question":"Lifeboat engines started and forward/astern propulsion verified?"}]'
  ),
  ('sms-pre-departure', 'Pre-Departure Checklist', 'sms', 'SMS Standard', '{}',
    '[{"key":"pd-1","question":"All mooring stations cleared and ready for letting go?"},{"key":"pd-2","question":"Main engine tested ahead and astern prior to departure?"},{"key":"pd-3","question":"Steering gear tested on both pumps and emergency steering verified?"},{"key":"pd-4","question":"VHF channels set to port operations and pilot station contacted?"}]'
  ),
  ('sms-daily-audits', 'Deck & Engine Daily Audits', 'sms', 'SMS Standard', '{}',
    '[{"key":"da-1","question":"Engine room round completed — no leaks, all temperatures normal?"},{"key":"da-2","question":"Deck patrol completed — all watertight doors secured?"},{"key":"da-3","question":"Bridge navigation equipment tested and operational?"},{"key":"da-4","question":"Fire detection system daily check logged?"}]'
  )
ON CONFLICT (key) DO NOTHING;

-- Seed special area templates
INSERT INTO fleet_checklist_templates (key, title, category, zone_tag, applicable_zones, items) VALUES
  ('uscg-us-waters', 'USCG / US Waters Supplement', 'special_area', 'USCG Specific',
    '{"US Gulf","US East Coast","US West Coast","US Waters"}',
    '[{"key":"uscg-1","question":"Vessel General Permit (VGP) compliance verified and signed?"},{"key":"uscg-2","question":"Ballast Water Management logging up to date per USCG requirements?"},{"key":"uscg-3","question":"USCG pre-entry notice (96h) submitted and confirmed?"},{"key":"uscg-4","question":"OWS 15ppm alarm and automatic stopping device tested and recorded?"},{"key":"uscg-5","question":"ECDIS updated with latest US Coast Guard Notice to Mariners?"}]'
  ),
  ('eca-seca-rules', 'ECA / SECA Area Rules', 'special_area', 'ECA Special Area',
    '{"North Sea / Baltic ECA","North Sea ECA","Baltic ECA","English Channel ECA"}',
    '[{"key":"eca-1","question":"Fuel changeover procedure completed and logged (low-sulphur ≤0.10%)?"},{"key":"eca-2","question":"Changeover calculator verified and changeover log entry signed?"},{"key":"eca-3","question":"Fuel oil quick sampling and sulphur content verification completed?"},{"key":"eca-4","question":"Exhaust gas cleaning system (scrubber) operational and washwater logs updated?"}]'
  ),
  ('polar-cold-weather', 'Polar Code / Cold Weather Protocol', 'special_area', 'Polar Code',
    '{"Polar / Arctic Route","Antarctic","Arctic"}',
    '[{"key":"pc-1","question":"Anti-icing checks completed — all deck machinery and containers de-iced?"},{"key":"pc-2","question":"Heating systems for deck and engine room pipes operational?"},{"key":"pc-3","question":"Polar Water Operational Manual (PWOM) reviewed and available?"},{"key":"pc-4","question":"Cold weather PPE issued to all deck crew and lifeboat survival kits checked?"},{"key":"pc-5","question":"Ice navigation lights and ice radar operational?"}]'
  )
ON CONFLICT (key) DO NOTHING;
