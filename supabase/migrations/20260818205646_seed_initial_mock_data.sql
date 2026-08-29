/*
# Seed Initial Mock Data
Fills all tables with realistic mock data so every screen shows complete
information. Uses ON CONFLICT DO NOTHING to avoid duplicating existing rows.
*/

-- ============================================================
-- 1. Port Feedback for Rotterdam, Singapore, Shanghai, Antwerp
-- ============================================================

-- Rotterdam feedback
INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['Lifeboat Drills', 'Fire Dampers'], 'passed',
  'Rotterdam PSC was thorough but fair. Inspector focused on lifeboat engine start and fire damper operation. Had all maintenance records ready — smooth inspection.',
  'Capt. L.'
FROM ports p, ships s
WHERE p.name = 'Port of Rotterdam, Netherlands' AND s.imo = '9876543'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['Fire Dampers', 'Garbage Record Book'], 'defects',
  'Paris MOU issued defects for a seized fire damper on the engine room skylight. Also checked Garbage Record Book Annex V entries for the last 3 ports. Fix dampers before arrival.',
  'Ch. Off. D.'
FROM ports p, ships s
WHERE p.name = 'Port of Rotterdam, Netherlands' AND s.imo = '9765432'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['Lifeboat Drills', 'Emergency Fire Pump'], 'passed',
  'Efficient Paris MOU inspection. Lifeboat engine started on first try, fire pump delivered 8 bar at the hydrant. Inspector was professional and quick.',
  '2nd Eng. P.'
FROM ports p, ships s
WHERE p.name = 'Port of Rotterdam, Netherlands' AND s.imo = '9432100'
ON CONFLICT DO NOTHING;

-- Singapore feedback
INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Tokyo MOU', ARRAY['ECDIS & passage plans', 'Emergency Generator'], 'defects',
  'Tokyo MOU in Singapore checked ECDIS update status and found we were 2 weeks behind on ENC updates. Also tested emergency generator auto-start — it failed on first attempt. Rectified both before departure.',
  'Capt. S.'
FROM ports p, ships s
WHERE p.name = 'Port of Singapore, Singapore' AND s.imo = '9876543'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Tokyo MOU', ARRAY['ECDIS & passage plans', 'Steering Gear'], 'passed',
  'Singapore Tokyo MOU inspection went well. ECDIS was fully updated, passage plan approved by Master. Steering gear dual pump test passed. Inspector was very organized.',
  'Ch. Off. M.'
FROM ports p, ships s
WHERE p.name = 'Port of Singapore, Singapore' AND s.imo = '9543210'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Tokyo MOU', ARRAY['Emergency Generator', 'Steering Gear'], 'detention',
  'Detained in Singapore for 2 days. Emergency generator failed to auto-start on load test — battery voltage was too low. Steering gear emergency control was also stiff. Test both before arrival.',
  '2nd Eng. T.'
FROM ports p, ships s
WHERE p.name = 'Port of Singapore, Singapore' AND s.imo = '9654321'
ON CONFLICT DO NOTHING;

-- Shanghai feedback
INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Tokyo MOU', ARRAY['ECDIS Updates', 'Fuel Sulphur Logs'], 'passed',
  'Shanghai inspection was strict but fair. ECDIS Notices to Mariners were up to date. Fuel sulphur logs checked for the last bunker batch — had the BDN ready. No issues.',
  'Capt. R.'
FROM ports p, ships s
WHERE p.name = 'Port of Shanghai, China' AND s.imo = '9876543'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Tokyo MOU', ARRAY['Fuel Sulphur Logs', 'Quick Closing Valves'], 'defects',
  'Shanghai PSC found a quick closing valve on the FO tank was not operating freely. Also checked fuel sulphur content logs in detail — bring the lab analysis report. Defect rectified before departure.',
  'Ch. Eng. B.'
FROM ports p, ships s
WHERE p.name = 'Port of Shanghai, China' AND s.imo = '9765432'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Tokyo MOU', ARRAY['ECDIS Updates', 'Quick Closing Valves'], 'passed',
  'Smooth Shanghai inspection. ECDIS backup arrangement verified, all ENC cells updated. Quick closing valves tested and all operational. Inspector was efficient.',
  '2nd Off. K.'
FROM ports p, ships s
WHERE p.name = 'Port of Shanghai, China' AND s.imo = '9432100'
ON CONFLICT DO NOTHING;

-- Antwerp feedback
INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['CO2 System', 'Quick Closing Valves'], 'passed',
  'Antwerp inspection focused on the fixed CO2 fire fighting system and quick closing valves. Both tested satisfactorily. Inspector was knowledgeable and professional.',
  'Capt. N.'
FROM ports p, ships s
WHERE p.name = 'Port of Antwerp, Belgium' AND s.imo = '9876543'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['CO2 System', 'Emergency Fire Pump'], 'defects',
  'Paris MOU in Antwerp issued defects — emergency fire pump could not maintain pressure at the hydrant. CO2 system inspection was fine. Had to replace the pump impeller before departure.',
  'Ch. Eng. V.'
FROM ports p, ships s
WHERE p.name = 'Port of Antwerp, Belgium' AND s.imo = '9654321'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['Quick Closing Valves', 'Water Mist System'], 'passed',
  'Antwerp PSC was thorough. Quick closing valves all tested and operational. Water mist system tested in the engine room. No defects issued.',
  '2nd Eng. F.'
FROM ports p, ships s
WHERE p.name = 'Port of Antwerp, Belgium' AND s.imo = '9432100'
ON CONFLICT DO NOTHING;

-- Additional Piraeus feedback
INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['SMS Documentation', 'Crew Certification'], 'passed',
  'Piraeus PSC was quick and efficient. SMS documentation reviewed, crew certificates all in order. Inspector focused on STCW compliance and rest hour logs.',
  'Capt. G.'
FROM ports p, ships s
WHERE p.name = 'Port of Piraeus, Greece' AND s.imo = '9876543'
ON CONFLICT DO NOTHING;

INSERT INTO port_feedback (port_id, ship_id, inspector_authority, focus_tags, outcome, comments, officer_label)
SELECT p.id, s.id, 'Paris MOU', ARRAY['Fire Detection System', 'Navigation Equipment'], 'defects',
  'Piraeus inspector found a faulty smoke detector in the cargo control room. Also tested bridge navigation equipment — radar performance was marginal. Both rectified before sailing.',
  'Ch. Off. A.'
FROM ports p, ships s
WHERE p.name = 'Port of Piraeus, Greece' AND s.imo = '9765432'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Ship Checklist Status — fill gaps for all ships
-- ============================================================

-- AEGEAN GLORY tier 3 (Port Specific USCG)
INSERT INTO ship_checklist_status (ship_id, tier, item_key, status)
SELECT s.id, 3, x.item_key, x.status
FROM ships s
JOIN (VALUES
  ('port-1', 'complete'),
  ('port-2', 'complete'),
  ('port-3', 'in_progress'),
  ('port-4', 'pending')
) AS x(item_key, status)
ON s.imo = '9876543'
ON CONFLICT (ship_id, item_key) DO NOTHING;

-- M/T POSEIDON — all 4 tiers
INSERT INTO ship_checklist_status (ship_id, tier, item_key, status)
SELECT s.id, x.tier, x.item_key, x.status
FROM ships s
JOIN (VALUES
  (1, 'sec-1', 'complete'), (1, 'sec-2', 'complete'), (1, 'sec-3', 'complete'), (1, 'sec-4', 'complete'),
  (2, 'marpol-1', 'complete'), (2, 'marpol-2', 'complete'), (2, 'marpol-3', 'in_progress'), (2, 'marpol-4', 'pending'),
  (3, 'port-1', 'complete'), (3, 'port-2', 'complete'), (3, 'port-3', 'complete'), (3, 'port-4', 'complete'),
  (4, 'sms-1', 'complete'), (4, 'sms-2', 'complete'), (4, 'sms-3', 'in_progress'), (4, 'sms-4', 'pending')
) AS x(tier, item_key, status)
ON s.imo = '9765432'
ON CONFLICT (ship_id, item_key) DO NOTHING;

-- M/T TITAN — all 4 tiers
INSERT INTO ship_checklist_status (ship_id, tier, item_key, status)
SELECT s.id, x.tier, x.item_key, x.status
FROM ships s
JOIN (VALUES
  (1, 'sec-1', 'complete'), (1, 'sec-2', 'complete'), (1, 'sec-3', 'complete'), (1, 'sec-4', 'complete'),
  (2, 'marpol-1', 'complete'), (2, 'marpol-2', 'complete'), (2, 'marpol-3', 'complete'), (2, 'marpol-4', 'complete'),
  (3, 'port-1', 'pending'), (3, 'port-2', 'pending'), (3, 'port-3', 'pending'), (3, 'port-4', 'pending'),
  (4, 'sms-1', 'complete'), (4, 'sms-2', 'complete'), (4, 'sms-3', 'complete'), (4, 'sms-4', 'complete')
) AS x(tier, item_key, status)
ON s.imo = '9543210'
ON CONFLICT (ship_id, item_key) DO NOTHING;

-- M/V ATLANTIC — all 4 tiers
INSERT INTO ship_checklist_status (ship_id, tier, item_key, status)
SELECT s.id, x.tier, x.item_key, x.status
FROM ships s
JOIN (VALUES
  (1, 'sec-1', 'complete'), (1, 'sec-2', 'in_progress'), (1, 'sec-3', 'complete'), (1, 'sec-4', 'pending'),
  (2, 'marpol-1', 'in_progress'), (2, 'marpol-2', 'pending'), (2, 'marpol-3', 'pending'), (2, 'marpol-4', 'pending'),
  (3, 'port-1', 'pending'), (3, 'port-2', 'pending'), (3, 'port-3', 'pending'), (3, 'port-4', 'pending'),
  (4, 'sms-1', 'complete'), (4, 'sms-2', 'in_progress'), (4, 'sms-3', 'pending'), (4, 'sms-4', 'pending')
) AS x(tier, item_key, status)
ON s.imo = '9654321'
ON CONFLICT (ship_id, item_key) DO NOTHING;

-- M/V TRITON — all 4 tiers
INSERT INTO ship_checklist_status (ship_id, tier, item_key, status)
SELECT s.id, x.tier, x.item_key, x.status
FROM ships s
JOIN (VALUES
  (1, 'sec-1', 'complete'), (1, 'sec-2', 'complete'), (1, 'sec-3', 'complete'), (1, 'sec-4', 'complete'),
  (2, 'marpol-1', 'complete'), (2, 'marpol-2', 'complete'), (2, 'marpol-3', 'complete'), (2, 'marpol-4', 'complete'),
  (3, 'port-1', 'pending'), (3, 'port-2', 'pending'), (3, 'port-3', 'pending'), (3, 'port-4', 'pending'),
  (4, 'sms-1', 'complete'), (4, 'sms-2', 'complete'), (4, 'sms-3', 'complete'), (4, 'sms-4', 'in_progress')
) AS x(tier, item_key, status)
ON s.imo = '9432100'
ON CONFLICT (ship_id, item_key) DO NOTHING;

-- C/V NEREUS — all 4 tiers
INSERT INTO ship_checklist_status (ship_id, tier, item_key, status)
SELECT s.id, x.tier, x.item_key, x.status
FROM ships s
JOIN (VALUES
  (1, 'sec-1', 'in_progress'), (1, 'sec-2', 'pending'), (1, 'sec-3', 'in_progress'), (1, 'sec-4', 'pending'),
  (2, 'marpol-1', 'pending'), (2, 'marpol-2', 'pending'), (2, 'marpol-3', 'pending'), (2, 'marpol-4', 'pending'),
  (3, 'port-1', 'pending'), (3, 'port-2', 'pending'), (3, 'port-3', 'pending'), (3, 'port-4', 'pending'),
  (4, 'sms-1', 'complete'), (4, 'sms-2', 'in_progress'), (4, 'sms-3', 'pending'), (4, 'sms-4', 'pending')
) AS x(tier, item_key, status)
ON s.imo = '9321000'
ON CONFLICT (ship_id, item_key) DO NOTHING;

-- ============================================================
-- 3. Fleet Checklist Responses
-- ============================================================

-- M/V AEGEAN GLORY
INSERT INTO fleet_checklist_responses (ship_id, template_key, item_key, response, signed_by, signed_at, sync_status)
SELECT s.id, x.template_key, x.item_key, x.response, x.signed_by, x.signed_at::timestamptz, x.sync_status
FROM ships s
JOIN (VALUES
  ('sms-pre-arrival', 'pa-1', 'pass', 'Capt. G. Papadopoulos', '2026-08-15T08:30:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-2', 'pass', 'Capt. G. Papadopoulos', '2026-08-15T08:30:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-3', 'pass', 'Capt. G. Papadopoulos', '2026-08-15T08:30:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-4', 'pass', 'Capt. G. Papadopoulos', '2026-08-15T08:30:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-5', 'na', 'Capt. G. Papadopoulos', '2026-08-15T08:30:00Z', 'synced'),
  ('sms-pre-departure', 'pd-1', 'pass', 'Ch. Off. K. Vlachos', '2026-08-16T14:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-2', 'pass', 'Ch. Off. K. Vlachos', '2026-08-16T14:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-3', 'pass', 'Ch. Off. K. Vlachos', '2026-08-16T14:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-4', 'pass', 'Ch. Off. K. Vlachos', '2026-08-16T14:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-1', 'pass', 'Ch. Eng. S. Antoniou', '2026-08-18T06:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-2', 'pass', 'Ch. Eng. S. Antoniou', '2026-08-18T06:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-3', 'pass', 'Ch. Eng. S. Antoniou', '2026-08-18T06:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-4', 'pass', 'Ch. Eng. S. Antoniou', '2026-08-18T06:00:00Z', 'pending')
) AS x(template_key, item_key, response, signed_by, signed_at, sync_status)
ON s.imo = '9876543'
ON CONFLICT (ship_id, template_key, item_key) DO NOTHING;

-- M/T POSEIDON
INSERT INTO fleet_checklist_responses (ship_id, template_key, item_key, response, signed_by, signed_at, sync_status)
SELECT s.id, x.template_key, x.item_key, x.response, x.signed_by, x.signed_at::timestamptz, x.sync_status
FROM ships s
JOIN (VALUES
  ('sms-pre-arrival', 'pa-1', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-2', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-3', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-4', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-5', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-1', 'pass', 'Ch. Off. D. Ioannou', '2026-08-15T12:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-2', 'pass', 'Ch. Off. D. Ioannou', '2026-08-15T12:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-3', 'fail', 'Ch. Off. D. Ioannou', '2026-08-15T12:00:00Z', 'pending'),
  ('sms-pre-departure', 'pd-4', 'pass', 'Ch. Off. D. Ioannou', '2026-08-15T12:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-1', 'pass', '2nd Eng. R. Costa', '2026-08-18T05:30:00Z', 'pending'),
  ('sms-daily-audits', 'da-2', 'pass', '2nd Eng. R. Costa', '2026-08-18T05:30:00Z', 'pending'),
  ('sms-daily-audits', 'da-3', 'pass', '2nd Eng. R. Costa', '2026-08-18T05:30:00Z', 'pending'),
  ('sms-daily-audits', 'da-4', 'fail', '2nd Eng. R. Costa', '2026-08-18T05:30:00Z', 'pending'),
  ('uscg-us-waters', 'uscg-1', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('uscg-us-waters', 'uscg-2', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('uscg-us-waters', 'uscg-3', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('uscg-us-waters', 'uscg-4', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced'),
  ('uscg-us-waters', 'uscg-5', 'pass', 'Capt. M. Stavrou', '2026-08-14T07:00:00Z', 'synced')
) AS x(template_key, item_key, response, signed_by, signed_at, sync_status)
ON s.imo = '9765432'
ON CONFLICT (ship_id, template_key, item_key) DO NOTHING;

-- M/T TITAN
INSERT INTO fleet_checklist_responses (ship_id, template_key, item_key, response, signed_by, signed_at, sync_status)
SELECT s.id, x.template_key, x.item_key, x.response, x.signed_by, x.signed_at::timestamptz, x.sync_status
FROM ships s
JOIN (VALUES
  ('sms-pre-arrival', 'pa-1', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-2', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-3', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-4', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-5', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-1', 'pass', 'Ch. Off. P. Dimitriou', '2026-08-14T10:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-2', 'pass', 'Ch. Off. P. Dimitriou', '2026-08-14T10:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-3', 'pass', 'Ch. Off. P. Dimitriou', '2026-08-14T10:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-4', 'pass', 'Ch. Off. P. Dimitriou', '2026-08-14T10:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-1', 'pass', 'Ch. Eng. V. Efstathiou', '2026-08-18T04:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-2', 'pass', 'Ch. Eng. V. Efstathiou', '2026-08-18T04:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-3', 'pass', 'Ch. Eng. V. Efstathiou', '2026-08-18T04:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-4', 'pass', 'Ch. Eng. V. Efstathiou', '2026-08-18T04:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-1', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-2', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-3', 'pass', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-4', 'na', 'Capt. T. Nikolaidis', '2026-08-13T09:00:00Z', 'synced')
) AS x(template_key, item_key, response, signed_by, signed_at, sync_status)
ON s.imo = '9543210'
ON CONFLICT (ship_id, template_key, item_key) DO NOTHING;

-- M/V ATLANTIC
INSERT INTO fleet_checklist_responses (ship_id, template_key, item_key, response, signed_by, signed_at, sync_status)
SELECT s.id, x.template_key, x.item_key, x.response, x.signed_by, x.signed_at::timestamptz, x.sync_status
FROM ships s
JOIN (VALUES
  ('sms-pre-arrival', 'pa-1', 'pass', 'Capt. A. Georgiou', '2026-08-12T06:00:00Z', 'pending'),
  ('sms-pre-arrival', 'pa-2', 'pass', 'Capt. A. Georgiou', '2026-08-12T06:00:00Z', 'pending'),
  ('sms-pre-arrival', 'pa-3', 'pass', 'Capt. A. Georgiou', '2026-08-12T06:00:00Z', 'pending'),
  ('sms-pre-arrival', 'pa-4', 'fail', 'Capt. A. Georgiou', '2026-08-12T06:00:00Z', 'pending'),
  ('sms-pre-arrival', 'pa-5', 'pass', 'Capt. A. Georgiou', '2026-08-12T06:00:00Z', 'pending'),
  ('sms-pre-departure', 'pd-1', 'pass', 'Ch. Off. R. Pappas', '2026-08-13T11:00:00Z', 'pending'),
  ('sms-pre-departure', 'pd-2', 'pass', 'Ch. Off. R. Pappas', '2026-08-13T11:00:00Z', 'pending'),
  ('sms-pre-departure', 'pd-3', 'pass', 'Ch. Off. R. Pappas', '2026-08-13T11:00:00Z', 'pending'),
  ('sms-pre-departure', 'pd-4', 'na', 'Ch. Off. R. Pappas', '2026-08-13T11:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-1', 'pass', '2nd Eng. F. Makris', '2026-08-18T03:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-2', 'pass', '2nd Eng. F. Makris', '2026-08-18T03:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-3', 'fail', '2nd Eng. F. Makris', '2026-08-18T03:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-4', 'pass', '2nd Eng. F. Makris', '2026-08-18T03:00:00Z', 'pending')
) AS x(template_key, item_key, response, signed_by, signed_at, sync_status)
ON s.imo = '9654321'
ON CONFLICT (ship_id, template_key, item_key) DO NOTHING;

-- M/V TRITON
INSERT INTO fleet_checklist_responses (ship_id, template_key, item_key, response, signed_by, signed_at, sync_status)
SELECT s.id, x.template_key, x.item_key, x.response, x.signed_by, x.signed_at::timestamptz, x.sync_status
FROM ships s
JOIN (VALUES
  ('sms-pre-arrival', 'pa-1', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-2', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-3', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-4', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('sms-pre-arrival', 'pa-5', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-1', 'pass', 'Ch. Off. N. Vlachos', '2026-08-16T13:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-2', 'pass', 'Ch. Off. N. Vlachos', '2026-08-16T13:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-3', 'pass', 'Ch. Off. N. Vlachos', '2026-08-16T13:00:00Z', 'synced'),
  ('sms-pre-departure', 'pd-4', 'pass', 'Ch. Off. N. Vlachos', '2026-08-16T13:00:00Z', 'synced'),
  ('sms-daily-audits', 'da-1', 'pass', 'Ch. Eng. K. Rouvas', '2026-08-18T05:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-2', 'pass', 'Ch. Eng. K. Rouvas', '2026-08-18T05:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-3', 'pass', 'Ch. Eng. K. Rouvas', '2026-08-18T05:00:00Z', 'pending'),
  ('sms-daily-audits', 'da-4', 'pass', 'Ch. Eng. K. Rouvas', '2026-08-18T05:00:00Z', 'pending'),
  ('eca-seca-rules', 'eca-1', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-2', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-3', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced'),
  ('eca-seca-rules', 'eca-4', 'pass', 'Capt. L. Efstathiou', '2026-08-15T08:00:00Z', 'synced')
) AS x(template_key, item_key, response, signed_by, signed_at, sync_status)
ON s.imo = '9432100'
ON CONFLICT (ship_id, template_key, item_key) DO NOTHING;

-- C/V NEREUS — add Polar Code responses
INSERT INTO fleet_checklist_responses (ship_id, template_key, item_key, response, signed_by, signed_at, sync_status)
SELECT s.id, x.template_key, x.item_key, x.response, x.signed_by, x.signed_at::timestamptz, x.sync_status
FROM ships s
JOIN (VALUES
  ('polar-cold-weather', 'pc-1', 'pass', 'Capt. E. Sokolov', '2026-08-14T09:00:00Z', 'pending'),
  ('polar-cold-weather', 'pc-2', 'pass', 'Capt. E. Sokolov', '2026-08-14T09:00:00Z', 'pending'),
  ('polar-cold-weather', 'pc-3', 'pass', 'Capt. E. Sokolov', '2026-08-14T09:00:00Z', 'pending'),
  ('polar-cold-weather', 'pc-4', 'fail', 'Capt. E. Sokolov', '2026-08-14T09:00:00Z', 'pending'),
  ('polar-cold-weather', 'pc-5', 'pass', 'Capt. E. Sokolov', '2026-08-14T09:00:00Z', 'pending')
) AS x(template_key, item_key, response, signed_by, signed_at, sync_status)
ON s.imo = '9321000'
ON CONFLICT (ship_id, template_key, item_key) DO NOTHING;

-- ============================================================
-- 4. Inspections + Inspection Items for ships missing them
-- ============================================================

-- M/T POSEIDON — Engine Room Daily Inspection (submitted)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed, submitted_at)
SELECT s.id, 'Engine Room Daily Inspection', 'submitted', 420, 'Ch. Eng. S. Antoniou', true, '2026-08-17T06:30:00Z'
FROM ships s WHERE s.imo = '9765432' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'Engine Room Daily Inspection'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Oily Water Separator (OWS) overboard valve sealed & locked?', 'pass', false, NULL::text),
  (1, 'Main Engine Bilge level normal?', 'pass', false, NULL::text),
  (2, 'Auxiliary Generator #1 fuel pressure within limits?', 'pass', false, NULL::text),
  (3, 'Emergency Fire Pump tested and operational?', 'pass', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9765432')
  AND i.title = 'Engine Room Daily Inspection'
  AND i.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;

-- M/T POSEIDON — USCG Foreign Vessel Pre-Arrival (draft)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed)
SELECT s.id, 'USCG Foreign Vessel Pre-Arrival', 'draft', 180, NULL, false
FROM ships s WHERE s.imo = '9765432' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'USCG Foreign Vessel Pre-Arrival'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Oily Water Separator (OWS) 15ppm alarm and automatic stopping device tested and operational?', 'pass', false, NULL::text),
  (1, 'Ballast Water Management Record Book updated and USCG Report submitted?', 'pass', false, NULL::text),
  (2, 'ECDIS primary and back-up systems updated with latest Notice to Mariners?', 'pass', false, NULL::text),
  (3, 'Quick Closing Valves for Engine Room fuel tanks tested and free in operation?', 'fail', true, 'defect_qcv_3421.jpg (188 KB)'),
  (4, 'Fixed Fire Fighting System (CO2 / Local Water Mist) inspected and ready?', 'pass', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9765432')
  AND i.title = 'USCG Foreign Vessel Pre-Arrival'
  AND i.status = 'draft'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;

-- M/T TITAN — Engine Room Daily Inspection (submitted)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed, submitted_at)
SELECT s.id, 'Engine Room Daily Inspection', 'submitted', 360, 'Ch. Eng. V. Efstathiou', true, '2026-08-18T04:15:00Z'
FROM ships s WHERE s.imo = '9543210' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'Engine Room Daily Inspection'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Oily Water Separator (OWS) overboard valve sealed & locked?', 'pass', false, NULL::text),
  (1, 'Main Engine Bilge level normal?', 'pass', false, NULL::text),
  (2, 'Auxiliary Generator #1 fuel pressure within limits?', 'pass', false, NULL::text),
  (3, 'Emergency Fire Pump tested and operational?', 'pass', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9543210')
  AND i.title = 'Engine Room Daily Inspection'
  AND i.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;

-- M/T TITAN — Paris MOU Port State Control (submitted)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed, submitted_at)
SELECT s.id, 'Paris MOU Port State Control', 'submitted', 900, 'Capt. T. Nikolaidis', true, '2026-08-13T10:00:00Z'
FROM ships s WHERE s.imo = '9543210' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'Paris MOU Port State Control'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Emergency Generator tested on load and automatic start operational?', 'pass', false, NULL::text),
  (1, 'Lifeboat engine started, forward/astern propulsion and steering verified?', 'pass', false, NULL::text),
  (2, 'Emergency Fire Pump tested and delivering required pressure to hydrants?', 'pass', false, NULL::text),
  (3, 'Garbage Record Book updated and Annex V discharge limits verified?', 'pass', false, NULL::text),
  (4, 'Fire dampers and engine room skylights operational and sealing tightly?', 'pass', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9543210')
  AND i.title = 'Paris MOU Port State Control'
  AND i.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;

-- M/V ATLANTIC — Engine Room Daily Inspection (draft)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed)
SELECT s.id, 'Engine Room Daily Inspection', 'draft', 120, NULL, false
FROM ships s WHERE s.imo = '9654321' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'Engine Room Daily Inspection'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Oily Water Separator (OWS) overboard valve sealed & locked?', 'pass', false, NULL::text),
  (1, 'Main Engine Bilge level normal?', 'fail', true, 'defect_bilge_7821.jpg (188 KB)'),
  (2, 'Auxiliary Generator #1 fuel pressure within limits?', 'pass', false, NULL::text),
  (3, 'Emergency Fire Pump tested and operational?', 'na', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9654321')
  AND i.title = 'Engine Room Daily Inspection'
  AND i.status = 'draft'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;

-- M/V TRITON — Engine Room Daily Inspection (submitted)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed, submitted_at)
SELECT s.id, 'Engine Room Daily Inspection', 'submitted', 300, 'Ch. Eng. K. Rouvas', true, '2026-08-18T05:10:00Z'
FROM ships s WHERE s.imo = '9432100' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'Engine Room Daily Inspection'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Oily Water Separator (OWS) overboard valve sealed & locked?', 'pass', false, NULL::text),
  (1, 'Main Engine Bilge level normal?', 'pass', false, NULL::text),
  (2, 'Auxiliary Generator #1 fuel pressure within limits?', 'pass', false, NULL::text),
  (3, 'Emergency Fire Pump tested and operational?', 'pass', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9432100')
  AND i.title = 'Engine Room Daily Inspection'
  AND i.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;

-- C/V NEREUS — Engine Room Daily Inspection (draft)
INSERT INTO inspections (ship_id, title, status, elapsed_seconds, signed_by, signature_confirmed)
SELECT s.id, 'Engine Room Daily Inspection', 'draft', 90, NULL, false
FROM ships s WHERE s.imo = '9321000' AND NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.ship_id = s.id AND i.title = 'Engine Room Daily Inspection'
)
ON CONFLICT DO NOTHING;

INSERT INTO inspection_items (inspection_id, position, question, response, has_photo, photo_label)
SELECT i.id, x.position, x.question, x.response, x.has_photo, x.photo_label
FROM inspections i
JOIN (VALUES
  (0, 'Oily Water Separator (OWS) overboard valve sealed & locked?', 'pass', false, NULL::text),
  (1, 'Main Engine Bilge level normal?', 'pass', false, NULL::text),
  (2, 'Auxiliary Generator #1 fuel pressure within limits?', 'fail', true, 'defect_genfuel_5521.jpg (188 KB)'),
  (3, 'Emergency Fire Pump tested and operational?', 'pass', false, NULL::text)
) AS x(position, question, response, has_photo, photo_label)
ON i.ship_id = (SELECT id FROM ships WHERE imo = '9321000')
  AND i.title = 'Engine Room Daily Inspection'
  AND i.status = 'draft'
  AND NOT EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id)
ON CONFLICT DO NOTHING;
