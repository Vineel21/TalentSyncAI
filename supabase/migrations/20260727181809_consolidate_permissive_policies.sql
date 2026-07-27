begin;

-- PostgreSQL ORs permissive policies for the same role and action. Preserve
-- that behavior explicitly in one policy per warned table/action so each row
-- is evaluated against a single policy.

drop policy if exists "users_select_own_account"
on public.users;
drop policy if exists "users_select_recruiter_applicants"
on public.users;

create policy "users_select_authorized"
on public.users
for select
to authenticated
using (
  (select auth.uid()) = id
  or private.recruiter_can_access_candidate(id)
);

drop policy if exists "profiles_select_own"
on public.profiles;
drop policy if exists "profiles_select_recruiter_applicants"
on public.profiles;

create policy "profiles_select_authorized"
on public.profiles
for select
to authenticated
using (
  (
    private.user_has_role('candidate')
    and (select auth.uid()) = user_id
  )
  or private.recruiter_can_access_candidate(user_id)
);

drop policy if exists "jobs_select_candidate_open"
on public.jobs;
drop policy if exists "jobs_select_candidate_applied"
on public.jobs;
drop policy if exists "jobs_select_recruiter_owned"
on public.jobs;

create policy "jobs_select_authenticated"
on public.jobs
for select
to authenticated
using (
  (
    private.user_has_role('candidate')
    and status = 'open'
    and deleted_at is null
    and (expires_at is null or expires_at > now())
  )
  or (
    private.user_has_role('candidate')
    and exists (
      select 1
      from public.applications as application
      where application.job_id = jobs.id
        and application.candidate_id = (select auth.uid())
    )
  )
  or (
    private.user_has_role('recruiter')
    and recruiter_id = (select auth.uid())
  )
);

drop policy if exists "applications_select_candidate_owned"
on public.applications;
drop policy if exists "applications_select_recruiter_owned_jobs"
on public.applications;

create policy "applications_select_authorized"
on public.applications
for select
to authenticated
using (
  (
    private.user_has_role('candidate')
    and candidate_id = (select auth.uid())
  )
  or private.recruiter_owns_job(job_id)
);

drop policy if exists "applications_update_recruiter_owned_jobs"
on public.applications;
drop policy if exists "applications_withdraw_candidate_owned"
on public.applications;

create policy "applications_update_authorized"
on public.applications
for update
to authenticated
using (
  private.recruiter_owns_job(job_id)
  or (
    private.user_has_role('candidate')
    and candidate_id = (select auth.uid())
    and status not in ('rejected', 'withdrawn')
  )
)
with check (
  private.recruiter_owns_job(job_id)
  or (
    private.user_has_role('candidate')
    and candidate_id = (select auth.uid())
    and status = 'withdrawn'
  )
);

drop policy if exists "resume_analyses_select_candidate_owned"
on public.resume_analyses;
drop policy if exists "resume_analyses_select_recruiter_applicant_resume"
on public.resume_analyses;

create policy "resume_analyses_select_authorized"
on public.resume_analyses
for select
to authenticated
using (
  (
    private.user_has_role('candidate')
    and user_id = (select auth.uid())
  )
  or private.recruiter_can_access_resume(storage_path)
);

drop policy if exists "ai_analyses_select_candidate_application"
on public.ai_analyses;
drop policy if exists "ai_analyses_select_recruiter_application"
on public.ai_analyses;

create policy "ai_analyses_select_authorized"
on public.ai_analyses
for select
to authenticated
using (
  private.candidate_owns_application(application_id)
  or private.recruiter_owns_application(application_id)
);

commit;
