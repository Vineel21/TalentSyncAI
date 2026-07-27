import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';

const server = createServer(createApp());

server.listen(env.PORT, () => {
  console.info(`TalentSync API listening on port ${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.info(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error('Graceful shutdown failed', error);
      process.exitCode = 1;
    }
    process.exit();
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out');
    process.exit(1);
  }, 10_000).unref();
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
