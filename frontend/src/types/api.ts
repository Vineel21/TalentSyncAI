export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ path?: string; message: string }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export type UserRole = 'candidate' | 'recruiter';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  createdAt?: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string | null;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface Experience {
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

export interface Certification {
  name: string;
  issuer: string | null;
  issuedAt: string | null;
  credentialUrl: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string | null;
  headline?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  summary: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  resumePath?: string | null;
  profileCompletion: number;
  createdAt?: string;
  updatedAt?: string;
}

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'internship'
  | 'temporary'
  | 'freelance';
export type JobStatus = 'open' | 'closed' | 'draft';

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description: string;
  requirements: string;
  requiredSkills: string[];
  status: JobStatus;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  applicationCount?: number;
  matchScore?: number | null;
}

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview'
  | 'rejected'
  | 'offer'
  | 'withdrawn';

export interface ResumeFeedback {
  grammar: string[];
  ats: string[];
  skills: string[];
  projects: string[];
  formatting: string[];
  achievements: string[];
}

export interface AiAnalysis {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  matchScore: number | null;
  candidateSummary: string | null;
  resumeFeedback?: ResumeFeedback | null;
  matchingSkills: string[] | null;
  missingSkills: string[] | null;
  recommendations: string[] | null;
  model?: string | null;
  completedAt?: string | null;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  resumePath: string;
  coverLetter?: string | null;
  status: ApplicationStatus;
  aiMatchScore?: number | null;
  createdAt: string;
  updatedAt?: string;
  job?: Job;
  candidateProfile?: Profile | null;
  analysis?: AiAnalysis | null;
}

export interface Notification {
  id: string;
  kind?: string;
  applicationId?: string | null;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CandidateDashboard {
  stats: {
    profileCompletion: number;
    totalApplications: number;
    underReview: number;
    shortlisted: number;
    interviews: number;
    offers: number;
    unreadNotifications: number;
  };
  recentApplications: Application[];
  recommendedJobs: Job[];
}

export interface RecruiterDashboard {
  stats: {
    totalJobs: number;
    openJobs: number;
    totalApplicants: number;
    pending: number;
    shortlisted: number;
    interviews: number;
    rejected: number;
    offers: number;
    unreadNotifications: number;
  };
  recentJobs: Job[];
  recentApplicants: Application[];
  analytics?: Array<{ label: string; applicants: number; interviews: number }>;
}

export interface ResumeParseResult {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  headline?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  summary?: string | null;
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
}

export interface MatchResult {
  score: number;
  matchingSkills: string[];
  missingSkills: string[];
  recommendation: string;
  rationale?: string;
}
