import type { Json, ProfileRow } from '../../config/database.types.js';

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

export interface CertificationEntry {
  name: string;
  issuer: string | null;
  issuedAt: string | null;
  credentialUrl: string | null;
}

export interface ProfileUpdateInput {
  fullName?: string;
  phone?: string | null;
  headline?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  summary?: string;
  skills?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  certifications?: CertificationEntry[];
}

export interface ProfileView {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  headline: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  summary: string;
  skills: Json;
  education: Json;
  experience: Json;
  certifications: Json;
  resumePath: string | null;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
}

export const toProfileView = (profile: ProfileRow): ProfileView => ({
  id: profile.id,
  userId: profile.user_id,
  fullName: profile.full_name,
  phone: profile.phone,
  headline: profile.headline,
  location: profile.location,
  linkedinUrl: profile.linkedin_url,
  githubUrl: profile.github_url,
  portfolioUrl: profile.portfolio_url,
  summary: profile.summary,
  skills: profile.skills,
  education: profile.education,
  experience: profile.experience,
  certifications: profile.certifications,
  resumePath: profile.resume_path,
  profileCompletion: profile.profile_completion,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});
