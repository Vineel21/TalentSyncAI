import type {
  AnalysisStatus,
  ApplicationStatus,
  EmploymentType,
  JobStatus,
  UserRole,
} from '../config/database.types.js';

export interface SeedAccount {
  key: string;
  email: string;
  fullName: string;
  role: UserRole;
  unreadTarget: number;
}

export interface RecruiterSeed extends SeedAccount {
  role: 'recruiter';
  companyName: string;
}

export interface EducationSeed {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ExperienceSeed {
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

export interface CertificationSeed {
  name: string;
  issuer: string | null;
  issuedAt: string | null;
  credentialUrl: string | null;
}

export interface ResumeVersionSeed {
  id: string;
  key: string;
  filename: string;
  createdAt: string;
  summary?: string;
  skills?: string[];
  certifications?: CertificationSeed[];
  highlights: string[];
}

export interface CandidateSeed extends SeedAccount {
  role: 'candidate';
  phone: string;
  headline: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string | null;
  portfolioUrl: string | null;
  summary: string;
  skills: string[];
  education: EducationSeed[];
  experience: ExperienceSeed[];
  certifications: CertificationSeed[];
  resumes: ResumeVersionSeed[];
  currentResumeKey: string;
}

export interface JobSeed {
  id: string;
  key: string;
  recruiterKey: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  description: string;
  requirements: string;
  requiredSkills: string[];
  status: JobStatus;
  createdAt: string;
  expiresAt: string | null;
}

export interface ApplicationSeed {
  id: string;
  key: string;
  jobKey: string;
  candidateKey: string;
  resumeKey?: string;
  status: ApplicationStatus;
  score: number | null;
  analysisStatus: AnalysisStatus;
  createdAt: string;
  coverLetter: string;
}

export const DEMO_SEED_VERSION = '2026-07-27-v1';

export const recruiters: RecruiterSeed[] = [
  {
    key: 'maya',
    email: 'maya.recruiter@talentsync.test',
    fullName: 'Maya Nair',
    role: 'recruiter',
    companyName: 'NovaStack Labs',
    unreadTarget: 3,
  },
  {
    key: 'arjun',
    email: 'arjun.recruiter@talentsync.test',
    fullName: 'Arjun Rao',
    role: 'recruiter',
    companyName: 'FinEdge Analytics',
    unreadTarget: 2,
  },
  {
    key: 'priya',
    email: 'priya.recruiter@talentsync.test',
    fullName: 'Priya Menon',
    role: 'recruiter',
    companyName: 'CareGrid Health',
    unreadTarget: 4,
  },
];

export const candidates: CandidateSeed[] = [
  {
    key: 'aarav',
    email: 'aarav.fresher@talentsync.test',
    fullName: 'Aarav Sharma',
    role: 'candidate',
    unreadTarget: 2,
    phone: '+91 90000 10001',
    headline: 'Frontend Developer | 2026 Graduate',
    location: 'Bengaluru, India',
    linkedinUrl: 'https://www.linkedin.com/in/aarav-sharma-demo',
    githubUrl: 'https://github.com/aarav-sharma-demo',
    portfolioUrl: 'https://aarav-sharma-demo.example.com',
    summary:
      'Computer science fresher building accessible React applications with TypeScript. Strong project portfolio and internship exposure, with no full-time experience yet.',
    skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Git', 'REST APIs'],
    education: [
      {
        institution: 'RV College of Engineering',
        degree: 'Bachelor of Engineering',
        fieldOfStudy: 'Computer Science',
        startDate: '2022-08',
        endDate: '2026-05',
        description: 'CGPA 8.7/10; frontend lead for the campus developer club.',
      },
    ],
    experience: [
      {
        company: 'PixelSpring',
        title: 'Frontend Engineering Intern',
        location: 'Remote',
        startDate: '2025-05',
        endDate: '2025-08',
        current: false,
        description:
          'Built reusable React components and improved Lighthouse accessibility from 78 to 94.',
      },
    ],
    certifications: [
      {
        name: 'Meta Front-End Developer',
        issuer: 'Coursera',
        issuedAt: '2025-11',
        credentialUrl: 'https://credentials.example.com/aarav-meta-frontend',
      },
    ],
    currentResumeKey: 'current',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000001',
        key: 'current',
        filename: 'aarav-sharma-frontend-fresher.pdf',
        createdAt: '2026-07-01T09:00:00.000Z',
        highlights: [
          'Built a campus placement portal used by 1,200 students.',
          'Created an accessible expense tracker with React and TypeScript.',
          'Seeking a first full-time software engineering role.',
        ],
      },
    ],
  },
  {
    key: 'meera',
    email: 'meera.backend@talentsync.test',
    fullName: 'Meera Iyer',
    role: 'candidate',
    unreadTarget: 1,
    phone: '+91 90000 10002',
    headline: 'Senior Backend Engineer | Node.js and Distributed Systems',
    location: 'Pune, India',
    linkedinUrl: 'https://www.linkedin.com/in/meera-iyer-demo',
    githubUrl: 'https://github.com/meera-iyer-demo',
    portfolioUrl: null,
    summary:
      'Backend engineer with six years of experience designing secure Node.js services, event-driven systems, and high-volume PostgreSQL platforms.',
    skills: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Redis', 'AWS', 'Kafka', 'Docker'],
    education: [
      {
        institution: 'Savitribai Phule Pune University',
        degree: 'Bachelor of Technology',
        fieldOfStudy: 'Information Technology',
        startDate: '2014-07',
        endDate: '2018-05',
        description: 'Graduated with distinction.',
      },
    ],
    experience: [
      {
        company: 'LedgerLoop',
        title: 'Senior Backend Engineer',
        location: 'Pune, India',
        startDate: '2023-04',
        endDate: null,
        current: true,
        description:
          'Leads a payments platform processing 15 million monthly events with 99.95% availability.',
      },
      {
        company: 'ParcelGrid',
        title: 'Backend Engineer',
        location: 'Bengaluru, India',
        startDate: '2020-01',
        endDate: '2023-03',
        current: false,
        description:
          'Reduced order API p95 latency by 42% through query optimization and Redis caching.',
      },
      {
        company: 'CodeHarbor',
        title: 'Software Engineer',
        location: 'Pune, India',
        startDate: '2018-07',
        endDate: '2019-12',
        current: false,
        description: 'Built TypeScript REST APIs and automated integration testing.',
      },
    ],
    certifications: [
      {
        name: 'AWS Certified Developer - Associate',
        issuer: 'Amazon Web Services',
        issuedAt: '2026-04',
        credentialUrl: 'https://credentials.example.com/meera-aws-developer',
      },
    ],
    currentResumeKey: 'v2',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000002',
        key: 'v1',
        filename: 'meera-iyer-backend-v1.pdf',
        createdAt: '2026-02-01T09:00:00.000Z',
        summary:
          'Backend engineer with six years of Node.js, PostgreSQL, Redis, and event-driven system experience.',
        certifications: [],
        highlights: [
          'Processed 15 million monthly payment events.',
          'Reduced API p95 latency by 42%.',
          'Mentored four junior engineers.',
        ],
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        key: 'v2',
        filename: 'meera-iyer-backend-v2.pdf',
        createdAt: '2026-04-20T09:00:00.000Z',
        highlights: [
          'Processed 15 million monthly payment events.',
          'Reduced API p95 latency by 42%.',
          'Added AWS Developer certification and Kafka migration leadership.',
        ],
      },
    ],
  },
  {
    key: 'rohan',
    email: 'rohan.data@talentsync.test',
    fullName: 'Rohan Gupta',
    role: 'candidate',
    unreadTarget: 3,
    phone: '+91 90000 10003',
    headline: 'Data Analyst | SQL, Python and Power BI',
    location: 'Hyderabad, India',
    linkedinUrl: 'https://www.linkedin.com/in/rohan-gupta-demo',
    githubUrl: 'https://github.com/rohan-gupta-demo',
    portfolioUrl: 'https://rohan-gupta-demo.example.com',
    summary:
      'Data analyst with three years of experience turning retail and operations data into decision-ready dashboards and forecasting models.',
    skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Statistics', 'Pandas', 'Data Visualization'],
    education: [
      {
        institution: 'Osmania University',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Statistics',
        startDate: '2018-07',
        endDate: '2021-05',
        description: 'Coursework in probability, regression, and experimental design.',
      },
    ],
    experience: [
      {
        company: 'RetailPulse',
        title: 'Data Analyst',
        location: 'Hyderabad, India',
        startDate: '2023-01',
        endDate: null,
        current: true,
        description:
          'Owns sales and inventory dashboards used by 70 regional managers; cut weekly reporting by 12 hours.',
      },
      {
        company: 'MarketMint',
        title: 'Junior Analyst',
        location: 'Hyderabad, India',
        startDate: '2021-07',
        endDate: '2022-12',
        current: false,
        description: 'Automated Excel reporting and built customer cohort analyses.',
      },
    ],
    certifications: [
      {
        name: 'Microsoft Power BI Data Analyst',
        issuer: 'Microsoft',
        issuedAt: '2024-09',
        credentialUrl: 'https://credentials.example.com/rohan-power-bi',
      },
    ],
    currentResumeKey: 'current',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000004',
        key: 'current',
        filename: 'rohan-gupta-data-analyst.pdf',
        createdAt: '2026-05-02T09:00:00.000Z',
        highlights: [
          'Built Power BI dashboards for 70 regional managers.',
          'Automated 12 hours of weekly reporting.',
          'Created a demand forecast that reduced stock-outs by 9%.',
        ],
      },
    ],
  },
  {
    key: 'sana',
    email: 'sana.design@talentsync.test',
    fullName: 'Sana Khan',
    role: 'candidate',
    unreadTarget: 2,
    phone: '+91 90000 10004',
    headline: 'Product Designer | Research and Design Systems',
    location: 'Mumbai, India',
    linkedinUrl: 'https://www.linkedin.com/in/sana-khan-demo',
    githubUrl: null,
    portfolioUrl: 'https://sana-khan-demo.example.com',
    summary:
      'Product designer with four years of experience simplifying complex SaaS workflows through research, prototyping, accessibility, and scalable design systems.',
    skills: [
      'Figma',
      'User Research',
      'Design Systems',
      'Prototyping',
      'Accessibility',
      'Usability Testing',
    ],
    education: [
      {
        institution: 'MIT Institute of Design',
        degree: 'Bachelor of Design',
        fieldOfStudy: 'User Experience Design',
        startDate: '2017-07',
        endDate: '2021-05',
        description: 'Capstone focused on accessible financial services.',
      },
    ],
    experience: [
      {
        company: 'FlowPilot',
        title: 'Product Designer',
        location: 'Mumbai, India',
        startDate: '2023-02',
        endDate: null,
        current: true,
        description:
          'Redesigned onboarding and improved activation by 18%; maintains a 120-component design system.',
      },
      {
        company: 'BrightCart',
        title: 'UX Designer',
        location: 'Mumbai, India',
        startDate: '2021-06',
        endDate: '2023-01',
        current: false,
        description: 'Ran usability studies and shipped responsive commerce journeys.',
      },
    ],
    certifications: [],
    currentResumeKey: 'current',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000005',
        key: 'current',
        filename: 'sana-khan-product-designer.pdf',
        createdAt: '2026-01-25T09:00:00.000Z',
        highlights: [
          'Improved onboarding activation by 18%.',
          'Built and governed a 120-component design system.',
          'Completed 35 moderated usability sessions.',
        ],
      },
    ],
  },
  {
    key: 'vikram',
    email: 'vikram.cloud@talentsync.test',
    fullName: 'Vikram Singh',
    role: 'candidate',
    unreadTarget: 1,
    phone: '+91 90000 10005',
    headline: 'Senior DevOps and Site Reliability Engineer',
    location: 'Remote, India',
    linkedinUrl: 'https://www.linkedin.com/in/vikram-singh-demo',
    githubUrl: 'https://github.com/vikram-singh-demo',
    portfolioUrl: null,
    summary:
      'DevOps and SRE specialist with eight years of experience operating Kubernetes platforms, infrastructure as code, observability, and incident response.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD', 'Prometheus', 'Grafana', 'Linux'],
    education: [
      {
        institution: 'Delhi Technological University',
        degree: 'Bachelor of Technology',
        fieldOfStudy: 'Computer Engineering',
        startDate: '2010-07',
        endDate: '2014-05',
        description: null,
      },
    ],
    experience: [
      {
        company: 'OrbitCloud',
        title: 'Senior Site Reliability Engineer',
        location: 'Remote',
        startDate: '2021-03',
        endDate: null,
        current: true,
        description:
          'Runs a 60-cluster Kubernetes platform and reduced high-severity incidents by 35%.',
      },
      {
        company: 'TravelMesh',
        title: 'DevOps Engineer',
        location: 'Gurugram, India',
        startDate: '2017-01',
        endDate: '2021-02',
        current: false,
        description:
          'Introduced Terraform and deployment automation, reducing release time from two hours to 18 minutes.',
      },
      {
        company: 'NetAxis',
        title: 'Systems Engineer',
        location: 'Noida, India',
        startDate: '2014-07',
        endDate: '2016-12',
        current: false,
        description: 'Administered Linux systems and production monitoring.',
      },
    ],
    certifications: [
      {
        name: 'Certified Kubernetes Administrator',
        issuer: 'Cloud Native Computing Foundation',
        issuedAt: '2025-03',
        credentialUrl: 'https://credentials.example.com/vikram-cka',
      },
    ],
    currentResumeKey: 'current',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000006',
        key: 'current',
        filename: 'vikram-singh-devops-sre.pdf',
        createdAt: '2026-02-10T09:00:00.000Z',
        highlights: [
          'Operates 60 Kubernetes clusters.',
          'Reduced severity-one incidents by 35%.',
          'Cut release time from two hours to 18 minutes.',
        ],
      },
    ],
  },
  {
    key: 'nisha',
    email: 'nisha.qa@talentsync.test',
    fullName: 'Nisha Patel',
    role: 'candidate',
    unreadTarget: 2,
    phone: '+91 90000 10006',
    headline: 'QA Automation Engineer | Career Switcher',
    location: 'Ahmedabad, India',
    linkedinUrl: 'https://www.linkedin.com/in/nisha-patel-demo',
    githubUrl: 'https://github.com/nisha-patel-demo',
    portfolioUrl: null,
    summary:
      'Customer-support professional turned QA automation engineer, combining strong product empathy with Playwright, Cypress, API testing, and defect analysis.',
    skills: ['Playwright', 'Cypress', 'JavaScript', 'Postman', 'API Testing', 'SQL', 'Jira'],
    education: [
      {
        institution: 'Gujarat University',
        degree: 'Bachelor of Commerce',
        fieldOfStudy: 'Business Administration',
        startDate: '2016-07',
        endDate: '2019-05',
        description: null,
      },
    ],
    experience: [
      {
        company: 'SupportSphere',
        title: 'QA Automation Associate',
        location: 'Ahmedabad, India',
        startDate: '2025-01',
        endDate: null,
        current: true,
        description:
          'Built 140 Playwright regression tests and reduced escaped checkout defects by 28%.',
      },
      {
        company: 'SupportSphere',
        title: 'Senior Customer Support Specialist',
        location: 'Ahmedabad, India',
        startDate: '2021-04',
        endDate: '2024-12',
        current: false,
        description:
          'Owned defect reproduction and partnered with engineering on incident analysis.',
      },
    ],
    certifications: [
      {
        name: 'ISTQB Certified Tester Foundation Level',
        issuer: 'ISTQB',
        issuedAt: '2025-08',
        credentialUrl: 'https://credentials.example.com/nisha-istqb',
      },
    ],
    currentResumeKey: 'current',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000007',
        key: 'current',
        filename: 'nisha-patel-qa-career-switch.pdf',
        createdAt: '2026-05-01T09:00:00.000Z',
        highlights: [
          'Transitioned from customer support into QA automation.',
          'Built 140 Playwright regression tests.',
          'Reduced escaped checkout defects by 28%.',
        ],
      },
    ],
  },
  {
    key: 'kavya',
    email: 'kavya.health@talentsync.test',
    fullName: 'Kavya Reddy',
    role: 'candidate',
    unreadTarget: 3,
    phone: '+91 90000 10007',
    headline: 'Healthcare Product Analyst | FHIR and Clinical Workflows',
    location: 'Chennai, India',
    linkedinUrl: 'https://www.linkedin.com/in/kavya-reddy-demo',
    githubUrl: null,
    portfolioUrl: 'https://kavya-reddy-demo.example.com',
    summary:
      'Healthcare product analyst with five years of experience translating clinical workflows into clear requirements, analytics, and interoperable digital-health products.',
    skills: [
      'FHIR',
      'HL7',
      'SQL',
      'Tableau',
      'Jira',
      'Requirements Analysis',
      'Healthcare Analytics',
    ],
    education: [
      {
        institution: 'SRM Institute of Science and Technology',
        degree: 'Master of Business Administration',
        fieldOfStudy: 'Healthcare Management',
        startDate: '2019-07',
        endDate: '2021-05',
        description: 'Specialized in hospital operations and health informatics.',
      },
      {
        institution: 'University of Madras',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Biotechnology',
        startDate: '2016-07',
        endDate: '2019-05',
        description: null,
      },
    ],
    experience: [
      {
        company: 'MediBridge',
        title: 'Senior Product Analyst',
        location: 'Chennai, India',
        startDate: '2024-01',
        endDate: null,
        current: true,
        description:
          'Leads FHIR integration requirements and reduced patient onboarding time by 22%.',
      },
      {
        company: 'ClinicFlow',
        title: 'Business Analyst',
        location: 'Chennai, India',
        startDate: '2021-06',
        endDate: '2023-12',
        current: false,
        description:
          'Mapped clinical workflows and delivered Tableau adoption dashboards for hospital teams.',
      },
    ],
    certifications: [
      {
        name: 'HL7 FHIR Proficiency Certificate',
        issuer: 'HL7 International',
        issuedAt: '2024-06',
        credentialUrl: 'https://credentials.example.com/kavya-fhir',
      },
    ],
    currentResumeKey: 'current',
    resumes: [
      {
        id: '30000000-0000-4000-8000-000000000008',
        key: 'current',
        filename: 'kavya-reddy-healthcare-analyst.pdf',
        createdAt: '2026-05-20T09:00:00.000Z',
        highlights: [
          'Reduced patient onboarding time by 22%.',
          'Led requirements for three FHIR integrations.',
          'Built hospital adoption dashboards in Tableau.',
        ],
      },
    ],
  },
];

export const jobs: JobSeed[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    key: 'novastack_frontend',
    recruiterKey: 'maya',
    title: 'Junior Frontend Engineer',
    companyName: 'NovaStack Labs',
    location: 'Bengaluru, India',
    employmentType: 'full_time',
    salaryMin: 700_000,
    salaryMax: 1_100_000,
    currency: 'INR',
    description:
      'Build accessible customer-facing React workflows for a growing B2B SaaS platform.',
    requirements:
      'Strong JavaScript fundamentals, hands-on React and TypeScript projects, and an understanding of responsive accessible interfaces.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Git'],
    status: 'open',
    createdAt: '2026-04-25T08:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    key: 'novastack_backend',
    recruiterKey: 'maya',
    title: 'Senior Backend Engineer',
    companyName: 'NovaStack Labs',
    location: 'Pune, India',
    employmentType: 'full_time',
    salaryMin: 2_200_000,
    salaryMax: 3_400_000,
    currency: 'INR',
    description:
      'Own secure distributed services and PostgreSQL data systems for a multi-tenant SaaS product.',
    requirements:
      'Five or more years building Node.js services with PostgreSQL, cloud infrastructure, testing, and production reliability practices.',
    requiredSkills: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'AWS'],
    status: 'open',
    createdAt: '2026-02-20T08:00:00.000Z',
    expiresAt: '2026-11-30T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    key: 'novastack_designer',
    recruiterKey: 'maya',
    title: 'Product Designer',
    companyName: 'NovaStack Labs',
    location: 'Mumbai, India',
    employmentType: 'contract',
    salaryMin: 1_400_000,
    salaryMax: 2_000_000,
    currency: 'INR',
    description:
      'Simplify complex SaaS workflows through research, interaction design, and a scalable design system.',
    requirements:
      'A strong product portfolio demonstrating Figma craft, research, accessibility, prototyping, and design-system thinking.',
    requiredSkills: ['Figma', 'User Research', 'Design Systems', 'Accessibility'],
    status: 'closed',
    createdAt: '2026-01-20T08:00:00.000Z',
    expiresAt: '2026-06-30T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    key: 'finedge_data',
    recruiterKey: 'arjun',
    title: 'Data Analyst',
    companyName: 'FinEdge Analytics',
    location: 'Hyderabad, India',
    employmentType: 'full_time',
    salaryMin: 900_000,
    salaryMax: 1_500_000,
    currency: 'INR',
    description:
      'Turn customer, risk, and operations data into trusted metrics and self-service dashboards.',
    requirements:
      'Two or more years using SQL and analytical tools, with clear communication and strong data-quality habits.',
    requiredSkills: ['SQL', 'Python', 'Power BI', 'Excel'],
    status: 'open',
    createdAt: '2026-04-10T08:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    key: 'finedge_risk',
    recruiterKey: 'arjun',
    title: 'Risk Analytics Specialist',
    companyName: 'FinEdge Analytics',
    location: 'Gurugram, India',
    employmentType: 'full_time',
    salaryMin: 1_500_000,
    salaryMax: 2_300_000,
    currency: 'INR',
    description:
      'Develop risk monitoring, portfolio analysis, and decision-support models for digital lending.',
    requirements:
      'Strong statistical reasoning, Python and SQL experience, and familiarity with financial or operational risk.',
    requiredSkills: ['Python', 'SQL', 'Statistics', 'Data Visualization'],
    status: 'open',
    createdAt: '2026-01-30T08:00:00.000Z',
    expiresAt: '2026-10-31T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    key: 'finedge_qa',
    recruiterKey: 'arjun',
    title: 'QA Automation Engineer',
    companyName: 'FinEdge Analytics',
    location: 'Ahmedabad, India',
    employmentType: 'full_time',
    salaryMin: 1_000_000,
    salaryMax: 1_700_000,
    currency: 'INR',
    description:
      'Build reliable browser and API automation for customer-facing financial workflows.',
    requirements:
      'Experience with modern browser automation, API testing, JavaScript, defect analysis, and CI pipelines.',
    requiredSkills: ['Playwright', 'Cypress', 'JavaScript', 'API Testing'],
    status: 'draft',
    createdAt: '2026-07-20T08:00:00.000Z',
    expiresAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    key: 'caregrid_sre',
    recruiterKey: 'priya',
    title: 'DevOps and SRE Engineer',
    companyName: 'CareGrid Health',
    location: 'Remote, India',
    employmentType: 'full_time',
    salaryMin: 2_000_000,
    salaryMax: 3_200_000,
    currency: 'INR',
    description:
      'Operate a secure cloud platform supporting critical healthcare workflows around the clock.',
    requirements:
      'Production Kubernetes, AWS, infrastructure-as-code, observability, and incident-response experience.',
    requiredSkills: ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'Prometheus'],
    status: 'open',
    createdAt: '2026-03-01T08:00:00.000Z',
    expiresAt: '2026-12-15T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    key: 'caregrid_product',
    recruiterKey: 'priya',
    title: 'Healthcare Product Analyst',
    companyName: 'CareGrid Health',
    location: 'Chennai, India',
    employmentType: 'full_time',
    salaryMin: 1_300_000,
    salaryMax: 2_100_000,
    currency: 'INR',
    description:
      'Translate clinical operations into interoperable product requirements and measurable outcomes.',
    requirements:
      'Healthcare workflow knowledge, analytical SQL, stakeholder communication, and familiarity with FHIR or HL7.',
    requiredSkills: ['FHIR', 'HL7', 'SQL', 'Jira', 'Requirements Analysis'],
    status: 'open',
    createdAt: '2026-05-15T08:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    key: 'caregrid_intern',
    recruiterKey: 'priya',
    title: 'Software Engineering Intern',
    companyName: 'CareGrid Health',
    location: 'Chennai, India',
    employmentType: 'internship',
    salaryMin: 300_000,
    salaryMax: 450_000,
    currency: 'INR',
    description:
      'Contribute to tested React and Node.js features for a healthcare coordination platform.',
    requirements:
      'Current computer science student with practical React, Node.js, Git, and software testing projects.',
    requiredSkills: ['React', 'Node.js', 'Git', 'TypeScript'],
    status: 'closed',
    createdAt: '2026-01-15T08:00:00.000Z',
    expiresAt: '2026-05-31T23:59:59.000Z',
  },
];

export const applications: ApplicationSeed[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    key: 'sana_novastack_designer',
    jobKey: 'novastack_designer',
    candidateKey: 'sana',
    status: 'interview',
    score: 94,
    analysisStatus: 'completed',
    createdAt: '2026-02-12T10:00:00.000Z',
    coverLetter:
      'I would bring four years of SaaS product design, research, and design-system experience to NovaStack.',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    key: 'kavya_novastack_designer',
    jobKey: 'novastack_designer',
    candidateKey: 'kavya',
    status: 'withdrawn',
    score: 71,
    analysisStatus: 'completed',
    createdAt: '2026-02-21T10:00:00.000Z',
    coverLetter:
      'My product-analysis background gives me a strong foundation in user workflows and evidence-based design decisions.',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    key: 'meera_novastack_backend',
    jobKey: 'novastack_backend',
    candidateKey: 'meera',
    resumeKey: 'v1',
    status: 'offer',
    score: 96,
    analysisStatus: 'completed',
    createdAt: '2026-03-18T10:00:00.000Z',
    coverLetter:
      'I have led high-volume Node.js and PostgreSQL systems and would enjoy owning NovaStack backend reliability.',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    key: 'vikram_novastack_backend',
    jobKey: 'novastack_backend',
    candidateKey: 'vikram',
    status: 'rejected',
    score: 58,
    analysisStatus: 'completed',
    createdAt: '2026-04-07T10:00:00.000Z',
    coverLetter:
      'My platform engineering background could help strengthen the operational side of NovaStack services.',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    key: 'nisha_novastack_frontend',
    jobKey: 'novastack_frontend',
    candidateKey: 'nisha',
    status: 'shortlisted',
    score: 72,
    analysisStatus: 'completed',
    createdAt: '2026-05-15T10:00:00.000Z',
    coverLetter:
      'My QA automation and customer empathy would help me build reliable, testable frontend experiences.',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    key: 'rohan_novastack_frontend',
    jobKey: 'novastack_frontend',
    candidateKey: 'rohan',
    status: 'under_review',
    score: 41,
    analysisStatus: 'completed',
    createdAt: '2026-06-04T10:00:00.000Z',
    coverLetter:
      'I am exploring frontend engineering after building interactive Power BI and Python analytics products.',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    key: 'aarav_novastack_frontend',
    jobKey: 'novastack_frontend',
    candidateKey: 'aarav',
    status: 'applied',
    score: 91,
    analysisStatus: 'completed',
    createdAt: '2026-07-10T10:00:00.000Z',
    coverLetter:
      'As a 2026 graduate with React, TypeScript, and accessibility projects, this is exactly the first role I am seeking.',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    key: 'rohan_novastack_backend',
    jobKey: 'novastack_backend',
    candidateKey: 'rohan',
    status: 'applied',
    score: null,
    analysisStatus: 'pending',
    createdAt: '2026-07-23T10:00:00.000Z',
    coverLetter:
      'I would like to apply my Python, SQL, and data pipeline experience to a backend engineering path.',
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    key: 'vikram_finedge_risk',
    jobKey: 'finedge_risk',
    candidateKey: 'vikram',
    status: 'under_review',
    score: 66,
    analysisStatus: 'completed',
    createdAt: '2026-02-18T10:00:00.000Z',
    coverLetter:
      'I have used operational data and incident metrics extensively and want to deepen my analytics focus.',
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    key: 'meera_finedge_risk',
    jobKey: 'finedge_risk',
    candidateKey: 'meera',
    resumeKey: 'v1',
    status: 'withdrawn',
    score: 55,
    analysisStatus: 'completed',
    createdAt: '2026-03-11T10:00:00.000Z',
    coverLetter:
      'My payments engineering experience includes fraud signals and transaction-risk controls.',
  },
  {
    id: '20000000-0000-4000-8000-000000000011',
    key: 'kavya_finedge_risk',
    jobKey: 'finedge_risk',
    candidateKey: 'kavya',
    status: 'offer',
    score: 88,
    analysisStatus: 'completed',
    createdAt: '2026-04-02T10:00:00.000Z',
    coverLetter:
      'I combine regulated-industry requirements work with SQL, Tableau, and operational analytics.',
  },
  {
    id: '20000000-0000-4000-8000-000000000012',
    key: 'rohan_finedge_data',
    jobKey: 'finedge_data',
    candidateKey: 'rohan',
    status: 'interview',
    score: 92,
    analysisStatus: 'completed',
    createdAt: '2026-05-09T10:00:00.000Z',
    coverLetter:
      'I have three years of SQL, Python, Power BI, and retail analytics experience with measurable reporting impact.',
  },
  {
    id: '20000000-0000-4000-8000-000000000013',
    key: 'nisha_finedge_data',
    jobKey: 'finedge_data',
    candidateKey: 'nisha',
    status: 'rejected',
    score: 52,
    analysisStatus: 'completed',
    createdAt: '2026-06-01T10:00:00.000Z',
    coverLetter:
      'My SQL, quality analysis, and support metrics experience would provide a customer-centered analytics perspective.',
  },
  {
    id: '20000000-0000-4000-8000-000000000014',
    key: 'aarav_finedge_data',
    jobKey: 'finedge_data',
    candidateKey: 'aarav',
    status: 'applied',
    score: 43,
    analysisStatus: 'completed',
    createdAt: '2026-06-27T10:00:00.000Z',
    coverLetter:
      'My degree included statistics and I am interested in applying programming skills to analytical products.',
  },
  {
    id: '20000000-0000-4000-8000-000000000015',
    key: 'kavya_finedge_data',
    jobKey: 'finedge_data',
    candidateKey: 'kavya',
    status: 'shortlisted',
    score: 80,
    analysisStatus: 'completed',
    createdAt: '2026-07-18T10:00:00.000Z',
    coverLetter:
      'I use SQL and Tableau to turn complex healthcare operations into clear product decisions.',
  },
  {
    id: '20000000-0000-4000-8000-000000000016',
    key: 'aarav_caregrid_intern',
    jobKey: 'caregrid_intern',
    candidateKey: 'aarav',
    status: 'withdrawn',
    score: 81,
    analysisStatus: 'completed',
    createdAt: '2026-02-05T10:00:00.000Z',
    coverLetter:
      'I am excited by the opportunity to apply my React and TypeScript coursework to meaningful healthcare software.',
  },
  {
    id: '20000000-0000-4000-8000-000000000017',
    key: 'nisha_caregrid_intern',
    jobKey: 'caregrid_intern',
    candidateKey: 'nisha',
    status: 'shortlisted',
    score: 76,
    analysisStatus: 'completed',
    createdAt: '2026-03-25T10:00:00.000Z',
    coverLetter:
      'My automation background and practical JavaScript experience would help me contribute tested features quickly.',
  },
  {
    id: '20000000-0000-4000-8000-000000000018',
    key: 'vikram_caregrid_sre',
    jobKey: 'caregrid_sre',
    candidateKey: 'vikram',
    status: 'offer',
    score: 97,
    analysisStatus: 'completed',
    createdAt: '2026-04-19T10:00:00.000Z',
    coverLetter:
      'I have eight years in cloud reliability and currently operate 60 Kubernetes clusters for critical services.',
  },
  {
    id: '20000000-0000-4000-8000-000000000019',
    key: 'meera_caregrid_sre',
    jobKey: 'caregrid_sre',
    candidateKey: 'meera',
    status: 'offer',
    score: 84,
    analysisStatus: 'completed',
    createdAt: '2026-05-28T10:00:00.000Z',
    coverLetter:
      'I bring distributed-systems ownership, AWS experience, and a strong production reliability mindset.',
  },
  {
    id: '20000000-0000-4000-8000-000000000020',
    key: 'rohan_caregrid_product',
    jobKey: 'caregrid_product',
    candidateKey: 'rohan',
    status: 'rejected',
    score: 61,
    analysisStatus: 'completed',
    createdAt: '2026-06-12T10:00:00.000Z',
    coverLetter:
      'I would apply my SQL, dashboarding, and stakeholder reporting experience to healthcare product decisions.',
  },
  {
    id: '20000000-0000-4000-8000-000000000021',
    key: 'kavya_caregrid_product',
    jobKey: 'caregrid_product',
    candidateKey: 'kavya',
    status: 'under_review',
    score: 95,
    analysisStatus: 'completed',
    createdAt: '2026-07-05T10:00:00.000Z',
    coverLetter:
      'This role closely matches my five years of healthcare product analysis, FHIR, SQL, and clinical workflow experience.',
  },
  {
    id: '20000000-0000-4000-8000-000000000022',
    key: 'sana_caregrid_product',
    jobKey: 'caregrid_product',
    candidateKey: 'sana',
    status: 'interview',
    score: null,
    analysisStatus: 'failed',
    createdAt: '2026-07-22T10:00:00.000Z',
    coverLetter:
      'I specialize in researching complex workflows and making high-stakes SaaS experiences understandable and accessible.',
  },
];

export const allAccounts: SeedAccount[] = [...recruiters, ...candidates];
