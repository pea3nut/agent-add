import { describe, it, expect } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);
const binPath = path.resolve(__dirname, '../../bin/agent-get.js');

async function runCli(args: string[], env?: NodeJS.ProcessEnv): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const proc = execFile(
      process.execPath,
      [binPath, ...args],
      { env: { ...process.env, ...env } },
      (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          exitCode: (error as NodeJS.ErrnoException & { code?: number })?.code ?? 0,
        });
      },
    );
    if (!proc) {
      resolve({ stdout: '', stderr: '', exitCode: 1 });
    }
  });
}

describe('CLI Contract Tests', () => {
  describe('--version', () => {
    it('should output semver without v prefix', async () => {
      const result = await runCli(['--version']);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
      expect(result.stdout.trim()).not.toMatch(/^v/);
    });
  });

  describe('Non-TTY behavior', () => {
    it('should exit 2 when no --host in non-TTY environment', async () => {
      const result = await runCli(['--mcp', './test.json'], {
        FORCE_TTY: 'false',
      });
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Non-interactive environment detected');
      expect(result.stderr).toContain('--host');
    });
  });

  describe('No asset flags', () => {
    it('should exit 2 when no asset flags are provided', async () => {
      const result = await runCli(['--host', 'cursor']);
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('No asset flags provided');
    });
  });

  describe('--help', () => {
    it('should contain all documented flags', async () => {
      const result = await runCli(['--help']);
      expect(result.stdout).toContain('--pack');
      expect(result.stdout).toContain('--mcp');
      expect(result.stdout).toContain('--skill');
      expect(result.stdout).toContain('--prompt');
      expect(result.stdout).toContain('--command');
      expect(result.stdout).toContain('--sub-agent');
      expect(result.stdout).toContain('--host');
      expect(result.stdout).toContain('--version');
    });
  });

  describe('Unknown host', () => {
    it('should exit 2 with error message for unknown host', async () => {
      const result = await runCli(['--mcp', './test.json', '--host', 'unknown-host']);
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("Unknown host 'unknown-host'");
      expect(result.stderr).toContain('cursor');
    });
  });
});
