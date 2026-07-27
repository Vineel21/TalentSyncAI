import { randomBytes } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { createAnonymousClient, serviceSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import type {
  AiAnalysisRow,
  ApplicationRow,
  ApplicationStatus,
  Database,
  JobRow,
  Json,
  NotificationRow,
  ResumeAnalysisRow,
  UserRole,
} from '../config/database.types.js';
import { resumeParseResultSchema, type ResumeParseResult } from '../modules/ai/types.js';
import {
  allAccounts,
  applications,
  candidates,
  DEMO_SEED_VERSION,
  jobs,
  recruiters,
  type CandidateSeed,
  type JobSeed,
  type ResumeVersionSeed,
  type SeedAccount,
} from './demo-seed-data.js';

type ErrorLike = { message: string };

type JobSeedInsert = Database['public']['Tables']['jobs']['Insert'] &
  Pick<JobRow, 'id' | 'created_at' | 'updated_at'>;

type ApplicationSeedInsert = Database['public']['Tables']['applications']['Insert'] &
  Pick<ApplicationRow, 'id' | 'status' | 'created_at' | 'updated_at'>;

type ResumeAnalysisSeedInsert = Database['public']['Tables']['resume_analyses']['Insert'] &
  Pick<ResumeAnalysisRow, 'id' | 'created_at' | 'updated_at'>;

type AiAnalysisSeedInsert = Database['public']['Tables']['ai_analyses']['Insert'] &
  Pick<AiAnalysisRow, 'id' | 'created_at' | 'updated_at'>;

type NotificationSeedInsert = Database['public']['Tables']['notifications']['Insert'] &
  Pick<NotificationRow, 'id' | 'created_at' | 'updated_at'>;

interface SeedCredential {
  key: string;
  name: string;
  role: UserRole;
  email: string;
  password: string;
}

interface SeedResult {
  credentials: SeedCredential[];
  counts: {
    recruiters: number;
    candidates: number;
    resumes: number;
    jobs: number;
    applications: number;
    aiAnalyses: number;
  };
  applicationStatuses: Record<ApplicationStatus, number>;
  recruiterAnalytics: Array<{
    recruiter: string;
    company: string;
    totalJobs: number;
    openJobs: number;
    applicants: number;
    applied: number;
    shortlisted: number;
    interviews: number;
    rejected: number;
    offers: number;
    withdrawn: number;
    unreadNotifications: number;
  }>;
}

const APPLY_FLAG = '--apply';
const SEED_MARKER = 'talentsync_demo_seed';
const PDF_LINE_LIMIT = 48;
const PDF_LINE_WIDTH = 86;

const transitionPaths: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: [],
  under_review: ['under_review'],
  shortlisted: ['under_review', 'shortlisted'],
  interview: ['under_review', 'shortlisted', 'interview'],
  rejected: ['under_review', 'rejected'],
  offer: ['under_review', 'shortlisted', 'interview', 'offer'],
  withdrawn: ['withdrawn'],
};

const failOnError: (error: ErrorLike | null, operation: string) => asserts error is null = (
  error,
  operation,
) => {
  if (error) {
    throw new Error(`${operation}: ${error.message}`);
  }
};

const required = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
};

const asJson = (value: unknown): Json => value as Json;

const plusHours = (isoDate: string, hours: number): string =>
  new Date(new Date(isoDate).getTime() + hours * 60 * 60 * 1_000).toISOString();

const generatedPassword = (): string => `TsDemo!${randomBytes(12).toString('base64url')}`;

const passwordFor = (): string => {
  const sharedPassword = process.env.DEMO_SEED_PASSWORD?.trim();
  return sharedPassword || generatedPassword();
};

const assertUnique = (values: string[], label: string): void => {
  if (new Set(values).size !== values.length) {
    throw new Error(`Demo seed definitions contain a duplicate ${label}`);
  }
};

const validateDefinitions = (): void => {
  assertUnique(
    allAccounts.map((account) => account.key),
    'account key',
  );
  assertUnique(
    allAccounts.map((account) => account.email.toLowerCase()),
    'account email',
  );
  assertUnique(
    jobs.map((job) => job.id),
    'job id',
  );
  assertUnique(
    jobs.map((job) => job.key),
    'job key',
  );
  assertUnique(
    applications.map((application) => application.id),
    'application id',
  );
  assertUnique(
    applications.map((application) => application.key),
    'application key',
  );
  assertUnique(
    applications.map((application) => `${application.jobKey}:${application.candidateKey}`),
    'job/candidate application pair',
  );

  const recruiterKeys = new Set(recruiters.map((recruiter) => recruiter.key));
  const candidateKeys = new Set(candidates.map((candidate) => candidate.key));
  const jobKeys = new Set(jobs.map((job) => job.key));
  const resumeIds = candidates.flatMap((candidate) => candidate.resumes.map((resume) => resume.id));
  assertUnique(resumeIds, 'resume analysis id');

  for (const candidate of candidates) {
    assertUnique(
      candidate.resumes.map((resume) => resume.key),
      `resume key for ${candidate.email}`,
    );
    if (!candidate.resumes.some((resume) => resume.key === candidate.currentResumeKey)) {
      throw new Error(`Current resume is missing for ${candidate.email}`);
    }
  }
  for (const job of jobs) {
    if (!recruiterKeys.has(job.recruiterKey)) {
      throw new Error(`Job ${job.key} references an unknown recruiter`);
    }
  }
  for (const application of applications) {
    if (!jobKeys.has(application.jobKey) || !candidateKeys.has(application.candidateKey)) {
      throw new Error(`Application ${application.key} has an invalid job or candidate`);
    }
    const candidate = required(
      candidates.find((item) => item.key === application.candidateKey),
      application.candidateKey,
    );
    const resumeKey = application.resumeKey ?? candidate.currentResumeKey;
    if (!candidate.resumes.some((resume) => resume.key === resumeKey)) {
      throw new Error(`Application ${application.key} references an unknown resume`);
    }
    if ((application.analysisStatus === 'completed') !== (application.score !== null)) {
      throw new Error(`Application ${application.key} must pair completed analysis with a score`);
    }
  }

  const statusCoverage = new Set(applications.map((application) => application.status));
  for (const status of Object.keys(transitionPaths) as ApplicationStatus[]) {
    if (!statusCoverage.has(status)) {
      throw new Error(`Demo definitions do not cover application status ${status}`);
    }
  }
};

const wrapLine = (line: string): string[] => {
  const words = line.replaceAll(/\s+/g, ' ').trim().split(' ');
  const output: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= PDF_LINE_WIDTH) {
      current = candidate;
      continue;
    }
    if (current) output.push(current);
    current = word.slice(0, PDF_LINE_WIDTH);
  }

  if (current) output.push(current);
  return output;
};

const escapedPdfText = (value: string): string =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll(/[^\x20-\x7E]/g, ' ');

const buildPdf = (lines: string[]): Buffer => {
  const printableLines = lines.flatMap(wrapLine).slice(0, PDF_LINE_LIMIT);
  const stream = [
    'BT',
    '/F1 10 Tf',
    '50 760 Td',
    '14 TL',
    ...printableLines.flatMap((line, index) => [
      `(${escapedPdfText(line)}) Tj`,
      ...(index === printableLines.length - 1 ? [] : ['T*']),
    ]),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n% TalentSync demo resume\n', 'ascii')];
  const offsets: number[] = [0];
  let byteOffset = chunks[0]?.length ?? 0;

  objects.forEach((object, index) => {
    offsets[index + 1] = byteOffset;
    const chunk = Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, 'ascii');
    chunks.push(chunk);
    byteOffset += chunk.length;
  });

  const xrefOffset = byteOffset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...objects.map((_, index) => `${String(offsets[index + 1]).padStart(10, '0')} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    '%%EOF',
  ].join('\n');
  chunks.push(Buffer.from(`${xref}\n`, 'ascii'));

  const pdf = Buffer.concat(chunks);
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-', 'ascii'))) {
    throw new Error('Generated resume does not have a PDF signature');
  }
  if (!pdf.subarray(-6).toString('ascii').includes('%%EOF')) {
    throw new Error('Generated resume does not have a PDF trailer');
  }
  return pdf;
};

const resumeDetails = (
  candidate: CandidateSeed,
  version: ResumeVersionSeed,
): {
  parsed: ResumeParseResult;
  text: string;
  pdf: Buffer;
} => {
  const summary = version.summary ?? candidate.summary;
  const skills = version.skills ?? candidate.skills;
  const certifications = version.certifications ?? candidate.certifications;
  const parsed = resumeParseResultSchema.parse({
    name: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    headline: candidate.headline,
    location: candidate.location,
    linkedin: candidate.linkedinUrl,
    github: candidate.githubUrl,
    portfolio: candidate.portfolioUrl,
    summary,
    skills,
    education: candidate.education,
    experience: candidate.experience,
    certifications,
  });
  const lines = [
    candidate.fullName,
    candidate.headline,
    `${candidate.email} | ${candidate.phone} | ${candidate.location}`,
    '',
    'SUMMARY',
    summary,
    '',
    'SKILLS',
    skills.join(' | '),
    '',
    'EXPERIENCE',
    ...(candidate.experience.length
      ? candidate.experience.flatMap((experience) => [
          `${experience.title} - ${experience.company}`,
          `${experience.startDate ?? ''} to ${experience.current ? 'Present' : (experience.endDate ?? '')}`,
          experience.description ?? '',
        ])
      : ['Fresher - no full-time experience']),
    '',
    'EDUCATION',
    ...candidate.education.flatMap((education) => [
      `${education.degree} in ${education.fieldOfStudy ?? 'General Studies'}`,
      `${education.institution} | ${education.startDate ?? ''} to ${education.endDate ?? ''}`,
    ]),
    '',
    'SELECTED HIGHLIGHTS',
    ...version.highlights.map((highlight) => `- ${highlight}`),
    '',
    'CERTIFICATIONS',
    ...(certifications.length
      ? certifications.map(
          (certification) =>
            `${certification.name} - ${certification.issuer ?? 'Independent issuer'}`,
        )
      : ['No certifications listed']),
  ];
  const text = lines.join('\n');
  return { parsed, text, pdf: buildPdf(lines) };
};

const listAuthUsers = async (): Promise<User[]> => {
  const users: User[] = [];
  const perPage = 1_000;
  let page = 1;

  while (true) {
    const { data, error } = await serviceSupabase.auth.admin.listUsers({ page, perPage });
    failOnError(error, `Unable to list Auth users (page ${page})`);
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }
  return users;
};

const ensureAccount = async (
  account: SeedAccount,
  password: string,
  existingUsers: Map<string, User>,
): Promise<User> => {
  const existing = existingUsers.get(account.email.toLowerCase());
  if (existing && existing.app_metadata[SEED_MARKER] !== true) {
    throw new Error(
      `Reserved seed email ${account.email} already belongs to an unmarked account; refusing to modify it`,
    );
  }

  const userMetadata = {
    requested_role: account.role,
    full_name: account.fullName,
    demo_seed_version: DEMO_SEED_VERSION,
  };
  const appMetadata = {
    ...(existing?.app_metadata ?? {}),
    [SEED_MARKER]: true,
    demo_seed_version: DEMO_SEED_VERSION,
  };

  if (existing) {
    const { data, error } = await serviceSupabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: appMetadata,
    });
    failOnError(error, `Unable to update seed Auth user ${account.email}`);
    return data.user;
  }

  const { data, error } = await serviceSupabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
    app_metadata: appMetadata,
  });
  failOnError(error, `Unable to create seed Auth user ${account.email}`);
  return data.user;
};

const verifyPublicAccount = async (account: SeedAccount, authUser: User): Promise<void> => {
  const { data, error } = await serviceSupabase
    .from('users')
    .select('id, email, role')
    .eq('id', authUser.id)
    .single();
  failOnError(error, `Unable to verify public account ${account.email}`);

  if (
    data.id !== authUser.id ||
    data.email !== account.email.toLowerCase() ||
    data.role !== account.role
  ) {
    throw new Error(`Public account did not match Auth identity for ${account.email}`);
  }
};

const clearSeedData = async (
  usersByKey: Map<string, User>,
  seedStartedAt: string,
): Promise<void> => {
  const recruiterIds = recruiters.map(
    (recruiter) => required(usersByKey.get(recruiter.key), recruiter.key).id,
  );
  const candidateIds = candidates.map(
    (candidate) => required(usersByKey.get(candidate.key), candidate.key).id,
  );
  const accountIds = [...recruiterIds, ...candidateIds];

  const oldNotifications = await serviceSupabase
    .from('notifications')
    .delete()
    .in('user_id', accountIds)
    .eq('title', 'Demo data ready');
  failOnError(oldNotifications.error, 'Unable to clear prior demo system notifications');

  const oldJobs = await serviceSupabase.from('jobs').delete().in('recruiter_id', recruiterIds);
  failOnError(oldJobs.error, 'Unable to clear prior demo recruiter jobs');

  const oldAnalyses = await serviceSupabase
    .from('resume_analyses')
    .delete()
    .in('user_id', candidateIds)
    .like('storage_path', '%/seed/%');
  failOnError(oldAnalyses.error, 'Unable to clear prior demo resume analyses');

  for (const candidate of candidates) {
    const user = required(usersByKey.get(candidate.key), `Missing Auth user for ${candidate.key}`);
    const folder = `${user.id}/seed`;
    const { data: objects, error: listError } = await serviceSupabase.storage
      .from(env.SUPABASE_RESUME_BUCKET)
      .list(folder, { limit: 100 });
    failOnError(listError, `Unable to list prior resume objects for ${candidate.email}`);
    const paths = (objects ?? []).map((object) => `${folder}/${object.name}`);
    if (paths.length) {
      const { error: removeError } = await serviceSupabase.storage
        .from(env.SUPABASE_RESUME_BUCKET)
        .remove(paths);
      failOnError(removeError, `Unable to remove prior resume objects for ${candidate.email}`);
    }
  }

  const staleCurrentRunNotifications = await serviceSupabase
    .from('notifications')
    .delete()
    .in('user_id', accountIds)
    .gte('created_at', seedStartedAt);
  failOnError(
    staleCurrentRunNotifications.error,
    'Unable to clear notifications from an interrupted seed run',
  );
};

const seedCandidateProfilesAndResumes = async (
  usersByKey: Map<string, User>,
): Promise<Map<string, Map<string, string>>> => {
  const resumePaths = new Map<string, Map<string, string>>();
  const analysisRows: ResumeAnalysisSeedInsert[] = [];

  for (const candidate of candidates) {
    const user = required(usersByKey.get(candidate.key), `Missing Auth user for ${candidate.key}`);
    const candidatePaths = new Map<string, string>();

    for (const version of candidate.resumes) {
      const path = `${user.id}/seed/${version.filename}`;
      const details = resumeDetails(candidate, version);
      const { error: uploadError } = await serviceSupabase.storage
        .from(env.SUPABASE_RESUME_BUCKET)
        .upload(path, details.pdf, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true,
        });
      failOnError(uploadError, `Unable to upload ${version.filename}`);
      candidatePaths.set(version.key, path);

      analysisRows.push({
        id: version.id,
        user_id: user.id,
        storage_path: path,
        original_filename: version.filename,
        status: 'completed',
        extracted_text: details.text,
        parsed_data: asJson(details.parsed),
        summary: details.parsed.summary,
        skills: asJson(details.parsed.skills),
        education: asJson(details.parsed.education),
        experience: asJson(details.parsed.experience),
        certifications: asJson(details.parsed.certifications),
        model: 'seed-fixture-v1',
        error_message: null,
        gemini_consent_version: null,
        gemini_consented_at: null,
        completed_at: plusHours(version.createdAt, 1),
        created_at: version.createdAt,
        updated_at: plusHours(version.createdAt, 1),
      });
    }

    const currentPath = required(
      candidatePaths.get(candidate.currentResumeKey),
      `Missing current resume path for ${candidate.email}`,
    );
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .update({
        full_name: candidate.fullName,
        phone: candidate.phone,
        headline: candidate.headline,
        location: candidate.location,
        linkedin_url: candidate.linkedinUrl,
        github_url: candidate.githubUrl,
        portfolio_url: candidate.portfolioUrl,
        summary: candidate.summary,
        skills: asJson(candidate.skills),
        education: asJson(candidate.education),
        experience: asJson(candidate.experience),
        certifications: asJson(candidate.certifications),
        resume_path: currentPath,
        onboarding_step: 3,
        onboarding_source: 'resume',
        onboarding_completed_at: new Date().toISOString(),
        recommendations_skipped_at: null,
      })
      .eq('user_id', user.id);
    failOnError(profileError, `Unable to update profile for ${candidate.email}`);
    resumePaths.set(candidate.key, candidatePaths);
  }

  const { error: analysisError } = await serviceSupabase
    .from('resume_analyses')
    .insert(analysisRows);
  failOnError(analysisError, 'Unable to insert demo resume analyses');
  return resumePaths;
};

const seedJobs = async (usersByKey: Map<string, User>): Promise<Map<string, JobRow>> => {
  const rows: JobSeedInsert[] = jobs.map((job) => ({
    id: job.id,
    recruiter_id: required(
      usersByKey.get(job.recruiterKey),
      `Missing recruiter ${job.recruiterKey}`,
    ).id,
    title: job.title,
    company_name: job.companyName,
    location: job.location,
    employment_type: job.employmentType,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    currency: job.currency,
    description: job.description,
    requirements: job.requirements,
    required_skills: asJson(job.requiredSkills),
    status: job.status,
    expires_at: job.expiresAt,
    created_at: job.createdAt,
    updated_at: job.createdAt,
  }));
  const { data, error } = await serviceSupabase.from('jobs').insert(rows).select('*');
  failOnError(error, 'Unable to insert demo jobs');
  const keyed = new Map<string, JobRow>();
  for (const job of jobs) {
    keyed.set(
      job.key,
      required(
        data.find((row) => row.id === job.id),
        `Inserted job ${job.key} was not returned`,
      ),
    );
  }
  return keyed;
};

const seedApplications = async (
  usersByKey: Map<string, User>,
  jobsByKey: Map<string, JobRow>,
  resumePaths: Map<string, Map<string, string>>,
): Promise<Map<string, ApplicationRow>> => {
  const rows: ApplicationSeedInsert[] = applications.map((application) => {
    const candidate = required(
      candidates.find((item) => item.key === application.candidateKey),
      `Missing candidate seed ${application.candidateKey}`,
    );
    const resumeKey = application.resumeKey ?? candidate.currentResumeKey;
    return {
      id: application.id,
      job_id: required(jobsByKey.get(application.jobKey), application.jobKey).id,
      candidate_id: required(usersByKey.get(application.candidateKey), application.candidateKey).id,
      resume_path: required(
        resumePaths.get(application.candidateKey)?.get(resumeKey),
        `Missing resume ${resumeKey} for ${application.candidateKey}`,
      ),
      cover_letter: application.coverLetter,
      status: 'applied',
      created_at: application.createdAt,
      updated_at: application.createdAt,
    };
  });

  const { error } = await serviceSupabase.from('applications').insert(rows);
  failOnError(error, 'Unable to insert demo applications');

  for (const application of applications) {
    for (const status of transitionPaths[application.status]) {
      const { error: transitionError } = await serviceSupabase
        .from('applications')
        .update({ status })
        .eq('id', application.id);
      failOnError(transitionError, `Unable to transition ${application.key} to ${status}`);
    }

    if (application.score !== null) {
      const { error: scoreError } = await serviceSupabase
        .from('applications')
        .update({ ai_match_score: application.score })
        .eq('id', application.id);
      failOnError(scoreError, `Unable to score ${application.key}`);
    }
  }

  const refreshed = await serviceSupabase
    .from('applications')
    .select('*')
    .in(
      'id',
      applications.map((application) => application.id),
    );
  failOnError(refreshed.error, 'Unable to reload demo applications');
  return new Map(
    (refreshed.data ?? []).map((row) => [
      required(
        applications.find((application) => application.id === row.id),
        `Missing application definition for ${row.id}`,
      ).key,
      row,
    ]),
  );
};

const recommendationFor = (
  score: number,
): 'excellent_match' | 'good_match' | 'average_match' | 'poor_match' => {
  if (score >= 90) return 'excellent_match';
  if (score >= 75) return 'good_match';
  if (score >= 50) return 'average_match';
  return 'poor_match';
};

const matchingSkillsFor = (candidate: CandidateSeed, job: JobSeed): string[] => {
  const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
  return job.requiredSkills.filter((skill) => candidateSkills.has(skill.toLowerCase()));
};

const missingSkillsFor = (candidate: CandidateSeed, job: JobSeed): string[] => {
  const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
  return job.requiredSkills.filter((skill) => !candidateSkills.has(skill.toLowerCase()));
};

const seedAiAnalyses = async (): Promise<void> => {
  const rows: AiAnalysisSeedInsert[] = applications.map((application, index) => {
    const candidate = required(
      candidates.find((item) => item.key === application.candidateKey),
      application.candidateKey,
    );
    const job = required(
      jobs.find((item) => item.key === application.jobKey),
      application.jobKey,
    );
    const createdAt = plusHours(application.createdAt, 2);
    const completedAt =
      application.analysisStatus === 'pending' ? null : plusHours(application.createdAt, 3);
    const score = application.score;
    const isCompleted = application.analysisStatus === 'completed' && score !== null;
    const matchingSkills = isCompleted ? matchingSkillsFor(candidate, job) : [];
    const missingSkills = isCompleted ? missingSkillsFor(candidate, job) : [];
    const recommendation = isCompleted ? recommendationFor(score) : null;
    const rationale = isCompleted
      ? `${candidate.fullName} has ${matchingSkills.length} directly matching skill(s) for ${job.title}; the score reflects seniority, domain, and transferable experience.`
      : null;

    return {
      id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      application_id: application.id,
      status: application.analysisStatus,
      match_score: score,
      candidate_summary: isCompleted
        ? `${candidate.fullName} is a ${candidate.headline.toLowerCase()} with evidence relevant to ${job.title}. Human review should consider the listed strengths and missing skills.`
        : null,
      resume_feedback: isCompleted
        ? asJson({
            grammar: ['Use consistent tense across achievement bullets.'],
            ats: [
              `Include the exact role title "${job.title}" when it accurately reflects the target.`,
            ],
            skills: missingSkills.length
              ? [
                  `Add evidence for ${missingSkills.join(', ')} if the candidate has that experience.`,
                ]
              : ['The resume already covers the primary required skills.'],
            projects: ['Keep the most role-relevant project or work example near the top.'],
            formatting: ['Use a consistent one-column layout and clear section headings.'],
            achievements: [
              `Quantify one additional outcome relevant to ${job.companyName}'s role.`,
            ],
          })
        : asJson({}),
      matching_skills: asJson(matchingSkills),
      missing_skills: asJson(missingSkills),
      recommendations:
        recommendation && rationale ? asJson([recommendation, rationale]) : asJson([]),
      model: 'seed-fixture-v1',
      error_message:
        application.analysisStatus === 'failed'
          ? 'Seed fixture: simulated AI provider timeout'
          : null,
      completed_at: completedAt,
      created_at: createdAt,
      updated_at: completedAt ?? createdAt,
    };
  });

  const { error } = await serviceSupabase.from('ai_analyses').insert(rows);
  failOnError(error, 'Unable to insert demo AI analyses');
};

const seedSystemNotifications = async (usersByKey: Map<string, User>): Promise<void> => {
  const createdAt = '2026-07-26T09:00:00.000Z';
  const rows: NotificationSeedInsert[] = allAccounts.map((account, index) => ({
    id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    user_id: required(usersByKey.get(account.key), account.key).id,
    kind: 'system',
    title: 'Demo data ready',
    message:
      account.role === 'recruiter'
        ? 'Your demo workspace includes varied jobs, applicants, pipeline stages, AI results, and analytics.'
        : 'Your demo profile includes a private resume, applications in varied stages, AI results, and notifications.',
    is_read: false,
    read_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  }));
  const { error } = await serviceSupabase.from('notifications').insert(rows);
  failOnError(error, 'Unable to insert demo system notifications');
};

const applyNotificationReadMix = async (usersByKey: Map<string, User>): Promise<void> => {
  for (const account of allAccounts) {
    const user = required(usersByKey.get(account.key), account.key);
    const { data, error } = await serviceSupabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    failOnError(error, `Unable to load notifications for ${account.email}`);
    const ids = (data ?? []).map((notification) => notification.id);
    if (!ids.length) continue;

    const markRead = await serviceSupabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids);
    failOnError(markRead.error, `Unable to mark demo notifications read for ${account.email}`);

    const unreadIds = ids.slice(0, account.unreadTarget);
    if (unreadIds.length) {
      const markUnread = await serviceSupabase
        .from('notifications')
        .update({ is_read: false, read_at: null })
        .in('id', unreadIds);
      failOnError(
        markUnread.error,
        `Unable to mark demo notifications unread for ${account.email}`,
      );
    }
  }
};

const verifyLogin = async (credential: SeedCredential, expectedId: string): Promise<void> => {
  const client = createAnonymousClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: credential.email,
    password: credential.password,
  });
  failOnError(error, `Login verification failed for ${credential.email}`);
  if (data.user.id !== expectedId) {
    throw new Error(`Login returned the wrong Auth user for ${credential.email}`);
  }
};

const countStatuses = (rows: ApplicationRow[]): Record<ApplicationStatus, number> => {
  const result: Record<ApplicationStatus, number> = {
    applied: 0,
    under_review: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    offer: 0,
    withdrawn: 0,
  };
  for (const row of rows) result[row.status] += 1;
  return result;
};

const verifySeed = async (
  usersByKey: Map<string, User>,
  credentials: SeedCredential[],
): Promise<SeedResult> => {
  for (const credential of credentials) {
    await verifyLogin(credential, required(usersByKey.get(credential.key), credential.key).id);
  }

  const recruiterIds = recruiters.map(
    (recruiter) => required(usersByKey.get(recruiter.key), recruiter.key).id,
  );
  const candidateIds = candidates.map(
    (candidate) => required(usersByKey.get(candidate.key), candidate.key).id,
  );
  const applicationIds = applications.map((application) => application.id);

  const [profilesResult, jobsResult, applicationsResult, resumesResult, aiResult] =
    await Promise.all([
      serviceSupabase.from('profiles').select('user_id').in('user_id', candidateIds),
      serviceSupabase.from('jobs').select('*').in('recruiter_id', recruiterIds),
      serviceSupabase.from('applications').select('*').in('id', applicationIds),
      serviceSupabase
        .from('resume_analyses')
        .select('id, storage_path')
        .in('user_id', candidateIds)
        .like('storage_path', '%/seed/%'),
      serviceSupabase.from('ai_analyses').select('id').in('application_id', applicationIds),
    ]);
  failOnError(profilesResult.error, 'Unable to verify candidate profiles');
  failOnError(jobsResult.error, 'Unable to verify jobs');
  failOnError(applicationsResult.error, 'Unable to verify applications');
  failOnError(resumesResult.error, 'Unable to verify resumes');
  failOnError(aiResult.error, 'Unable to verify AI analyses');

  if ((profilesResult.data ?? []).length !== candidates.length) {
    throw new Error('Candidate profile verification count did not match');
  }
  if ((jobsResult.data ?? []).length !== jobs.length) {
    throw new Error('Job verification count did not match');
  }
  if ((applicationsResult.data ?? []).length !== applications.length) {
    throw new Error('Application verification count did not match');
  }
  const expectedResumeCount = candidates.reduce(
    (total, candidate) => total + candidate.resumes.length,
    0,
  );
  if ((resumesResult.data ?? []).length !== expectedResumeCount) {
    throw new Error('Resume analysis verification count did not match');
  }
  if ((aiResult.data ?? []).length !== applications.length) {
    throw new Error('AI analysis verification count did not match');
  }

  for (const resume of resumesResult.data ?? []) {
    const { data, error } = await serviceSupabase.storage
      .from(env.SUPABASE_RESUME_BUCKET)
      .download(resume.storage_path);
    failOnError(error, `Unable to verify stored resume ${resume.storage_path}`);
    const bytes = Buffer.from(await data.arrayBuffer());
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-', 'ascii'))) {
      throw new Error(`Stored resume ${resume.storage_path} is not a PDF`);
    }
  }

  const applicationRows = applicationsResult.data ?? [];
  const statusCounts = countStatuses(applicationRows);
  for (const [status, count] of Object.entries(statusCounts)) {
    if (count < 1) throw new Error(`Application status ${status} was not seeded`);
  }

  const recruiterAnalytics = [];
  for (const recruiter of recruiters) {
    const recruiterId = required(usersByKey.get(recruiter.key), recruiter.key).id;
    const recruiterJobs = (jobsResult.data ?? []).filter((job) => job.recruiter_id === recruiterId);
    const jobIds = new Set(recruiterJobs.map((job) => job.id));
    const recruiterApplications = applicationRows.filter((application) =>
      jobIds.has(application.job_id),
    );
    const unreadResult = await serviceSupabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', recruiterId)
      .eq('is_read', false);
    failOnError(unreadResult.error, `Unable to verify analytics for ${recruiter.email}`);
    const statuses = countStatuses(recruiterApplications);
    recruiterAnalytics.push({
      recruiter: recruiter.fullName,
      company: recruiter.companyName,
      totalJobs: recruiterJobs.length,
      openJobs: recruiterJobs.filter((job) => job.status === 'open').length,
      applicants: recruiterApplications.length,
      applied: statuses.applied,
      shortlisted: statuses.shortlisted,
      interviews: statuses.interview,
      rejected: statuses.rejected,
      offers: statuses.offer,
      withdrawn: statuses.withdrawn,
      unreadNotifications: unreadResult.count ?? 0,
    });
  }

  return {
    credentials,
    counts: {
      recruiters: recruiters.length,
      candidates: candidates.length,
      resumes: expectedResumeCount,
      jobs: jobs.length,
      applications: applications.length,
      aiAnalyses: applications.length,
    },
    applicationStatuses: statusCounts,
    recruiterAnalytics,
  };
};

const seed = async (): Promise<SeedResult> => {
  if (!process.argv.includes(APPLY_FLAG)) {
    throw new Error(
      `Demo seeding changes the connected Supabase project. Rerun with ${APPLY_FLAG} to confirm.`,
    );
  }

  validateDefinitions();
  const seedStartedAt = new Date().toISOString();
  const existingUsers = new Map(
    (await listAuthUsers())
      .filter((user): user is User & { email: string } => Boolean(user.email))
      .map((user) => [user.email.toLowerCase(), user]),
  );
  const credentials: SeedCredential[] = allAccounts.map((account) => ({
    key: account.key,
    name: account.fullName,
    role: account.role,
    email: account.email,
    password: passwordFor(),
  }));
  const usersByKey = new Map<string, User>();

  for (const account of allAccounts) {
    const credential = required(
      credentials.find((item) => item.key === account.key),
      account.key,
    );
    const user = await ensureAccount(account, credential.password, existingUsers);
    await verifyPublicAccount(account, user);
    usersByKey.set(account.key, user);
  }

  await clearSeedData(usersByKey, seedStartedAt);
  const resumePaths = await seedCandidateProfilesAndResumes(usersByKey);
  const jobsByKey = await seedJobs(usersByKey);
  await seedApplications(usersByKey, jobsByKey, resumePaths);
  await seedAiAnalyses();
  await seedSystemNotifications(usersByKey);
  await applyNotificationReadMix(usersByKey);
  return verifySeed(usersByKey, credentials);
};

try {
  const result = await seed();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
