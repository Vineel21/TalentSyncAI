-- Local/demo data only. Authentication identities are never seeded here.
-- Example jobs are inserted only when a trusted recruiter already exists.
do $$
declare
  seed_recruiter_id uuid;
begin
  select app_user.id
  into seed_recruiter_id
  from public.users as app_user
  where app_user.role = 'recruiter'
  order by app_user.created_at, app_user.id
  limit 1;

  if seed_recruiter_id is null then
    raise notice 'TalentSync seed skipped: create a recruiter account first.';
    return;
  end if;

  insert into public.jobs (
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
  )
  select
    seed_recruiter_id,
    seed_job.title,
    seed_job.company_name,
    seed_job.location,
    seed_job.employment_type,
    seed_job.salary_min,
    seed_job.salary_max,
    'USD',
    seed_job.description,
    seed_job.requirements,
    seed_job.required_skills,
    'open',
    now() + interval '90 days'
  from (
    values
      (
        'Frontend Developer',
        'TalentSync Demo',
        'Remote',
        'full_time',
        70000,
        105000,
        'Build accessible, high-quality React experiences for a modern recruiting platform.',
        'Three or more years building production web applications with TypeScript and React.',
        '["React", "TypeScript", "Tailwind CSS", "TanStack Query"]'::jsonb
      ),
      (
        'Backend Developer',
        'TalentSync Demo',
        'Bengaluru, India',
        'full_time',
        75000,
        115000,
        'Design secure REST APIs and reliable asynchronous workflows for recruiting products.',
        'Strong Node.js, PostgreSQL, API security, testing, and production operations experience.',
        '["Node.js", "Express", "PostgreSQL", "Supabase"]'::jsonb
      ),
      (
        'Full Stack Developer',
        'TalentSync Demo',
        'Remote',
        'contract',
        65000,
        100000,
        'Deliver end-to-end product features across a React frontend and TypeScript API.',
        'Experience owning features from database design through polished user interfaces.',
        '["React", "TypeScript", "Node.js", "PostgreSQL"]'::jsonb
      ),
      (
        'UI UX Designer',
        'TalentSync Demo',
        'Hyderabad, India',
        'full_time',
        55000,
        85000,
        'Create intuitive candidate and recruiter workflows grounded in user research.',
        'A strong product design portfolio with accessible responsive web application work.',
        '["Figma", "Design Systems", "User Research", "Accessibility"]'::jsonb
      ),
      (
        'Cloud Engineer',
        'TalentSync Demo',
        'Remote',
        'full_time',
        80000,
        125000,
        'Build secure deployment, observability, and reliability foundations for the platform.',
        'Hands-on cloud infrastructure, CI/CD, containers, security, and incident response skills.',
        '["AWS", "Docker", "CI/CD", "Observability"]'::jsonb
      )
  ) as seed_job (
    title,
    company_name,
    location,
    employment_type,
    salary_min,
    salary_max,
    description,
    requirements,
    required_skills
  )
  where not exists (
    select 1
    from public.jobs as existing_job
    where existing_job.recruiter_id = seed_recruiter_id
      and existing_job.title = seed_job.title
      and existing_job.company_name = seed_job.company_name
      and existing_job.deleted_at is null
  );
end;
$$;
