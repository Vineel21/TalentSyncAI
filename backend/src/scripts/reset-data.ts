import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../config/database.types.js';
import { SupabaseDataResetRepository } from '../modules/data-reset/repository.js';
import { DataResetService } from '../modules/data-reset/service.js';
import type { DataResetProgress } from '../modules/data-reset/types.js';
import {
  assertDataResetAllowed,
  expectedResetConfirmation,
  parseDataResetArguments,
  parseDataResetEnvironment,
  projectRefFromUrl,
} from '../modules/data-reset/validation.js';

const usage = `TalentSync data reset

Read-only preview:
  npm run reset:data --workspace backend

Apply to a hosted development/test project:
  $env:DATA_RESET_ALLOWED_PROJECT_REF='<project-ref>'
  npm run reset:data --workspace backend -- --apply --allow-remote --confirm=RESET_ALL_DATA_<project-ref>

This permanently removes:
  - every Supabase Auth user
  - every object in the configured resume bucket
  - every row in the eight TalentSync public tables (through FK cascades)

It preserves migrations, schema objects, policies, functions, triggers, and the bucket definition.
The command refuses NODE_ENV=production.`;

const printProgress = (progress: DataResetProgress): void => {
  if (progress.kind === 'storage_bucket_emptied') {
    console.error(`Emptied Storage bucket ${progress.bucketId}`);
    return;
  }

  console.error(`Deleted Auth user ${progress.completed}/${progress.total}`);
};

const main = async (): Promise<void> => {
  const arguments_ = parseDataResetArguments(process.argv.slice(2));
  if (arguments_.help) {
    console.log(usage);
    return;
  }

  const environment = parseDataResetEnvironment(process.env);
  const projectRef = assertDataResetAllowed(environment, arguments_);
  const target = {
    projectRef,
    origin: new URL(environment.SUPABASE_URL).origin,
    resumeBucket: environment.SUPABASE_RESUME_BUCKET,
  };
  const client = createClient<Database>(
    environment.SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
  const repository = new SupabaseDataResetRepository(client);
  const service = new DataResetService(
    repository,
    [environment.SUPABASE_RESUME_BUCKET],
    printProgress,
  );

  if (!arguments_.apply) {
    const snapshot = await service.preview();
    console.log(
      JSON.stringify(
        {
          mode: 'preview',
          target,
          plannedDeletion: snapshot,
          requiredConfirmation: expectedResetConfirmation(
            projectRefFromUrl(environment.SUPABASE_URL),
          ),
          mutationPerformed: false,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.error(`Resetting all TalentSync data in ${target.origin} (${target.projectRef})`);
  const startedAt = new Date();
  const result = await service.reset();
  const completedAt = new Date();
  console.log(
    JSON.stringify(
      {
        mode: 'applied',
        target,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
        result,
      },
      null,
      2,
    ),
  );
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
