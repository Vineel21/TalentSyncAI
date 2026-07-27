import { describe, expect, it } from 'vitest';
import {
  buildRecruiterActivity,
  recruiterActivityWindowEnd,
  recruiterActivityWindowStart,
  toDashboardData,
} from '../src/modules/dashboard/types.js';

describe('recruiter dashboard activity', () => {
  const referenceDate = new Date('2026-07-27T12:00:00.000Z');

  it('builds a complete six-month series from application cohorts', () => {
    const activity = buildRecruiterActivity(
      [
        { created_at: '2026-02-12T10:00:00.000Z', status: 'interview' },
        { created_at: '2026-03-18T10:00:00.000Z', status: 'offer' },
        { created_at: '2026-03-21T10:00:00.000Z', status: 'rejected' },
        { created_at: '2026-06-04T10:00:00.000Z', status: 'under_review' },
        { created_at: '2026-07-10T10:00:00.000Z', status: 'applied' },
      ],
      referenceDate,
    );

    expect(activity).toEqual([
      { label: 'Feb', applicants: 1, interviews: 1 },
      { label: 'Mar', applicants: 2, interviews: 1 },
      { label: 'Apr', applicants: 0, interviews: 0 },
      { label: 'May', applicants: 0, interviews: 0 },
      { label: 'Jun', applicants: 1, interviews: 0 },
      { label: 'Jul', applicants: 1, interviews: 0 },
    ]);
  });

  it('returns an empty series when there are no applications', () => {
    expect(buildRecruiterActivity([], referenceDate)).toEqual([]);
  });

  it('ignores applications outside the current six-month window', () => {
    const activity = buildRecruiterActivity(
      [
        { created_at: '2026-01-31T23:59:59.000Z', status: 'offer' },
        { created_at: '2026-08-01T00:00:00.000Z', status: 'interview' },
        { created_at: '2026-07-01T00:00:00.000Z', status: 'offer' },
      ],
      referenceDate,
    );

    expect(activity.at(-1)).toEqual({ label: 'Jul', applicants: 1, interviews: 1 });
    expect(activity.reduce((total, point) => total + point.applicants, 0)).toBe(1);
  });

  it('returns an empty series when every application is outside the window', () => {
    expect(
      buildRecruiterActivity(
        [
          { created_at: '2026-01-31T23:59:59.000Z', status: 'offer' },
          { created_at: '2026-08-01T00:00:00.000Z', status: 'interview' },
        ],
        referenceDate,
      ),
    ).toEqual([]);
  });

  it('includes analytics in the serialized dashboard contract', () => {
    const dashboard = toDashboardData(
      {
        stats: {
          totalJobs: 1,
          openJobs: 1,
          totalApplicants: 1,
          pending: 0,
          shortlisted: 0,
          interviews: 1,
          rejected: 0,
          offers: 0,
          unreadNotifications: 0,
        },
        recentApplications: [],
        recommendedJobs: [],
        recentJobs: [],
        recentApplicants: [],
        activityApplications: [{ created_at: '2026-07-10T10:00:00.000Z', status: 'interview' }],
      },
      referenceDate,
    );

    expect(dashboard.analytics.at(-1)).toEqual({
      label: 'Jul',
      applicants: 1,
      interviews: 1,
    });
  });

  it('starts at the first UTC day five months before the reference month', () => {
    expect(recruiterActivityWindowStart(referenceDate).toISOString()).toBe(
      '2026-02-01T00:00:00.000Z',
    );
    expect(recruiterActivityWindowEnd(referenceDate).toISOString()).toBe(
      '2026-08-01T00:00:00.000Z',
    );
  });
});
