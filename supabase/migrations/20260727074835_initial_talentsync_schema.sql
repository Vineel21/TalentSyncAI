begin;

-- Supabase projects created before the hardened Data API defaults can contain
-- this helper with EXECUTE granted to every API role. Keep the helper in place,
-- but remove its public call surface when it exists.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute
      'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.user_role as enum (
  'candidate',
  'recruiter'
);

create type public.job_status as enum (
  'draft',
  'open',
  'closed'
);

create type public.application_status as enum (
  'applied',
  'under_review',
  'shortlisted',
  'interview',
  'rejected',
  'offer',
  'withdrawn'
);

create type public.analysis_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create type public.notification_kind as enum (
  'application_received',
  'application_status_changed',
  'system'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'candidate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_unique unique (email),
  constraint users_email_valid check (
    email = lower(email)
    and char_length(email) between 3 and 320
    and position('@' in email) > 1
  ),
  constraint users_timestamps_valid check (updated_at >= created_at)
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  headline text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  summary text not null default '',
  skills jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  resume_path text,
  profile_completion smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id),
  constraint profiles_full_name_length check (char_length(full_name) <= 160),
  constraint profiles_phone_length check (phone is null or char_length(phone) <= 40),
  constraint profiles_headline_length check (headline is null or char_length(headline) <= 240),
  constraint profiles_location_length check (location is null or char_length(location) <= 160),
  constraint profiles_linkedin_url_valid check (
    linkedin_url is null
    or (char_length(linkedin_url) <= 2048 and linkedin_url ~* '^https://')
  ),
  constraint profiles_github_url_valid check (
    github_url is null
    or (char_length(github_url) <= 2048 and github_url ~* '^https://')
  ),
  constraint profiles_portfolio_url_valid check (
    portfolio_url is null
    or (char_length(portfolio_url) <= 2048 and portfolio_url ~* '^https://')
  ),
  constraint profiles_summary_length check (char_length(summary) <= 10000),
  constraint profiles_skills_array check (jsonb_typeof(skills) = 'array'),
  constraint profiles_education_array check (jsonb_typeof(education) = 'array'),
  constraint profiles_experience_array check (jsonb_typeof(experience) = 'array'),
  constraint profiles_certifications_array check (jsonb_typeof(certifications) = 'array'),
  constraint profiles_resume_path_valid check (
    resume_path is null
    or (
      char_length(resume_path) between 3 and 1024
      and left(resume_path, 1) <> '/'
      and position('..' in resume_path) = 0
      and split_part(resume_path, '/', 1) = user_id::text
    )
  ),
  constraint profiles_completion_range check (profile_completion between 0 and 100),
  constraint profiles_timestamps_valid check (updated_at >= created_at)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  company_name text not null,
  location text not null,
  employment_type text not null,
  salary_min integer,
  salary_max integer,
  currency text not null default 'USD',
  description text not null,
  requirements text not null default '',
  required_skills jsonb not null default '[]'::jsonb,
  status public.job_status not null default 'draft',
  expires_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(company_name, '')), 'A')
    || setweight(to_tsvector('english'::regconfig, coalesce(location, '')), 'B')
    || setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'B')
    || setweight(to_tsvector('english'::regconfig, coalesce(requirements, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_title_length check (char_length(title) between 2 and 200),
  constraint jobs_company_name_length check (char_length(company_name) between 2 and 200),
  constraint jobs_location_length check (char_length(location) between 2 and 160),
  constraint jobs_employment_type_valid check (
    employment_type in (
      'full_time',
      'part_time',
      'contract',
      'temporary',
      'internship',
      'freelance'
    )
  ),
  constraint jobs_salary_min_valid check (salary_min is null or salary_min >= 0),
  constraint jobs_salary_max_valid check (salary_max is null or salary_max >= 0),
  constraint jobs_salary_range_valid check (
    salary_min is null
    or salary_max is null
    or salary_max >= salary_min
  ),
  constraint jobs_currency_valid check (currency ~ '^[A-Z]{3}$'),
  constraint jobs_description_length check (char_length(description) between 20 and 50000),
  constraint jobs_requirements_length check (char_length(requirements) <= 30000),
  constraint jobs_required_skills_array check (jsonb_typeof(required_skills) = 'array'),
  constraint jobs_expiration_valid check (expires_at is null or expires_at > created_at),
  constraint jobs_published_at_valid check (published_at is null or published_at >= created_at),
  constraint jobs_deleted_at_valid check (deleted_at is null or deleted_at >= created_at),
  constraint jobs_timestamps_valid check (updated_at >= created_at)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  resume_path text not null,
  cover_letter text,
  status public.application_status not null default 'applied',
  ai_match_score smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_job_candidate_unique unique (job_id, candidate_id),
  constraint applications_resume_path_valid check (
    char_length(resume_path) between 3 and 1024
    and left(resume_path, 1) <> '/'
    and position('..' in resume_path) = 0
    and split_part(resume_path, '/', 1) = candidate_id::text
  ),
  constraint applications_cover_letter_length check (
    cover_letter is null or char_length(cover_letter) <= 10000
  ),
  constraint applications_ai_match_score_range check (
    ai_match_score is null or ai_match_score between 0 and 100
  ),
  constraint applications_timestamps_valid check (updated_at >= created_at)
);

create table public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  status public.analysis_status not null default 'pending',
  extracted_text text,
  parsed_data jsonb not null default '{}'::jsonb,
  summary text,
  skills jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  model text,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_analyses_user_path_unique unique (user_id, storage_path),
  constraint resume_analyses_storage_path_valid check (
    char_length(storage_path) between 3 and 1024
    and left(storage_path, 1) <> '/'
    and position('..' in storage_path) = 0
    and split_part(storage_path, '/', 1) = user_id::text
  ),
  constraint resume_analyses_filename_length check (
    char_length(original_filename) between 1 and 255
    and lower(original_filename) ~ '\.pdf$'
  ),
  constraint resume_analyses_parsed_data_object check (
    jsonb_typeof(parsed_data) = 'object'
  ),
  constraint resume_analyses_skills_array check (jsonb_typeof(skills) = 'array'),
  constraint resume_analyses_education_array check (jsonb_typeof(education) = 'array'),
  constraint resume_analyses_experience_array check (jsonb_typeof(experience) = 'array'),
  constraint resume_analyses_certifications_array check (
    jsonb_typeof(certifications) = 'array'
  ),
  constraint resume_analyses_model_length check (model is null or char_length(model) <= 160),
  constraint resume_analyses_error_length check (
    error_message is null or char_length(error_message) <= 5000
  ),
  constraint resume_analyses_completed_at_valid check (
    completed_at is null or completed_at >= created_at
  ),
  constraint resume_analyses_timestamps_valid check (updated_at >= created_at)
);

create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  status public.analysis_status not null default 'pending',
  match_score smallint,
  candidate_summary text,
  resume_feedback jsonb not null default '{}'::jsonb,
  matching_skills jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  model text,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_analyses_application_unique unique (application_id),
  constraint ai_analyses_match_score_range check (
    match_score is null or match_score between 0 and 100
  ),
  constraint ai_analyses_candidate_summary_length check (
    candidate_summary is null or char_length(candidate_summary) <= 10000
  ),
  constraint ai_analyses_resume_feedback_object check (
    jsonb_typeof(resume_feedback) = 'object'
  ),
  constraint ai_analyses_matching_skills_array check (
    jsonb_typeof(matching_skills) = 'array'
  ),
  constraint ai_analyses_missing_skills_array check (
    jsonb_typeof(missing_skills) = 'array'
  ),
  constraint ai_analyses_recommendations_array check (
    jsonb_typeof(recommendations) = 'array'
  ),
  constraint ai_analyses_model_length check (model is null or char_length(model) <= 160),
  constraint ai_analyses_error_length check (
    error_message is null or char_length(error_message) <= 5000
  ),
  constraint ai_analyses_completed_at_valid check (
    completed_at is null or completed_at >= created_at
  ),
  constraint ai_analyses_timestamps_valid check (updated_at >= created_at)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind public.notification_kind not null default 'system',
  application_id uuid references public.applications (id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) between 1 and 200),
  constraint notifications_message_length check (char_length(message) between 1 and 2000),
  constraint notifications_read_state_valid check (
    (is_read and read_at is not null)
    or (not is_read and read_at is null)
  ),
  constraint notifications_read_at_valid check (read_at is null or read_at >= created_at),
  constraint notifications_timestamps_valid check (updated_at >= created_at)
);

-- Foreign keys, RLS predicates, and the primary dashboard filters all receive
-- btree indexes. Unique constraints already provide indexes for profiles.user_id,
-- applications(job_id, candidate_id), resume analyses, and AI analyses.
create index jobs_recruiter_id_idx
  on public.jobs (recruiter_id);

create index jobs_recruiter_dashboard_idx
  on public.jobs (recruiter_id, status, created_at desc)
  where deleted_at is null;

create index jobs_discovery_filter_idx
  on public.jobs (status, employment_type, location, expires_at, created_at desc)
  where deleted_at is null;

create index jobs_salary_filter_idx
  on public.jobs (salary_min, salary_max)
  where deleted_at is null and status = 'open';

create index jobs_search_vector_idx
  on public.jobs using gin (search_vector);

create index jobs_required_skills_idx
  on public.jobs using gin (required_skills);

create index applications_candidate_id_idx
  on public.applications (candidate_id, created_at desc);

create index applications_job_status_idx
  on public.applications (job_id, status, created_at desc);

create index applications_resume_path_idx
  on public.applications (resume_path);

create index resume_analyses_user_status_idx
  on public.resume_analyses (user_id, status, created_at desc);

create index notifications_user_feed_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where not is_read;

create index notifications_application_id_idx
  on public.notifications (application_id)
  where application_id is not null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.set_job_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'open' then
      new.published_at := now();
    else
      new.published_at := null;
    end if;
  elsif new.status = 'open' and old.status is distinct from 'open' then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create or replace function private.set_profile_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.profile_completion :=
    case when btrim(new.full_name) <> '' then 15 else 0 end
    + case when nullif(btrim(coalesce(new.phone, '')), '') is not null then 5 else 0 end
    + case when nullif(btrim(coalesce(new.headline, '')), '') is not null then 10 else 0 end
    + case when nullif(btrim(coalesce(new.location, '')), '') is not null then 5 else 0 end
    + case when btrim(new.summary) <> '' then 10 else 0 end
    + case when jsonb_array_length(new.skills) > 0 then 15 else 0 end
    + case when jsonb_array_length(new.education) > 0 then 10 else 0 end
    + case when jsonb_array_length(new.experience) > 0 then 15 else 0 end
    + case when new.resume_path is not null then 10 else 0 end
    + case
        when new.linkedin_url is not null
          or new.github_url is not null
          or new.portfolio_url is not null
        then 5
        else 0
      end;

  return new;
end;
$$;

create or replace function private.normalize_notification_read_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_read then
    new.read_at := coalesce(new.read_at, now());
  else
    new.read_at := null;
  end if;

  return new;
end;
$$;

create or replace function private.user_has_role(expected_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as app_user
    where app_user.id = (select auth.uid())
      and app_user.role = expected_role
  );
$$;

create or replace function private.recruiter_owns_job(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.user_has_role('recruiter'::public.user_role)
    and exists (
      select 1
      from public.jobs as job
      where job.id = target_job_id
        and job.recruiter_id = (select auth.uid())
    );
$$;

create or replace function private.job_accepts_applications(target_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.user_has_role('candidate'::public.user_role)
    and exists (
      select 1
      from public.jobs as job
      where job.id = target_job_id
        and job.status = 'open'
        and job.deleted_at is null
        and (job.expires_at is null or job.expires_at > now())
    );
$$;

create or replace function private.recruiter_can_access_candidate(target_candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.user_has_role('recruiter'::public.user_role)
    and exists (
      select 1
      from public.applications as application
      join public.jobs as job
        on job.id = application.job_id
      where application.candidate_id = target_candidate_id
        and job.recruiter_id = (select auth.uid())
    );
$$;

create or replace function private.recruiter_can_access_resume(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.user_has_role('recruiter'::public.user_role)
    and exists (
      select 1
      from public.applications as application
      join public.jobs as job
        on job.id = application.job_id
      where application.resume_path = target_storage_path
        and job.recruiter_id = (select auth.uid())
    );
$$;

create or replace function private.candidate_owns_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.user_has_role('candidate'::public.user_role)
    and exists (
      select 1
      from public.applications as application
      where application.id = target_application_id
        and application.candidate_id = (select auth.uid())
    );
$$;

create or replace function private.recruiter_owns_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.user_has_role('recruiter'::public.user_role)
    and exists (
      select 1
      from public.applications as application
      join public.jobs as job
        on job.id = application.job_id
      where application.id = target_application_id
        and job.recruiter_id = (select auth.uid())
    );
$$;

create or replace function private.assert_actor_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_role public.user_role;
  actor_id uuid;
begin
  case tg_table_name
    when 'profiles' then
      expected_role := 'candidate';
      actor_id := new.user_id;
    when 'jobs' then
      expected_role := 'recruiter';
      actor_id := new.recruiter_id;
    when 'applications' then
      expected_role := 'candidate';
      actor_id := new.candidate_id;
    when 'resume_analyses' then
      expected_role := 'candidate';
      actor_id := new.user_id;
    else
      raise exception 'Unsupported actor-role trigger table: %', tg_table_name
        using errcode = 'check_violation';
  end case;

  if not exists (
    select 1
    from public.users as app_user
    where app_user.id = actor_id
      and app_user.role = expected_role
  ) then
    raise exception '% must reference a % user', tg_table_name, expected_role
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  trusted_role public.user_role;
  supplied_name text;
begin
  -- Self-registration intentionally supports both product roles. Read the
  -- one-time requested role during signup, then persist it in the protected
  -- database column. RLS never authorizes from mutable user metadata or JWT
  -- user_metadata claims after this point.
  trusted_role := case
    when new.raw_user_meta_data ->> 'requested_role' = 'recruiter'
      then 'recruiter'::public.user_role
    else 'candidate'::public.user_role
  end;

  insert into public.users (id, email, role)
  values (new.id, lower(new.email), trusted_role);

  if trusted_role = 'candidate' then
    supplied_name := left(
      btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')),
      160
    );

    insert into public.profiles (user_id, full_name)
    values (new.id, supplied_name);
  end if;

  return new;
end;
$$;

create or replace function private.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.users
    set email = lower(new.email)
    where id = new.id;
  end if;

  return new;
end;
$$;

create or replace function private.notify_application_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_recruiter_id uuid;
  job_title text;
  candidate_name text;
begin
  select job.recruiter_id, job.title
  into job_recruiter_id, job_title
  from public.jobs as job
  where job.id = new.job_id;

  if tg_op = 'INSERT' then
    select nullif(profile.full_name, '')
    into candidate_name
    from public.profiles as profile
    where profile.user_id = new.candidate_id;

    insert into public.notifications (
      user_id,
      kind,
      application_id,
      title,
      message
    )
    values (
      job_recruiter_id,
      'application_received',
      new.id,
      'New application received',
      left(
        format(
          '%s applied for "%s".',
          coalesce(candidate_name, 'A candidate'),
          job_title
        ),
        2000
      )
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.notifications (
      user_id,
      kind,
      application_id,
      title,
      message
    )
    values (
      new.candidate_id,
      'application_status_changed',
      new.id,
      'Application status updated',
      left(
        format(
          'Your application for "%s" is now %s.',
          job_title,
          replace(new.status::text, '_', ' ')
        ),
        2000
      )
    );
  end if;

  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger profiles_set_completion
before insert or update on public.profiles
for each row execute function private.set_profile_completion();

create trigger jobs_set_published_at
before insert or update of status on public.jobs
for each row execute function private.set_job_published_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function private.set_updated_at();

create trigger applications_set_updated_at
before update on public.applications
for each row execute function private.set_updated_at();

create trigger resume_analyses_set_updated_at
before update on public.resume_analyses
for each row execute function private.set_updated_at();

create trigger ai_analyses_set_updated_at
before update on public.ai_analyses
for each row execute function private.set_updated_at();

create trigger notifications_normalize_read_state
before insert or update of is_read, read_at on public.notifications
for each row execute function private.normalize_notification_read_state();

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function private.set_updated_at();

create trigger profiles_assert_candidate_role
before insert or update of user_id on public.profiles
for each row execute function private.assert_actor_role();

create trigger jobs_assert_recruiter_role
before insert or update of recruiter_id on public.jobs
for each row execute function private.assert_actor_role();

create trigger applications_assert_candidate_role
before insert or update of candidate_id on public.applications
for each row execute function private.assert_actor_role();

create trigger resume_analyses_assert_candidate_role
before insert or update of user_id on public.resume_analyses
for each row execute function private.assert_actor_role();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function private.sync_auth_user_email();

create trigger applications_notify_after_insert
after insert on public.applications
for each row execute function private.notify_application_event();

create trigger applications_notify_after_status_update
after update of status on public.applications
for each row
when (old.status is distinct from new.status)
execute function private.notify_application_event();

-- The bucket is private, PDF-only, and capped at 5 MiB. The database stores
-- object paths, never public URLs; access is granted below through object RLS.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'resume-files',
  'resume-files',
  false,
  5242880,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Current Supabase Data API defaults no longer auto-expose newly-created
-- relations, so every API privilege is deliberate. The anon role receives only
-- public job reads. The authenticated role gets only the columns needed by
-- direct user operations; backend-only AI writes remain service-role-only.
revoke all privileges on table
  public.users,
  public.profiles,
  public.jobs,
  public.applications,
  public.resume_analyses,
  public.ai_analyses,
  public.notifications
from anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges on type
  public.user_role,
  public.job_status,
  public.application_status,
  public.analysis_status,
  public.notification_kind
from public, anon, authenticated, service_role;

grant usage on type
  public.user_role,
  public.job_status,
  public.application_status,
  public.analysis_status,
  public.notification_kind
to authenticated, service_role;
grant usage on type public.job_status to anon;

grant select on table public.users to authenticated;

grant select on table public.profiles to authenticated;
grant update (
  full_name,
  phone,
  headline,
  location,
  linkedin_url,
  github_url,
  portfolio_url,
  summary,
  skills,
  education,
  experience,
  certifications,
  resume_path
) on public.profiles to authenticated;

grant select on table public.jobs to anon, authenticated;
grant insert (
  recruiter_id,
  title,
  company_name,
  location,
  employment_type,
  salary_min,
  salary_max,
  currency,
  description,
  requirements,
  required_skills,
  status,
  expires_at
) on public.jobs to authenticated;
grant update (
  title,
  company_name,
  location,
  employment_type,
  salary_min,
  salary_max,
  currency,
  description,
  requirements,
  required_skills,
  status,
  expires_at,
  deleted_at
) on public.jobs to authenticated;

grant select on table public.applications to authenticated;
grant insert (
  job_id,
  candidate_id,
  resume_path,
  cover_letter
) on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

grant select on table public.resume_analyses to authenticated;
grant select on table public.ai_analyses to authenticated;

grant select on table public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;
grant delete on table public.notifications to authenticated;

grant select, insert, update, delete on table
  public.users,
  public.profiles,
  public.jobs,
  public.applications,
  public.resume_analyses,
  public.ai_analyses,
  public.notifications
to service_role;

revoke all on function private.set_updated_at()
from public, anon, authenticated, service_role;
revoke all on function private.set_job_published_at()
from public, anon, authenticated, service_role;
revoke all on function private.set_profile_completion()
from public, anon, authenticated, service_role;
revoke all on function private.normalize_notification_read_state()
from public, anon, authenticated, service_role;
revoke all on function private.user_has_role(public.user_role)
from public, anon, authenticated, service_role;
revoke all on function private.recruiter_owns_job(uuid)
from public, anon, authenticated, service_role;
revoke all on function private.job_accepts_applications(uuid)
from public, anon, authenticated, service_role;
revoke all on function private.recruiter_can_access_candidate(uuid)
from public, anon, authenticated, service_role;
revoke all on function private.recruiter_can_access_resume(text)
from public, anon, authenticated, service_role;
revoke all on function private.candidate_owns_application(uuid)
from public, anon, authenticated, service_role;
revoke all on function private.recruiter_owns_application(uuid)
from public, anon, authenticated, service_role;
revoke all on function private.assert_actor_role()
from public, anon, authenticated, service_role;
revoke all on function private.handle_new_auth_user()
from public, anon, authenticated, service_role;
revoke all on function private.sync_auth_user_email()
from public, anon, authenticated, service_role;
revoke all on function private.notify_application_event()
from public, anon, authenticated, service_role;

grant usage on schema private to authenticated, service_role;
grant execute on function private.user_has_role(public.user_role)
to authenticated, service_role;
grant execute on function private.recruiter_owns_job(uuid)
to authenticated, service_role;
grant execute on function private.job_accepts_applications(uuid)
to authenticated, service_role;
grant execute on function private.recruiter_can_access_candidate(uuid)
to authenticated, service_role;
grant execute on function private.recruiter_can_access_resume(text)
to authenticated, service_role;
grant execute on function private.candidate_owns_application(uuid)
to authenticated, service_role;
grant execute on function private.recruiter_owns_application(uuid)
to authenticated, service_role;

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.notifications enable row level security;

create policy "users_select_own_account"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

create policy "users_select_recruiter_applicants"
on public.users
for select
to authenticated
using (private.recruiter_can_access_candidate(id));

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  private.user_has_role('candidate')
  and (select auth.uid()) = user_id
);

create policy "profiles_select_recruiter_applicants"
on public.profiles
for select
to authenticated
using (private.recruiter_can_access_candidate(user_id));

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  private.user_has_role('candidate')
  and (select auth.uid()) = user_id
)
with check (
  private.user_has_role('candidate')
  and (select auth.uid()) = user_id
  and (
    resume_path is null
    or (
      split_part(resume_path, '/', 1) = (select auth.uid())::text
      and exists (
        select 1
        from public.resume_analyses as resume_analysis
        where resume_analysis.user_id = (select auth.uid())
          and resume_analysis.storage_path = profiles.resume_path
      )
    )
  )
);

create policy "jobs_select_public_open"
on public.jobs
for select
to anon
using (
  status = 'open'
  and deleted_at is null
  and (expires_at is null or expires_at > now())
);

create policy "jobs_select_candidate_open"
on public.jobs
for select
to authenticated
using (
  private.user_has_role('candidate')
  and status = 'open'
  and deleted_at is null
  and (expires_at is null or expires_at > now())
);

create policy "jobs_select_candidate_applied"
on public.jobs
for select
to authenticated
using (
  private.user_has_role('candidate')
  and exists (
    select 1
    from public.applications as application
    where application.job_id = jobs.id
      and application.candidate_id = (select auth.uid())
  )
);

create policy "jobs_select_recruiter_owned"
on public.jobs
for select
to authenticated
using (
  private.user_has_role('recruiter')
  and recruiter_id = (select auth.uid())
);

create policy "jobs_insert_recruiter_owned"
on public.jobs
for insert
to authenticated
with check (
  private.user_has_role('recruiter')
  and recruiter_id = (select auth.uid())
);

create policy "jobs_update_recruiter_owned"
on public.jobs
for update
to authenticated
using (
  private.user_has_role('recruiter')
  and recruiter_id = (select auth.uid())
)
with check (
  private.user_has_role('recruiter')
  and recruiter_id = (select auth.uid())
);

create policy "applications_select_candidate_owned"
on public.applications
for select
to authenticated
using (
  private.user_has_role('candidate')
  and candidate_id = (select auth.uid())
);

create policy "applications_select_recruiter_owned_jobs"
on public.applications
for select
to authenticated
using (private.recruiter_owns_job(job_id));

create policy "applications_insert_candidate_owned"
on public.applications
for insert
to authenticated
with check (
  private.user_has_role('candidate')
  and candidate_id = (select auth.uid())
  and split_part(resume_path, '/', 1) = (select auth.uid())::text
  and exists (
    select 1
    from public.profiles as profile
    where profile.user_id = (select auth.uid())
      and profile.resume_path = applications.resume_path
  )
  and private.job_accepts_applications(job_id)
);

create policy "applications_update_recruiter_owned_jobs"
on public.applications
for update
to authenticated
using (private.recruiter_owns_job(job_id))
with check (private.recruiter_owns_job(job_id));

create policy "applications_withdraw_candidate_owned"
on public.applications
for update
to authenticated
using (
  private.user_has_role('candidate')
  and candidate_id = (select auth.uid())
  and status not in ('rejected', 'withdrawn')
)
with check (
  private.user_has_role('candidate')
  and candidate_id = (select auth.uid())
  and status = 'withdrawn'
);

create policy "resume_analyses_select_candidate_owned"
on public.resume_analyses
for select
to authenticated
using (
  private.user_has_role('candidate')
  and user_id = (select auth.uid())
);

create policy "resume_analyses_select_recruiter_applicant_resume"
on public.resume_analyses
for select
to authenticated
using (private.recruiter_can_access_resume(storage_path));

create policy "ai_analyses_select_candidate_application"
on public.ai_analyses
for select
to authenticated
using (private.candidate_owns_application(application_id));

create policy "ai_analyses_select_recruiter_application"
on public.ai_analyses
for select
to authenticated
using (private.recruiter_owns_application(application_id));

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notifications_delete_own"
on public.notifications
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "talentsync_resume_owner_select"
on storage.objects;
create policy "talentsync_resume_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resume-files'
  and private.user_has_role('candidate')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "talentsync_resume_recruiter_select"
on storage.objects;
create policy "talentsync_resume_recruiter_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resume-files'
  and private.recruiter_can_access_resume(name)
);

drop policy if exists "talentsync_resume_owner_insert"
on storage.objects;
drop policy if exists "talentsync_resume_owner_update"
on storage.objects;
drop policy if exists "talentsync_resume_owner_delete"
on storage.objects;

-- Resume objects are mutated only by the Express backend with the service role.
-- This prevents authenticated clients from overwriting or deleting an object
-- after an application has captured its path as an immutable resume snapshot.

commit;
