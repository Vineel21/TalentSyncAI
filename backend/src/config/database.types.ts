export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'candidate' | 'recruiter';
export type JobStatus = 'draft' | 'open' | 'closed';
export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'freelance';
export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'withdrawn';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type NotificationKind = 'application_received' | 'application_status_changed' | 'system';

export interface UserRow extends Record<string, unknown> {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  summary: string;
  skills: Json;
  education: Json;
  experience: Json;
  certifications: Json;
  resume_path: string | null;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface JobRow extends Record<string, unknown> {
  id: string;
  recruiter_id: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string;
  required_skills: Json;
  status: JobStatus;
  currency: string;
  expires_at: string | null;
  published_at: string | null;
  deleted_at: string | null;
  search_vector: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow extends Record<string, unknown> {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_path: string;
  cover_letter: string | null;
  status: ApplicationStatus;
  ai_match_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysisRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  storage_path: string;
  original_filename: string;
  status: AnalysisStatus;
  extracted_text: string | null;
  parsed_data: Json;
  summary: string | null;
  skills: Json;
  education: Json;
  experience: Json;
  certifications: Json;
  model: string | null;
  error_message: string | null;
  gemini_consent_version: string | null;
  gemini_consented_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiAnalysisRow extends Record<string, unknown> {
  id: string;
  application_id: string;
  status: AnalysisStatus;
  match_score: number | null;
  candidate_summary: string | null;
  resume_feedback: Json;
  matching_skills: Json;
  missing_skills: Json;
  recommendations: Json;
  model: string | null;
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  kind: NotificationKind;
  application_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      users: TableDefinition<
        UserRow,
        Pick<UserRow, 'id' | 'email' | 'role'> &
          Partial<Pick<UserRow, 'created_at' | 'updated_at'>>,
        Partial<Pick<UserRow, 'email' | 'role' | 'updated_at'>>
      >;
      profiles: TableDefinition<
        ProfileRow,
        Pick<ProfileRow, 'user_id'> &
          Partial<Omit<ProfileRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
        Partial<
          Pick<
            ProfileRow,
            | 'full_name'
            | 'phone'
            | 'headline'
            | 'location'
            | 'linkedin_url'
            | 'github_url'
            | 'portfolio_url'
            | 'summary'
            | 'skills'
            | 'education'
            | 'experience'
            | 'certifications'
            | 'resume_path'
          >
        >
      >;
      jobs: TableDefinition<
        JobRow,
        Pick<
          JobRow,
          | 'recruiter_id'
          | 'title'
          | 'company_name'
          | 'location'
          | 'employment_type'
          | 'description'
          | 'requirements'
          | 'required_skills'
          | 'status'
        > &
          Partial<Pick<JobRow, 'salary_min' | 'salary_max' | 'currency' | 'expires_at'>>,
        Partial<
          Pick<
            JobRow,
            | 'title'
            | 'company_name'
            | 'location'
            | 'employment_type'
            | 'salary_min'
            | 'salary_max'
            | 'currency'
            | 'description'
            | 'requirements'
            | 'required_skills'
            | 'status'
            | 'expires_at'
            | 'deleted_at'
          >
        >
      >;
      applications: TableDefinition<
        ApplicationRow,
        Pick<ApplicationRow, 'job_id' | 'candidate_id' | 'resume_path'> &
          Partial<Pick<ApplicationRow, 'cover_letter'>>,
        Partial<Pick<ApplicationRow, 'status' | 'ai_match_score'>>
      >;
      resume_analyses: TableDefinition<
        ResumeAnalysisRow,
        Pick<ResumeAnalysisRow, 'user_id' | 'storage_path' | 'original_filename'> &
          Partial<
            Omit<
              ResumeAnalysisRow,
              'id' | 'user_id' | 'storage_path' | 'original_filename' | 'created_at' | 'updated_at'
            >
          >,
        Partial<
          Omit<
            ResumeAnalysisRow,
            'id' | 'user_id' | 'storage_path' | 'original_filename' | 'created_at' | 'updated_at'
          >
        >
      >;
      ai_analyses: TableDefinition<
        AiAnalysisRow,
        Pick<AiAnalysisRow, 'application_id'> &
          Partial<
            Pick<
              AiAnalysisRow,
              | 'status'
              | 'match_score'
              | 'candidate_summary'
              | 'resume_feedback'
              | 'matching_skills'
              | 'missing_skills'
              | 'recommendations'
              | 'model'
              | 'error_message'
              | 'completed_at'
            >
          >,
        Partial<
          Pick<
            AiAnalysisRow,
            | 'status'
            | 'match_score'
            | 'candidate_summary'
            | 'resume_feedback'
            | 'matching_skills'
            | 'missing_skills'
            | 'recommendations'
            | 'model'
            | 'error_message'
            | 'completed_at'
          >
        >
      >;
      notifications: TableDefinition<
        NotificationRow,
        Pick<NotificationRow, 'user_id' | 'title' | 'message'> &
          Partial<Pick<NotificationRow, 'kind' | 'application_id' | 'is_read' | 'read_at'>>,
        Partial<Pick<NotificationRow, 'is_read' | 'read_at'>>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      analysis_status: AnalysisStatus;
      notification_kind: NotificationKind;
    };
    CompositeTypes: Record<string, never>;
  };
}
