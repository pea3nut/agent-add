import { createProgram } from './cli.js';
import { redact } from './utils/redact.js';

const program = createProgram();
program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`agent-add error: ${redact(err.message)}\n`);
  process.exit(2);
});
