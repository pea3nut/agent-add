const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const root = path.resolve(__dirname, '../..');
const run = promisify(execFile);
const quote = (value) => "'" + value.replace(/'/g, "'\\''") + "'";

function features(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? features(file)
      : file.endsWith('.feature')
        ? [file]
        : [];
  });
}

function scenarios(file) {
  const background = [];
  const found = [];
  let current;
  let tags = [];
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('@')) tags.push(...line.split(/\s+/));
    else if (line.startsWith('Scenario:')) {
      current = {
        name: line.slice(9).trim(),
        file: path.relative(root, file),
        tags,
        steps: [...background],
      };
      found.push(current);
      tags = [];
    } else if (/^(Given|When|Then|And|But) /.test(line))
      (current ? current.steps : background).push(line);
    else if (/^(Scenario Outline:|Examples:)|^\|/.test(line))
      throw new Error('Unsupported Gherkin construct: ' + line);
  }
  return found;
}

function command(step) {
  const colon = step.indexOf(': ');
  if (colon >= 0) return step.slice(colon + 2);
  const text = step.replace(/^(Given|When|Then|And|But) /, '');
  if (text === 'a temp working directory is created')
    return 'mkdir -p "$SETUP_TMPDIR"';
  if (text.startsWith('the user runs node '))
    return text.slice('the user runs '.length);
  if (/^the exit code is (0|1|non-zero)$/.test(text))
    return (
      'test "$LAST_STATUS" ' +
      (text.endsWith('non-zero') ? '-ne 0' : '-eq ' + text.at(-1))
    );
  if (text === 'the recorded CLI exit code is 1')
    return 'test "$(cat "$SETUP_TMPDIR/exitcode.txt")" -eq 1';
  if (text.startsWith('the output contains "'))
    return 'grep -Fq -- ' + quote(text.slice(21, -1)) + ' "$LAST_OUTPUT"';
  if (text.startsWith('the output matches the pattern '))
    return (
      'node -e ' +
      quote(
        'const fs=require("fs");if(!new RegExp(process.argv[1]).test(fs.readFileSync(process.argv[2],"utf8")))process.exit(1)',
      ) +
      ' ' +
      quote(text.slice(31)) +
      ' "$LAST_OUTPUT"'
    );
  if (text === 'the CLI finishes within five seconds rather than timing out')
    return 'test "$LAST_ELAPSED" -lt 5';
  if (step.startsWith('When ')) return 'printf "%s\\n" ' + quote('Unimplemented step: ' + step) + '; exit 97';
  return (
    'node "$PROJECT_ROOT/tests/features/assert-gemini.cjs" ' +
    quote(text) +
    ' "$SETUP_TMPDIR"'
  );
}

async function execute(scenario) {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), 'agent-add-scenario-'),
  );
  const env = {
    ...process.env,
    PROJECT_ROOT: root,
    SETUP_TMPDIR: temporary,
    HOME: path.join(temporary, 'home'),
    AGENT_ADD_HOME: path.join(temporary, 'home'),
    NODE_PATH: path.join(root, 'node_modules'),
    CI: 'true',
    NO_COLOR: '1',
  };
  for (const key of [
    'CODEX_HOME',
    'OPENCLAW_CONFIG_PATH',
    'OPENCLAW_STATE_DIR',
    'CLINE_MCP_SETTINGS_PATH',
    'OPENCODE_CONFIG',
    'CONTEXT_FILE_NAMES',
    'XDG_CONFIG_HOME',
    'FLATPAK_XDG_CONFIG_HOME',
    'BASH_ENV',
  ])
    delete env[key];
  fs.mkdirSync(env.HOME);
  let index = 0;
  let script =
    'set -u\nLAST_STATUS=0\nLAST_ELAPSED=0\nexport LAST_OUTPUT="$SETUP_TMPDIR/last-output.txt"\n';
  for (const step of scenario.steps) {
    const log = path.join(temporary, 'step-' + index++ + '.log');
    script +=
      'SECONDS=0\n{ ' +
      command(step) +
      '; } >' +
      quote(log) +
      ' 2>&1\nSTEP_STATUS=$?\n';
    if (step.startsWith('When '))
      script +=
        'LAST_STATUS=$STEP_STATUS\nLAST_ELAPSED=$SECONDS\nLAST_OUTPUT=' +
        quote(log) +
        '\n';
    else
      script +=
        'if [ "$STEP_STATUS" -ne 0 ]; then printf "%s\\n" ' +
        quote(step) +
        '; cat ' +
        quote(log) +
        '; cat "$LAST_OUTPUT" 2>/dev/null; exit 1; fi\n';
  }
  try {
    await run('bash', ['-c', script], {
      cwd: root,
      env,
      timeout: 120000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return { ...scenario, steps: undefined, status: 'passed' };
  } catch (err) {
    return {
      ...scenario,
      steps: undefined,
      status: 'failed',
      error:
        (err.stdout ?? '') +
        (err.stderr ?? '') +
        (err.killed ? '\nScenario timed out' : ''),
    };
  } finally {
    fs.rmSync(temporary, { force: true, recursive: true });
  }
}

(async () => {
  const all = features(__dirname).flatMap(scenarios);
  const selected = all.filter(
    (s) =>
      !s.tags.includes('@skip') &&
      (process.argv.includes('--network') || !s.tags.includes('@network')),
  );
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(8, selected.length) }, async () => {
      while (next < selected.length) {
        const result = await execute(selected[next++]);
        results.push(result);
        console.log(result.status.toUpperCase() + ' ' + result.name);
        if (result.error) console.error(result.error);
      }
    }),
  );
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.length - passed;
  const excluded = all.length - selected.length;
  const badge = {
    schemaVersion: 1,
    label: 'scenario tests',
    message:
      passed +
      '/' +
      results.length +
      ' passing' +
      (failed ? ' (' + failed + ' failed)' : ''),
    color: !failed
      ? 'brightgreen'
      : passed / results.length > 0.8
        ? 'orange'
        : 'red',
  };
  fs.writeFileSync(
    path.join(root, 'tests/test-results/badge.json'),
    JSON.stringify(badge) + '\n',
  );
  if (process.env.SCENARIO_REPORT)
    fs.writeFileSync(
      process.env.SCENARIO_REPORT,
      JSON.stringify({ passed, failed, excluded, results }, null, 2),
    );
  console.log(JSON.stringify({ passed, failed, excluded }));
  process.exitCode = failed ? 1 : 0;
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
