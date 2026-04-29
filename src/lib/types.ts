export type Profile = {
  id: string;
  email: string;
  created_at: string;
};

export type Brand = {
  id: string;
  user_id: string;
  name: string;
  region: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailSettings = {
  id: string;
  user_id: string;
  recipient_email: string;
  send_day: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type BriefingJob = {
  id: string;
  user_id: string;
  status: "pending" | "running" | "done" | "failed";
  scheduled_for: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type Briefing = {
  id: string;
  user_id: string;
  briefing_job_id: string | null;
  title: string;
  summary: string | null;
  email_sent_at: string | null;
  created_at: string;
};

export type Source = {
  title: string;
  url: string;
  published_date?: string;
  highlights?: string[];
};

export type BriefingItem = {
  id: string;
  briefing_id: string;
  brand_id: string | null;
  brand_name: string;
  content: string;
  sources: Source[];
  created_at: string;
};

export type ApiUsage = {
  id: string;
  user_id: string;
  provider: string;
  request_type: string;
  request_count: number;
  period_month: string;
  briefing_id: string | null;
  briefing_job_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BriefingContent = {
  summary: string;
  key_developments: string[];
  why_it_matters: string;
  commercial_implication: string;
};

export type ExaResult = {
  title: string;
  url: string;
  publishedDate?: string;
  highlights?: string[];
};

export type UserSetup = {
  brands: Brand[];
  topics: Topic[];
  emailSettings: EmailSettings | null;
  exaUsageThisMonth: number;
  openaiUsageThisMonth: number;
  smtpUsageThisMonth: number;
};
