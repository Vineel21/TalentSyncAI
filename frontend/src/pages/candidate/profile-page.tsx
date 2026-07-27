import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { ErrorState, PageLoading } from '@/components/ui/state-view';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage } from '@/lib/utils';
import { profileService } from '@/services/profile.service';
import { resumeService } from '@/services/resume.service';

const optionalUrl = z.union([
  z.literal(''),
  z
    .url('Enter a complete URL including https://')
    .refine((value) => value.startsWith('https://'), 'Use a secure https:// URL.'),
]);
const optionalDate = z.union([z.literal(''), z.iso.date()]);
const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100),
  phone: z.string().max(30),
  headline: z.string().max(160),
  location: z.string().max(120),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  summary: z.string().max(4_000),
  skills: z.string().max(1_000),
  experience: z.array(
    z.object({
      company: z.string().trim().min(1, 'Company is required.').max(200),
      title: z.string().trim().min(1, 'Job title is required.').max(200),
      location: z.string().max(200),
      startDate: optionalDate,
      endDate: optionalDate,
      current: z.boolean(),
      description: z.string().max(4_000),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string().trim().min(1, 'Institution is required.').max(200),
      degree: z.string().trim().min(1, 'Degree is required.').max(200),
      fieldOfStudy: z.string().max(200),
      startDate: optionalDate,
      endDate: optionalDate,
      description: z.string().max(2_000),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string().trim().min(1, 'Certification name is required.').max(200),
      issuer: z.string().max(200),
      issuedAt: optionalDate,
      credentialUrl: optionalUrl,
    }),
  ),
});
type FormValues = z.infer<typeof schema>;

const emptyExperience = {
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
};
const emptyEducation = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  description: '',
};
const emptyCertification = { name: '', issuer: '', issuedAt: '', credentialUrl: '' };

export function ProfilePage() {
  return <CandidateProfileEditor />;
}

export function CandidateProfileEditor({
  onboarding = false,
  onBack,
  onSaved,
}: {
  onboarding?: boolean;
  onBack?: () => void;
  onSaved?: () => void | Promise<void>;
}) {
  useDocumentTitle(onboarding ? 'Review your profile' : 'Profile');
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.getMine });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      headline: '',
      location: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      summary: '',
      skills: '',
      experience: [],
      education: [],
      certifications: [],
    },
  });
  const experience = useFieldArray({ control: form.control, name: 'experience' });
  const education = useFieldArray({ control: form.control, name: 'education' });
  const certifications = useFieldArray({ control: form.control, name: 'certifications' });
  const experienceValues = useWatch({ control: form.control, name: 'experience' });

  useEffect(() => {
    if (!profile.data) return;
    form.reset({
      fullName: profile.data.fullName ?? '',
      phone: profile.data.phone ?? '',
      headline: profile.data.headline ?? '',
      location: profile.data.location ?? '',
      linkedinUrl: profile.data.linkedinUrl ?? '',
      githubUrl: profile.data.githubUrl ?? '',
      portfolioUrl: profile.data.portfolioUrl ?? '',
      summary: profile.data.summary ?? '',
      skills: profile.data.skills.join(', '),
      experience: profile.data.experience.map((entry) => ({
        company: entry.company ?? '',
        title: entry.title ?? '',
        location: entry.location ?? '',
        startDate: entry.startDate ?? '',
        endDate: entry.endDate ?? '',
        current: entry.current ?? false,
        description: entry.description ?? '',
      })),
      education: profile.data.education.map((entry) => ({
        institution: entry.institution ?? '',
        degree: entry.degree ?? '',
        fieldOfStudy: entry.fieldOfStudy ?? '',
        startDate: entry.startDate ?? '',
        endDate: entry.endDate ?? '',
        description: entry.description ?? '',
      })),
      certifications: profile.data.certifications.map((entry) => ({
        name: entry.name ?? '',
        issuer: entry.issuer ?? '',
        issuedAt: entry.issuedAt ?? '',
        credentialUrl: entry.credentialUrl ?? '',
      })),
    });
  }, [form, profile.data]);

  const update = useMutation({
    mutationFn: (values: FormValues) =>
      profileService.update({
        ...values,
        phone: values.phone || null,
        headline: values.headline || null,
        location: values.location || null,
        linkedinUrl: values.linkedinUrl || null,
        githubUrl: values.githubUrl || null,
        portfolioUrl: values.portfolioUrl || null,
        summary: values.summary,
        skills: [
          ...new Set(
            values.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean),
          ),
        ],
        experience: values.experience.map((entry) => ({
          ...entry,
          location: entry.location || null,
          startDate: entry.startDate || null,
          endDate: entry.current ? null : entry.endDate || null,
          description: entry.description || null,
        })),
        education: values.education.map((entry) => ({
          ...entry,
          fieldOfStudy: entry.fieldOfStudy || null,
          startDate: entry.startDate || null,
          endDate: entry.endDate || null,
          description: entry.description || null,
        })),
        certifications: values.certifications.map((entry) => ({
          ...entry,
          issuer: entry.issuer || null,
          issuedAt: entry.issuedAt || null,
          credentialUrl: entry.credentialUrl || null,
        })),
      }),
    onSuccess: async (data) => {
      queryClient.setQueryData(['profile', 'me'], data);
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        onboarding ? 'Profile ready' : 'Profile saved',
        onboarding
          ? 'Next, we’ll find roles aligned to your profile.'
          : 'Your matching profile is up to date.',
      );
      await onSaved?.();
    },
    onError: (error) => toast.error('Couldn’t save profile', errorMessage(error)),
  });

  if (profile.isLoading) return <PageLoading label="Loading profile" />;
  if (profile.isError)
    return (
      <ErrorState message={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
    );
  if (!profile.data) return <PageLoading label="Loading profile" />;

  const submitProfile = (values: FormValues) => {
    if (onboarding) {
      form.clearErrors('root.onboarding');
      let hasMissingFields = false;
      const requiredTextFields: Array<{
        name: 'headline' | 'location' | 'summary' | 'skills';
        message: string;
      }> = [
        { name: 'headline', message: 'Add the type of role you’re targeting.' },
        { name: 'location', message: 'Add your location or Remote.' },
        { name: 'summary', message: 'Add a short professional summary.' },
        { name: 'skills', message: 'Add at least one skill.' },
      ];

      for (const field of requiredTextFields) {
        if (!values[field.name].trim()) {
          form.setError(field.name, { type: 'required', message: field.message });
          hasMissingFields = true;
        }
      }

      if (values.experience.length === 0 && values.education.length === 0) {
        form.setError('root.onboarding', {
          type: 'required',
          message:
            'Add at least one education or experience entry. Education alone is enough for freshers.',
        });
        hasMissingFields = true;
      }

      if (hasMissingFields) return;
    }

    update.mutate(values);
  };

  return (
    <form className="space-y-8" noValidate onSubmit={form.handleSubmit(submitProfile)}>
      {!onboarding ? (
        <>
          <PageHeader
            description="Keep your experience accurate so matches and recruiter summaries reflect your work."
            eyebrow="Candidate profile"
            title="Your professional story"
            action={
              <Button isLoading={update.isPending} type="submit">
                <Save aria-hidden="true" className="h-4 w-4" />
                Save profile
              </Button>
            }
          />
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Profile completion</span>
                  <span>{profile.data.profileCompletion}%</span>
                </div>
                <Progress className="mt-2" value={profile.data.profileCompletion} />
              </div>
              <Button asChild variant="outline">
                <Link className="flex items-center gap-2" to="/profile/upload-resume">
                  <FileText aria-hidden="true" className="h-4 w-4" />
                  {profile.data.resumePath ? 'Replace resume' : 'Upload resume'}
                </Link>
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Step 2</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Review your profile
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Check every field before we create your matches. Freshers can continue with education
            and do not need employment history.
          </p>
        </div>
      )}

      {form.formState.errors.root?.onboarding?.message ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive"
          role="alert"
        >
          {form.formState.errors.root.onboarding.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="fullName"
                label="Full name"
                error={form.formState.errors.fullName?.message}
              >
                <Input id="fullName" {...form.register('fullName')} />
              </FormField>
              <FormField id="phone" label="Phone" error={form.formState.errors.phone?.message}>
                <Input autoComplete="tel" id="phone" {...form.register('phone')} />
              </FormField>
              <FormField
                id="headline"
                label="Professional headline"
                error={form.formState.errors.headline?.message}
              >
                <Input
                  id="headline"
                  placeholder="Senior product engineer"
                  {...form.register('headline')}
                />
              </FormField>
              <FormField
                id="location"
                label="Location"
                error={form.formState.errors.location?.message}
              >
                <Input
                  id="location"
                  placeholder="Austin, TX or Remote"
                  {...form.register('location')}
                />
              </FormField>
              <FormField
                id="linkedinUrl"
                label="LinkedIn URL"
                error={form.formState.errors.linkedinUrl?.message}
              >
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/…"
                  {...form.register('linkedinUrl')}
                />
              </FormField>
              <FormField
                id="githubUrl"
                label="GitHub URL"
                error={form.formState.errors.githubUrl?.message}
              >
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/…"
                  {...form.register('githubUrl')}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField
                  id="portfolioUrl"
                  label="Portfolio URL"
                  error={form.formState.errors.portfolioUrl?.message}
                >
                  <Input
                    id="portfolioUrl"
                    placeholder="https://…"
                    {...form.register('portfolioUrl')}
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary and skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                id="summary"
                label="Professional summary"
                error={form.formState.errors.summary?.message}
                hint="Focus on the value you create, your strongest domain, and the scope of your experience."
              >
                <Textarea id="summary" rows={7} {...form.register('summary')} />
              </FormField>
              <FormField
                id="skills"
                label="Skills"
                error={form.formState.errors.skills?.message}
                hint="Separate skills with commas."
              >
                <Textarea
                  id="skills"
                  placeholder="TypeScript, React, Node.js, PostgreSQL"
                  rows={3}
                  {...form.register('skills')}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Experience</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Most recent experience first.</p>
              </div>
              <Button
                onClick={() => experience.append(emptyExperience)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {experience.fields.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No experience entries yet.
                </p>
              ) : (
                experience.fields.map((field, index) => (
                  <div className="rounded-xl border p-4" key={field.id}>
                    <div className="mb-4 flex justify-between">
                      <Badge variant="secondary">Experience {index + 1}</Badge>
                      <Button
                        aria-label={`Remove experience ${index + 1}`}
                        onClick={() => experience.remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        id={`experience-${index}-title`}
                        label="Job title"
                        error={form.formState.errors.experience?.[index]?.title?.message}
                      >
                        <Input
                          id={`experience-${index}-title`}
                          {...form.register(`experience.${index}.title`)}
                        />
                      </FormField>
                      <FormField
                        id={`experience-${index}-company`}
                        label="Company"
                        error={form.formState.errors.experience?.[index]?.company?.message}
                      >
                        <Input
                          id={`experience-${index}-company`}
                          {...form.register(`experience.${index}.company`)}
                        />
                      </FormField>
                      <FormField id={`experience-${index}-location`} label="Location">
                        <Input
                          id={`experience-${index}-location`}
                          {...form.register(`experience.${index}.location`)}
                        />
                      </FormField>
                      <FormField id={`experience-${index}-start`} label="Start date">
                        <Input
                          id={`experience-${index}-start`}
                          type="date"
                          {...form.register(`experience.${index}.startDate`)}
                        />
                      </FormField>
                      <FormField id={`experience-${index}-end`} label="End date">
                        <Input
                          disabled={experienceValues[index]?.current ?? false}
                          id={`experience-${index}-end`}
                          type="date"
                          {...form.register(`experience.${index}.endDate`)}
                        />
                      </FormField>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          type="checkbox"
                          {...form.register(`experience.${index}.current`)}
                        />
                        I currently work here
                      </label>
                      <div className="sm:col-span-2">
                        <FormField id={`experience-${index}-description`} label="Highlights">
                          <Textarea
                            id={`experience-${index}-description`}
                            rows={4}
                            {...form.register(`experience.${index}.description`)}
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Education</CardTitle>
              <Button
                onClick={() => education.append(emptyEducation)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.fields.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No education entries yet.
                </p>
              ) : (
                education.fields.map((field, index) => (
                  <div className="space-y-4 rounded-xl border p-4" key={field.id}>
                    <div className="flex justify-end">
                      <Button
                        aria-label={`Remove education ${index + 1}`}
                        onClick={() => education.remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <FormField
                      id={`education-${index}-institution`}
                      label="Institution"
                      error={form.formState.errors.education?.[index]?.institution?.message}
                    >
                      <Input
                        id={`education-${index}-institution`}
                        {...form.register(`education.${index}.institution`)}
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        id={`education-${index}-degree`}
                        label="Degree"
                        error={form.formState.errors.education?.[index]?.degree?.message}
                      >
                        <Input
                          id={`education-${index}-degree`}
                          {...form.register(`education.${index}.degree`)}
                        />
                      </FormField>
                      <FormField id={`education-${index}-field`} label="Field of study">
                        <Input
                          id={`education-${index}-field`}
                          {...form.register(`education.${index}.fieldOfStudy`)}
                        />
                      </FormField>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id={`education-${index}-start`} label="Start">
                        <Input
                          id={`education-${index}-start`}
                          type="date"
                          {...form.register(`education.${index}.startDate`)}
                        />
                      </FormField>
                      <FormField id={`education-${index}-end`} label="End">
                        <Input
                          id={`education-${index}-end`}
                          type="date"
                          {...form.register(`education.${index}.endDate`)}
                        />
                      </FormField>
                    </div>
                    <FormField id={`education-${index}-description`} label="Details">
                      <Textarea
                        id={`education-${index}-description`}
                        rows={3}
                        {...form.register(`education.${index}.description`)}
                      />
                    </FormField>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Certifications</CardTitle>
              <Button
                onClick={() => certifications.append(emptyCertification)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {certifications.fields.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No certifications yet.
                </p>
              ) : (
                certifications.fields.map((field, index) => (
                  <div className="space-y-4 rounded-xl border p-4" key={field.id}>
                    <div className="flex justify-end">
                      <Button
                        aria-label={`Remove certification ${index + 1}`}
                        onClick={() => certifications.remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <FormField id={`cert-${index}-name`} label="Certification">
                      <Input
                        id={`cert-${index}-name`}
                        {...form.register(`certifications.${index}.name`)}
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id={`cert-${index}-issuer`} label="Issuer">
                        <Input
                          id={`cert-${index}-issuer`}
                          {...form.register(`certifications.${index}.issuer`)}
                        />
                      </FormField>
                      <FormField id={`cert-${index}-date`} label="Issued date">
                        <Input
                          id={`cert-${index}-date`}
                          type="date"
                          {...form.register(`certifications.${index}.issuedAt`)}
                        />
                      </FormField>
                    </div>
                    <FormField
                      id={`cert-${index}-url`}
                      label="Credential URL"
                      error={form.formState.errors.certifications?.[index]?.credentialUrl?.message}
                    >
                      <Input
                        id={`cert-${index}-url`}
                        {...form.register(`certifications.${index}.credentialUrl`)}
                      />
                    </FormField>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {profile.data.resumePath ? (
            <Card className="p-5">
              <h2 className="font-bold">Resume on file</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your resume is securely attached to this profile.
              </p>
              <Button
                className="mt-4"
                onClick={async () => {
                  try {
                    const blob = await resumeService.download();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'resume.pdf';
                    link.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    toast.error('Couldn’t download resume', errorMessage(error));
                  }
                }}
                type="button"
                variant="outline"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Download resume
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border bg-card/95 p-3 shadow-lg backdrop-blur sm:mx-0 sm:rounded-xl lg:bottom-4">
        {onboarding ? (
          <Button disabled={update.isPending} onClick={onBack} type="button" variant="ghost">
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button isLoading={update.isPending} type="submit">
          <Save aria-hidden="true" className="h-4 w-4" />
          {onboarding ? 'Save and see matches' : 'Save all changes'}
        </Button>
      </div>
    </form>
  );
}
