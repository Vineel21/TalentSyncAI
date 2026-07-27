import type { Database, Json } from '../../config/database.types.js';
import type { AuthenticatedContext } from '../../shared/request-context.js';
import type { ProfilesRepository } from './repository.js';
import type { ProfileUpdateInput, ProfileView } from './types.js';
import { toProfileView } from './types.js';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const toDatabaseUpdate = (input: ProfileUpdateInput): ProfileUpdate => {
  const update: ProfileUpdate = {};
  if ('fullName' in input) update.full_name = input.fullName;
  if ('phone' in input) update.phone = input.phone;
  if ('headline' in input) update.headline = input.headline;
  if ('location' in input) update.location = input.location;
  if ('linkedinUrl' in input) update.linkedin_url = input.linkedinUrl;
  if ('githubUrl' in input) update.github_url = input.githubUrl;
  if ('portfolioUrl' in input) update.portfolio_url = input.portfolioUrl;
  if ('summary' in input) update.summary = input.summary;
  if ('skills' in input) update.skills = input.skills;
  if ('education' in input) update.education = input.education as unknown as Json;
  if ('experience' in input) update.experience = input.experience as unknown as Json;
  if ('certifications' in input) update.certifications = input.certifications as unknown as Json;
  return update;
};

export class ProfilesService {
  public constructor(private readonly repository: ProfilesRepository) {}

  public async getOwn(context: AuthenticatedContext): Promise<ProfileView> {
    return toProfileView(await this.repository.findByUserId(context.client, context.user.id));
  }

  public async getRecruiterView(
    context: AuthenticatedContext,
    profileId: string,
  ): Promise<ProfileView> {
    return toProfileView(await this.repository.findById(context.client, profileId));
  }

  public async updateOwn(
    context: AuthenticatedContext,
    input: ProfileUpdateInput,
  ): Promise<ProfileView> {
    const update = toDatabaseUpdate(input);
    return toProfileView(
      await this.repository.updateByUserId(context.client, context.user.id, update),
    );
  }
}
