import type { Request, Response } from 'express';
import { validatedQuery } from '../../middleware/validation.js';
import { sendSuccess } from '../../shared/api-response.js';
import { AuthenticationError, BadRequestError } from '../../shared/errors.js';
import type { ResumesService } from './service.js';
import type { ResumeDownloadQuery } from './types.js';

export class ResumesController {
  public constructor(private readonly service: ResumesService) {}

  public upload = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    if (!request.file) {
      throw new BadRequestError('A PDF file is required in the file field', 'RESUME_FILE_REQUIRED');
    }
    const resume = await this.service.upload(request.auth, request.file);
    return sendSuccess(response, 201, 'Resume uploaded', { resume });
  };

  public parse = async (request: Request, response: Response): Promise<Response> => {
    if (!request.auth) throw new AuthenticationError();
    const analysis = await this.service.parse(request.auth);
    return sendSuccess(response, 200, 'Resume parsed', { analysis });
  };

  public download = async (request: Request, response: Response): Promise<void> => {
    if (!request.auth) throw new AuthenticationError();
    const { applicationId } = validatedQuery<ResumeDownloadQuery>(request);
    const result = await this.service.download(request.auth, applicationId);
    const asciiFilename = result.filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    response
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Length': result.buffer.length.toString(),
        'Content-Disposition': `attachment; filename="${asciiFilename}"`,
        'Cache-Control': 'private, no-store',
      })
      .send(result.buffer);
  };
}
