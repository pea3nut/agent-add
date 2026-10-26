const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const bin = process.env.AGENT_ADD_BIN || path.resolve(__dirname, '../../bin/agent-add.js');

async function withProject(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-runtime-'));
  const home = path.join(root, 'home');
  fs.mkdirSync(home);
  const options = {
    cwd: root,
    env: { ...process.env, HOME: home, AGENT_ADD_HOME: home, TERM: 'xterm' },
    encoding: 'utf8',
    timeout: 15000,
  };
  try {
    await run(root, options);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function cli(args, options) {
  const result = spawnSync(process.execPath, [bin, ...args], options);
  assert.ifError(result.error);
  return result;
}

test('published CLI loads for --version and --help', async () => {
  await withProject((root, options) => {
    const version = cli(['--version'], options);
    assert.equal(version.status, 0, version.stderr);
    assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+$/);
    const help = cli(['--help'], options);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /--command/);
  });
});

test('published CLI reports non-interactive usage errors', async () => {
  await withProject((root, options) => {
    const result = cli(['--command', './review.md'], options);
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /Non-interactive environment detected/);
  });
});

test('published CLI installs a Gemini pack with all asset types', async () => {
  await withProject((root, options) => {
    fs.writeFileSync(path.join(root, 'mcp.json'), JSON.stringify({ tools: { command: 'echo', args: ['ok'] } }));
    fs.writeFileSync(path.join(root, 'prompt.md'), '# Rules\nBe helpful.\n');
    fs.writeFileSync(path.join(root, 'review.md'), '---\ndescription: Review changes\n---\n# Review\nCheck {{args}}.\n');
    fs.writeFileSync(path.join(root, 'reviewer.md'), '---\nname: reviewer\n---\n# Reviewer\n');
    fs.mkdirSync(path.join(root, 'skill'));
    fs.writeFileSync(path.join(root, 'skill/SKILL.md'), '# Skill\n');
    const assets = [
      ['mcp', './mcp.json'], ['prompt', './prompt.md'], ['command', './review.md'],
      ['subAgent', './reviewer.md'], ['skill', './skill'],
    ].map(([type, source]) => ({ type, source }));
    fs.writeFileSync(path.join(root, 'pack.json'), JSON.stringify({ name: 'test/runtime', assets }));
    const args = ['--pack', './pack.json', '--host', 'gemini'];
    const result = cli(args, options);
    assert.equal(result.status, 0, result.stderr);
    const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(JSON.parse(read('.gemini/settings.json')).mcpServers.tools.command, 'echo');
    assert.match(read('GEMINI.md'), /Be helpful/);
    assert.equal(read('.gemini/skills/skill/SKILL.md'), '# Skill\n');
    assert.match(read('.gemini/agents/reviewer.md'), /# Reviewer/);
    const command = read('.gemini/commands/review.toml');
    assert.match(command, /description = "Review changes"/);
    assert.match(command, /prompt = /);
    assert.match(command, /Check \{\{args\}\}/);
    const repeat = cli(args, options);
    assert.equal(repeat.status, 0, repeat.stderr);
    assert.match(repeat.stdout, /exists\s+command\/review/);
  });
});

test('published CLI selects a host interactively through a real TTY', { skip: process.platform !== 'linux' }, async () => {
  await withProject(async (root, options) => {
    fs.mkdirSync(path.join(root, '.cursor'));
    fs.writeFileSync(path.join(root, 'review.md'), '# Review\n');
    const quote = (value) => "'" + value.replace(/'/g, "'\\''") + "'";
    const command = [process.execPath, bin, '--command', './review.md'].map(quote).join(' ');
    const output = await new Promise((resolve, reject) => {
      const proc = spawn('script', ['-q', '-e', '-c', command, '/dev/null'], options);
      let output = '';
      let selected = false;
      proc.on('error', reject);
      proc.stdout.on('data', (chunk) => {
        output += chunk;
        if (!selected && output.includes('Select target host:')) {
          selected = true;
          proc.stdin.write('\n');
        }
      });
      proc.stderr.on('data', (chunk) => { output += chunk; });
      proc.on('close', (code) => {
        proc.stdin.end();
        if (code === 0) resolve(output);
        else reject(new Error(`Interactive CLI exited ${code}: ${output}`));
      });
    });
    assert.match(output, /Select target host:/);
    assert.equal(fs.readFileSync(path.join(root, '.cursor/commands/review.md'), 'utf8'), '# Review\n');
  });
});
