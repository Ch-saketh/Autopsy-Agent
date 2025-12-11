export interface Case {
  id: string;
  device_owner: string;
  extraction_date: string;
}

export interface Summary {
  case_id: string;
  device_owner: string;
  extraction_date: string;
  summary: {
    total_messages: number;
    total_contacts: number;
    total_media: number;
    flagged_media: number;
    suspicious_messages: number;
    poi_count: number;
  };
  top_pois: POI[];
  flagged_media_snapshot: Media[];
  timeline_preview: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'message' | 'media_flag' | 'call' | 'app_activity';
  label: string;
  suspicious: boolean;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  participants?: string[];
  preview?: string;
  preview_thumbnail?: string;
  explain: {
    rules_triggered?: string[];
    labels?: string[];
    confidence: number;
    model: string;
  };
  evidence_refs: {
    message_ids: string[];
    media_ids: string[];
    contact_ids: string[];
  };
}

export interface Message {
  id: string;
  timestamp: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name: string;
  text: string;
  suspicious: boolean;
  risk_level?: 'critical' | 'high' | 'medium' | 'low';
  rules_triggered: Rule[];
  cluster_id?: string;
  cluster_label?: string;
  media_ids: string[];
  source_app: string;
}

export interface Rule {
  rule: string;
  description: string;
  confidence: number;
}

export interface Media {
  id: string;
  timestamp: string;
  thumbnail_url: string;
  full_url?: string;
  file_name: string;
  file_size: number;
  sha256: string;
  source_app: string;
  labels: Label[];
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  linked_contacts: Contact[];
  linked_messages: Message[];
}

export interface Label {
  label: 'nsfw' | 'weapon' | 'violence' | 'other';
  confidence: number;
  model: string;
}

export interface POI {
  id: string;
  name: string;
  phone: string;
  email?: string;
  score: number;
  rank?: number;
  feature_breakdown: {
    total_messages: number;
    suspicious_msg_count: number;
    flagged_media_assoc: number;
    time_anomaly_score: number;
    communication_frequency: number;
    unusual_hour_pct: number;
  };
  evidence_refs: {
    message_ids: string[];
    media_ids: string[];
    event_ids: string[];
  };
  first_contact: string;
  last_contact: string;
  contact_network: ContactNetworkNode[];
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
}

export interface ContactNetworkNode {
  id: string;
  name: string;
  message_count: number;
  risk_score?: number;
}

export interface Conversation {
  participants: Contact[];
  total_messages: number;
  suspicious_count: number;
}

export interface ExportJob {
  export_job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  current_step?: string;
  files?: ExportFile[];
  error?: string;
}

export interface ExportFile {
  type: 'pdf' | 'json';
  filename: string;
  size: number;
  download_url: string;
  generated_at: string;
  sha256: string;
}
