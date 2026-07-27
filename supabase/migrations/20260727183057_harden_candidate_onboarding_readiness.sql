begin;

-- The profile JSON columns intentionally remain flexible, but reaching the
-- recommendation step requires at least one meaningful education or experience
-- entry. Enforce the same detail beneath the API so an empty JSON object cannot
-- be used to bypass profile refinement through the Data API.
create or replace function private.enforce_candidate_onboarding_entry_quality()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role' then
    return new;
  end if;

  if old.onboarding_completed_at is null
    and new.onboarding_step = 3
    and not (
      exists (
        select 1
        from jsonb_array_elements(new.education) as education_entry
        where jsonb_typeof(education_entry) = 'object'
          and nullif(btrim(education_entry ->> 'institution'), '') is not null
          and nullif(btrim(education_entry ->> 'degree'), '') is not null
      )
      or exists (
        select 1
        from jsonb_array_elements(new.experience) as experience_entry
        where jsonb_typeof(experience_entry) = 'object'
          and nullif(btrim(experience_entry ->> 'company'), '') is not null
          and nullif(btrim(experience_entry ->> 'title'), '') is not null
      )
    )
  then
    raise exception 'A complete education or experience entry is required before step three'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_candidate_onboarding_entry_quality()
from public, anon, authenticated, service_role;

create trigger profiles_enforce_candidate_onboarding_entry_quality
before update of
  onboarding_step,
  onboarding_completed_at
on public.profiles
for each row execute function private.enforce_candidate_onboarding_entry_quality();

commit;
