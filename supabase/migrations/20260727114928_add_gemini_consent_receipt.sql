begin;

alter table public.resume_analyses
  add column gemini_consent_version text,
  add column gemini_consented_at timestamptz,
  add constraint resume_analyses_gemini_consent_pair check (
    (
      gemini_consent_version is null
      and gemini_consented_at is null
    )
    or (
      gemini_consent_version is not null
      and gemini_consented_at is not null
    )
  ),
  add constraint resume_analyses_gemini_consent_version_valid check (
    gemini_consent_version is null
    or (
      gemini_consent_version = btrim(gemini_consent_version)
      and char_length(gemini_consent_version) between 1 and 64
    )
  ),
  add constraint resume_analyses_gemini_consented_at_valid check (
    gemini_consented_at is null
    or (
      gemini_consented_at >= created_at - interval '5 minutes'
      and gemini_consented_at <= updated_at + interval '5 minutes'
    )
  );

comment on column public.resume_analyses.gemini_consent_version is
  'Version of the Gemini processing disclosure accepted by the candidate; current version: 2026-07-27.';

comment on column public.resume_analyses.gemini_consented_at is
  'Timestamp when the candidate accepted Gemini processing for this exact resume.';

commit;
