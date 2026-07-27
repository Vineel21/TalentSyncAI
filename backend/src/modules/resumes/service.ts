import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import type { Database, ProfileRow } from '../../config/database.types.js';
import { AppError, BadRequestError } from '../../shared/errors.js';
import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { AiService } from '../ai/service.js';
import type { ResumeParseResult } from '../ai/types.js';
import type { ResumesRepository } from './repository.js';
import type { ResumeDownloadResult, ResumeParseResponse, ResumeUploadResult } from './types.js';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const sanitizeFilename = (filename: string): string => {
  const normalized = filename
    .normalize('NFKC')
    .replace(/[^\w.\- ]/g, '_')
    .trim();
  const base = (normalized || 'resume').replace(/\.pdf$/i, '').replace(/[. ]+$/g, '');
  return `${base.slice(0, 176) || 'resume'}.pdf`;
};

const extractPdfText = async (buffer: Buffer): Promise<string> => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text
      .replace(/\0/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
    if (text.length < 20) {
      throw new BadRequestError(
        'The PDF contains too little extractable text',
        'RESUME_TEXT_EMPTY',
      );
    }
    if (text.length > 150_000) {
      throw new BadRequestError(
        'The resume text exceeds the supported analysis size',
        'RESUME_TEXT_TOO_LARGE',
      );
    }
    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new BadRequestError('The uploaded file is not a readable PDF resume', 'INVALID_PDF');
  } finally {
    await parser.destroy();
  }
};

const profileUpdateFromParse = (current: ProfileRow, parsed: ResumeParseResult): ProfileUpdate => {
  const update: ProfileUpdate = {
    full_name: parsed.name ?? current.full_name,
    phone: parsed.phone ?? current.phone,
    headline: parsed.headline ?? current.headline,
    location: parsed.location ?? current.location,
    linkedin_url: parsed.linkedin ?? current.linkedin_url,
    github_url: parsed.github ?? current.github_url,
    portfolio_url: parsed.portfolio ?? current.portfolio_url,
    summary: parsed.summary ?? current.summary,
    skills: parsed.skills.length ? parsed.skills : current.skills,
    education: parsed.education.length ? parsed.education : current.education,
    experience: parsed.experience.length ? parsed.experience : current.experience,
    certifications: parsed.certifications.length ? parsed.certifications : current.certifications,
  };
  return update;
};

export class ResumesService {
  public constructor(
    private readonly repository: ResumesRepository,
    private readonly aiService: AiService,
  ) {}

  public async upload(
    context: AuthenticatedContext,
    file: Express.Multer.File,
  ): Promise<ResumeUploadResult> {
    const safeFilename = sanitizeFilename(file.originalname);
    const objectPath = `${context.user.id}/${randomUUID()}.pdf`;
    await this.repository.findProfile(context.client, context.user.id);

    await this.repository.uploadObject(objectPath, file.buffer);
    try {
      const analysis = await this.repository.createAnalysis({
        user_id: context.user.id,
        storage_path: objectPath,
        original_filename: safeFilename,
        status: 'pending',
      });
      await this.repository.updateProfile(context.client, context.user.id, {
        resume_path: objectPath,
      });

      return {
        analysisId: analysis.id,
        resumePath: objectPath,
        originalFilename: safeFilename,
        status: 'pending',
      };
    } catch (error) {
      try {
        await this.repository.deleteObject(objectPath);
      } catch {
        // Preserve the original database error.
      }
      throw error;
    }
  }

  public async parse(context: AuthenticatedContext): Promise<ResumeParseResponse> {
    const profile = await this.repository.findProfile(context.client, context.user.id);
    if (!profile.resume_path) {
      throw new BadRequestError('Upload a resume before parsing it', 'RESUME_REQUIRED');
    }
    const analysis = await this.repository.findAnalysisByPath(
      context.client,
      context.user.id,
      profile.resume_path,
    );
    await this.repository.updateAnalysis(context.user.id, analysis.id, {
      status: 'processing',
      error_message: null,
    });

    try {
      const buffer = await this.repository.downloadObject(profile.resume_path);
      const extractedText = await extractPdfText(buffer);
      const parsed = await this.aiService.parseResume(extractedText, context.user.id);
      await Promise.all([
        this.repository.updateProfile(
          context.client,
          context.user.id,
          profileUpdateFromParse(profile, parsed),
        ),
        this.repository.updateAnalysis(context.user.id, analysis.id, {
          status: 'completed',
          extracted_text: extractedText,
          parsed_data: parsed,
          summary: parsed.summary,
          skills: parsed.skills,
          education: parsed.education,
          experience: parsed.experience,
          certifications: parsed.certifications,
          model: this.aiService.model,
          error_message: null,
          completed_at: new Date().toISOString(),
        }),
      ]);

      return {
        analysisId: analysis.id,
        status: 'completed',
        parsed,
      };
    } catch (error) {
      try {
        await this.repository.updateAnalysis(context.user.id, analysis.id, {
          status: 'failed',
          error_message: error instanceof AppError ? error.code : 'RESUME_PARSE_FAILED',
          completed_at: new Date().toISOString(),
        });
      } catch {
        // Preserve the original parse error.
      }
      throw error;
    }
  }

  public async download(
    context: AuthenticatedContext,
    applicationId?: string,
  ): Promise<ResumeDownloadResult> {
    let targetUserId: string;
    let resumePath: string | null;
    if (context.user.role === 'candidate') {
      targetUserId = context.user.id;
      const profile = await this.repository.findProfile(context.client, targetUserId);
      resumePath = profile.resume_path;
    } else {
      if (!applicationId) {
        throw new BadRequestError(
          'applicationId is required for recruiter downloads',
          'APPLICATION_ID_REQUIRED',
        );
      }
      const application = await this.repository.findApplication(context.client, applicationId);
      targetUserId = application.candidate_id;
      resumePath = application.resume_path;
    }
    if (!resumePath) {
      throw new BadRequestError('This candidate has no resume', 'RESUME_NOT_FOUND');
    }

    const analysis = await this.repository.findAnalysisByPath(
      context.client,
      targetUserId,
      resumePath,
    );
    return {
      buffer: await this.repository.downloadObject(resumePath),
      filename: analysis.original_filename,
    };
  }
}
