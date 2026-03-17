import { createProgram } from './cli.js';

const program = createProgram();
program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`agent-get error: ${err.message}\n`);
  process.exit(2);
});
