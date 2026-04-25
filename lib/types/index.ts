export type ApplicationStatus =
  | "interested"
  | "applied"
  | "screening"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
];

export type InterviewFormat = "phone" | "video" | "onsite" | "take-home";
export type InterviewOutcome = "passed" | "failed" | "no feedback yet";

export interface Company {
  id: number;
  name: string;
  website: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  company_id: number;
  role_title: string;
  job_url: string | null;
  job_description: string | null;
  notes: string | null;
  source: string | null;
  status: ApplicationStatus;
  applied_date: string | null;
  salary_range: string | null;
  excitement: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithCompany extends Application {
  company_name: string;
  company_website: string | null;
  company_location: string | null;
}

export interface Interview {
  id: number;
  application_id: number;
  round_name: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  format: string | null;
  interviewer_names: string | null;
  interviewer_roles: string | null;
  preparation_notes: string | null;
  questions_asked: string | null;
  my_performance_notes: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface TakeHome {
  id: number;
  application_id: number;
  title: string;
  assigned_at: string | null;
  deadline_at: string | null;
  submitted_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  description: string | null;
  my_solution_url: string | null;
  reflection: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deadline {
  id: number;
  application_id: number | null;
  title: string;
  due_at: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export interface StatusHistory {
  id: number;
  application_id: number;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  notes: string | null;
}
