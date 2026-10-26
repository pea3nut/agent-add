import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execFile, execFileSync } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';

const binPath = path.resolve(__dirname, '../../bin/agent-add.js');

interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function runCli(args: string[], cwd: string, env: NodeJS.ProcessEnv = {}): Promise<CliResult> {
  return new Promise((resolve) => {
    execFile(process.execPath, [binPath, ...args], { cwd, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        exitCode: error ? ((error as NodeJS.ErrnoException & { code?: number }).code ?? 1) : 0,
      });
    });
  });
}

function mkTmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// --- Local HTTP server -------------------------------------------------------

let server: http.Server;
let baseUrl: string;
const requestedUrls: string[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    requestedUrls.push(req.url ?? '');
    const { pathname } = new URL(req.url ?? '/', 'http://localhost');
    if (pathname === '/prompts/review.md') {
      res.writeHead(200, { 'content-type': 'text/markdown' });
      res.end('# Review\n\nReview the diff.\n');
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// --- Temp-dir cleanup --------------------------------------------------------

describe('temp-dir cleanup on failure (real subprocess)', () => {
  let projectDir: string;
  let privateTmp: string;
  let tmpEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    projectDir = mkTmp('agent-add-contract-project-');
    // A per-invocation temp root, so only directories created by this CLI run are inspected.
    privateTmp = mkTmp('agent-add-contract-tmp-');
    tmpEnv = { TMPDIR: privateTmp, TMP: privateTmp, TEMP: privateTmp };
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
    fs.rmSync(privateTmp, { recursive: true, force: true });
  });

  function leftoverHttpDirs(): string[] {
    return fs.readdirSync(privateTmp).filter((name) => name.startsWith('agent-add-http-'));
  }

  it('removes the HTTP download dir when a later local source does not exist', async () => {
    const result = await runCli(
      ['--prompt', `${baseUrl}/prompts/review.md`, '--prompt', './does-not-exist.md', '--host', 'claude-code'],
      projectDir,
      tmpEnv,
    );

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('Local source not found');
    expect(requestedUrls).toContain('/prompts/review.md');
    expect(leftoverHttpDirs()).toEqual([]);
  });

  it('removes the HTTP download dir when an asset handler throws while writing', async () => {
    // CLAUDE.md is a directory, so the prompt handler's write throws EISDIR.
    fs.mkdirSync(path.join(projectDir, 'CLAUDE.md'));

    const result = await runCli(['--prompt', `${baseUrl}/prompts/review.md`, '--host', 'claude-code'], projectDir, tmpEnv);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/EISDIR/);
    expect(leftoverHttpDirs()).toEqual([]);
  });
});

// --- HTTP file naming --------------------------------------------------------

describe('HTTP file naming (real subprocess)', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkTmp('agent-add-contract-project-');
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  for (const suffix of ['', '?raw=1', '#usage', '?raw=1#usage']) {
    it(`installs review.md for the URL with suffix "${suffix}" and keeps the query in the request`, async () => {
      requestedUrls.length = 0;
      const result = await runCli(
        ['--command', `${baseUrl}/prompts/review.md${suffix}`, '--host', 'claude-code'],
        projectDir,
      );

      expect(result.exitCode).toBe(0);
      expect(fs.readdirSync(path.join(projectDir, '.claude/commands'))).toEqual(['review.md']);
      expect(fs.readFileSync(path.join(projectDir, '.claude/commands/review.md'), 'utf-8')).toContain('# Review');

      const query = suffix.includes('?') ? '?raw=1' : '';
      expect(requestedUrls).toEqual([`/prompts/review.md${query}`]);
    });
  }
});

// --- Git ref/subPath naming --------------------------------------------------

describe('git ref/subPath naming (real subprocess)', () => {
  let workDir: string;
  let gitEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    workDir = mkTmp('agent-add-contract-git-');
    const git = (args: string[], cwd: string) =>
      execFileSync('git', args, { cwd, stdio: 'pipe', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });

    // A repo whose default branch (dev) differs from main, so the ref matters.
    const src = path.join(workDir, 'src');
    fs.mkdirSync(path.join(src, 'skills/pdf'), { recursive: true });
    git(['init', '-q', '-b', 'main'], src);
    git(['config', 'user.email', 'test@example.com'], src);
    git(['config', 'user.name', 'test'], src);
    fs.writeFileSync(path.join(src, 'skills/pdf/SKILL.md'), '# pdf\n\nfrom main\n');
    git(['add', '.'], src);
    git(['commit', '-q', '-m', 'main'], src);
    git(['checkout', '-q', '-b', 'dev'], src);
    fs.writeFileSync(path.join(src, 'skills/pdf/SKILL.md'), '# pdf\n\nfrom dev\n');
    git(['commit', '-q', '-am', 'dev'], src);

    const bare = path.join(workDir, 'skills.git');
    git(['clone', '-q', '--bare', src, bare], workDir);
    git(['symbolic-ref', 'HEAD', 'refs/heads/dev'], bare);

    // Route the GitHub URL to the local bare repo so tree URLs are exercised too.
    const gitconfig = path.join(workDir, 'gitconfig');
    fs.writeFileSync(
      gitconfig,
      `[url "${pathToFileUrl(bare)}"]\n\tinsteadOf = https://github.com/agent-add-test/skills.git\n`,
    );
    gitEnv = { GIT_CONFIG_GLOBAL: gitconfig, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
  });

  afterAll(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  const equivalents = [
    'https://github.com/agent-add-test/skills.git#skills/pdf@main',
    'https://github.com/agent-add-test/skills.git@main#skills/pdf',
    'https://github.com/agent-add-test/skills/tree/main/skills/pdf',
  ];

  for (const source of equivalents) {
    it(`installs ${source} under skills/pdf/ with content from main`, async () => {
      const projectDir = mkTmp('agent-add-contract-project-');
      try {
        const result = await runCli(['--skill', source, '--host', 'claude-code'], projectDir, gitEnv);

        expect(result.stderr).toBe('');
        expect(result.exitCode).toBe(0);
        expect(fs.readdirSync(path.join(projectDir, '.claude/skills'))).toEqual(['pdf']);
        expect(fs.readFileSync(path.join(projectDir, '.claude/skills/pdf/SKILL.md'), 'utf-8')).toContain(
          'from main',
        );
      } finally {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
    });
  }
});

function pathToFileUrl(p: string): string {
  return 'file://' + (p.startsWith('/') ? '' : '/') + p.replace(/\\/g, '/');
}
