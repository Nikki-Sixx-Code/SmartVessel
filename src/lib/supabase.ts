import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Ship = {
  id: string;
  name: string;
  imo: string;
  vessel_type: string;
  current_zone: string;
  online_status: 'online' | 'offline';
  starlink_status: 'connected' | 'pending' | 'offline';
  last_sync_at: string;
  compliance_rating: number;
  active_alerts: number;
  payload_kb_today: number;
  created_at: string;
};

export type ChecklistStatus = {
  id: string;
  ship_id: string;
  tier: number;
  item_key: string;
  status: 'pending' | 'in_progress' | 'complete';
  updated_at: string;
};

export type Inspection = {
  id: string;
  ship_id: string;
  title: string;
  status: 'draft' | 'submitted';
  elapsed_seconds: number;
  signed_by: string | null;
  signature_confirmed: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InspectionItem = {
  id: string;
  inspection_id: string;
  position: number;
  question: string;
  response: 'pass' | 'fail' | 'na' | null;
  has_photo: boolean;
  photo_label: string | null;
  updated_at: string;
};

export type Port = {
  id: string;
  name: string;
  country: string;
  authority: string;
  risk_index: number;
  risk_label: string;
  risk_description: string;
  created_at: string;
};

export type PortFocusArea = {
  id: string;
  port_id: string;
  area: string;
  likelihood: number;
  position: number;
  created_at: string;
};

export type PortFeedback = {
  id: string;
  port_id: string;
  ship_id: string | null;
  inspector_authority: string;
  focus_tags: string[];
  outcome: 'passed' | 'defects' | 'detention';
  comments: string;
  officer_label: string;
  created_at: string;
};

export type FleetChecklistTemplate = {
  id: string;
  key: string;
  title: string;
  category: 'sms' | 'special_area';
  zone_tag: string;
  applicable_zones: string[];
  items: { key: string; question: string }[];
  created_at: string;
};

export type FleetChecklistResponse = {
  id: string;
  ship_id: string;
  template_key: string;
  item_key: string;
  response: 'pass' | 'fail' | 'na' | null;
  signed_by: string | null;
  signed_at: string | null;
  sync_status: 'pending' | 'synced';
  updated_at: string;
};
