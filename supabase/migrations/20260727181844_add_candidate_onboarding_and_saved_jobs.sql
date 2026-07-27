begin;

alter table public.profiles
  add column onboarding_step smallint not null default 1,
  add column onboarding_source text,
  add column onboarding_completed_at timestamptz,
  add column recommendations_skipped_at timestamptz,
  add constraint profiles_onboarding_step_range
    check (onboarding_step between 1 and 3),
  add constraint profiles_onboarding_source_valid
    check (
      onboarding_source is null
      or onboarding_source in ('resume', 'manual')
    ),
  add constraint profiles_onboarding_source_required
    check (
      onboarding_step = 1
      or onboarding_source is not null
    ),
  add constraint profiles_onboarding_completed_at_valid
    check (
      onboarding_completed_at is null
      or (
        onboarding_step = 3
        and onboarding_source is not null
        and onboarding_completed_at >= created_at
      )
    ),
  add constraint profiles_recommendations_skipped_at_valid
    check (
      recommendations_skipped_at is null
      or (
        onboarding_completed_at is not null
        and recommendations_skipped_at >= onboarding_completed_at
      )
    );

-- Profiles that predate progressive onboarding have already been using the
-- product, so mark them complete. Profiles created after this migration retain
-- the step-one default and null completion timestamp. Temporarily suspend the
-- generic profile triggers so this compatibility backfill does not make every
-- existing profile look newly edited or recalculate unrelated profile data.
alter table public.profiles disable trigger profiles_set_updated_at;
alter table public.profiles disable trigger profiles_set_completion;

update public.profiles
set
  onboarding_step = 3,
  onboarding_source = case
    when resume_path is null then 'manual'
    else 'resume'
  end,
  onboarding_completed_at = greatest(now(), created_at);

alter table public.profiles enable trigger profiles_set_completion;
alter table public.profiles enable trigger profiles_set_updated_at;

-- Enforce the same state machine below the Express API. This keeps a candidate
-- from bypassing required profile fields through the Data API and replaces
-- client-supplied completion timestamps with the database clock.
create or replace function private.enforce_candidate_onboarding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_is_ready boolean;
begin
  -- Trusted maintenance and seed operations retain full access. Normal
  -- candidate transitions are validated below.
  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if old.onboarding_completed_at is not null then
    if row(
      new.onboarding_step,
      new.onboarding_source,
      new.onboarding_completed_at,
      new.recommendations_skipped_at
    ) is distinct from row(
      old.onboarding_step,
      old.onboarding_source,
      old.onboarding_completed_at,
      old.recommendations_skipped_at
    ) then
      raise exception 'Completed onboarding cannot be changed'
        using errcode = 'check_violation';
    end if;

    return new;
  end if;

  if new.onboarding_step > old.onboarding_step + 1 then
    raise exception 'Onboarding steps must be completed in order'
      using errcode = 'check_violation';
  end if;

  if new.onboarding_step >= 2 and new.onboarding_source is null then
    raise exception 'An onboarding source is required after step one'
      using errcode = 'check_violation';
  end if;

  profile_is_ready :=
    btrim(new.full_name) <> ''
    and nullif(btrim(coalesce(new.headline, '')), '') is not null
    and nullif(btrim(coalesce(new.location, '')), '') is not null
    and btrim(new.summary) <> ''
    and jsonb_array_length(new.skills) > 0
    and (
      exists (
        select 1
        from jsonb_array_elements(new.education) as education_entry
        where jsonb_typeof(education_entry) = 'object'
      )
      or exists (
        select 1
        from jsonb_array_elements(new.experience) as experience_entry
        where jsonb_typeof(experience_entry) = 'object'
      )
    );

  if new.onboarding_step = 3 and not profile_is_ready then
    raise exception 'Required profile fields must be completed before step three'
      using errcode = 'check_violation';
  end if;

  if new.onboarding_completed_at is not null then
    if old.onboarding_step <> 3
      or new.onboarding_step <> 3
      or new.onboarding_source is null
      or not profile_is_ready
    then
      raise exception 'Complete each onboarding step before finishing'
        using errcode = 'check_violation';
    end if;

    new.onboarding_completed_at := now();
    if new.recommendations_skipped_at is not null then
      new.recommendations_skipped_at := new.onboarding_completed_at;
    end if;
  elsif new.recommendations_skipped_at is not null then
    raise exception 'Recommendations can only be skipped when onboarding completes'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_candidate_onboarding()
from public, anon, authenticated, service_role;

create trigger profiles_enforce_candidate_onboarding
before update of
  onboarding_step,
  onboarding_source,
  onboarding_completed_at,
  recommendations_skipped_at
on public.profiles
for each row execute function private.enforce_candidate_onboarding();

grant update (
  onboarding_step,
  onboarding_source,
  onboarding_completed_at,
  recommendations_skipped_at
) on public.profiles to authenticated;

create table public.saved_jobs (
  candidate_id uuid not null references public.profiles (user_id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_jobs_pkey primary key (candidate_id, job_id)
);

-- The primary key supports candidate/job lookups. These indexes additionally
-- cover reverse job lookups/cascades and a candidate's newest-first saved list.
create index saved_jobs_job_id_idx
  on public.saved_jobs (job_id);

create index saved_jobs_candidate_created_at_idx
  on public.saved_jobs (candidate_id, created_at desc);

alter table public.saved_jobs enable row level security;

create policy "saved_jobs_select_own"
on public.saved_jobs
for select
to authenticated
using (
  (select private.user_has_role('candidate'::public.user_role))
  and candidate_id = (select auth.uid())
);

create policy "saved_jobs_insert_own"
on public.saved_jobs
for insert
to authenticated
with check (
  (select private.user_has_role('candidate'::public.user_role))
  and candidate_id = (select auth.uid())
  and private.job_accepts_applications(job_id)
);

create policy "saved_jobs_delete_own"
on public.saved_jobs
for delete
to authenticated
using (
  (select private.user_has_role('candidate'::public.user_role))
  and candidate_id = (select auth.uid())
);

-- A saved job remains visible to its candidate if it later closes or expires.
-- Soft-deleted jobs stay hidden.
drop policy if exists "jobs_select_authenticated"
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
    private.user_has_role('candidate')
    and deleted_at is null
    and exists (
      select 1
      from public.saved_jobs as saved_job
      where saved_job.job_id = jobs.id
        and saved_job.candidate_id = (select auth.uid())
    )
  )
  or (
    private.user_has_role('recruiter')
    and recruiter_id = (select auth.uid())
  )
);

-- Supabase can use hardened Data API defaults, so make the new relation's API
-- surface explicit. Saved jobs are immutable; there is intentionally no UPDATE.
revoke all privileges on table public.saved_jobs
from public, anon, authenticated, service_role;

grant select, delete on table public.saved_jobs
to authenticated;
grant insert (candidate_id, job_id) on public.saved_jobs
to authenticated;

grant select, insert, delete on table public.saved_jobs
to service_role;

commit;
