const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const toml = require('smol-toml');
const yaml = require('yaml');

const [step, directory] = process.argv.slice(2);
const read = (file) => fs.readFileSync(path.join(directory, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(directory, file));
const command = (name) =>
  JSON.parse(
    JSON.stringify(
      toml.parse(
        read(
          '.gemini/commands/' +
            (exists('.gemini/commands/' + name + '.toml') ? '' : 'commands/') +
            name +
            '.toml',
        ),
      ),
    ),
  );
const source = (file) => {
  const raw = read(file);
  const match = raw.match(
    /^\uFEFF?---[\t ]*\r?\n([\s\S]*?\r?\n)?---[\t ]*(?:\r?\n|$)([\s\S]*)$/,
  );
  return match
    ? { metadata: yaml.parse(match[1] ?? '') ?? {}, body: match[2] }
    : { metadata: {}, body: raw };
};
const review = () => command('review');

if (step.startsWith('.gemini/commands/review.toml parses as valid TOML')) {
  const value = review();
  if (step.includes('only a prompt'))
    assert.deepEqual(Object.keys(value), ['prompt']);
  if (step.endsWith('description Review'))
    assert.equal(value.description, 'Review');
} else if (step.startsWith('its decoded prompt exactly preserves'))
  assert.equal(review().prompt, source('review.md').body);
else if (step.startsWith('its description matches')) {
  assert.equal(review().description, source('review.md').metadata.description);
  assert.equal(review()['allowed-tools'], undefined);
} else if (
  step === 'its decoded prompt is exactly the supplied inline Markdown'
)
  assert.equal(review().prompt, '# Review\n\nCheck {{args}}.');
else if (step === 'every installed command parses as valid TOML')
  for (const name of ['empty', 'no-description', 'no-body']) command(name);
else if (step.startsWith('empty.toml and no-description.toml'))
  for (const name of ['empty', 'no-description'])
    assert.deepEqual(command(name), {
      prompt: source('commands/' + name + '.md').body,
    });
else if (step.startsWith('no-body.toml has'))
  assert.deepEqual(command('no-body'), { description: 'Review', prompt: '' });
else if (step.startsWith('its decoded prompt is exactly the original'))
  assert.equal(review().prompt, source('review.md').body);
else if (step.startsWith('every command is reported'))
  for (const name of ['broken', 'list', 'scalar', 'number', 'null']) {
    assert.match(
      read('out.txt'),
      new RegExp(
        'error: command/commands/' +
          name +
          ' — Failed to convert command source to TOML',
      ),
    );
    assert.match(read('out.txt'), /Failed to convert command source to TOML/);
  }
else if (step.startsWith('none of the five'))
  for (const name of ['broken', 'list', 'scalar', 'number', 'null'])
    assert.equal(exists('.gemini/commands/commands/' + name + '.toml'), false);
else if (step.startsWith('the output reports exists'))
  assert.match(
    exists('out.txt')
      ? read('out.txt')
      : fs.readFileSync(process.env.LAST_OUTPUT, 'utf8'),
    /exists/,
  );
else if (step.startsWith('the output reports conflict')) {
  assert.match(read('out.txt'), /conflict/);
  assert.doesNotMatch(read('out.txt'), /→ exists/);
} else if (step.startsWith('the installed file is byte-for-byte unchanged'))
  assert.equal(read('.gemini/commands/review.toml'), read('before.toml'));
else if (step.startsWith('the existing target remains'))
  assert.equal(read('.gemini/commands/review.toml'), read('review.md'));
else if (step.startsWith('.cursor/commands/review.md is byte-for-byte'))
  assert.equal(read('.cursor/commands/review.md'), read('review.md'));
else if (step.startsWith('.gemini/settings.json is valid'))
  assert.deepEqual(
    JSON.parse(read('.gemini/settings.json')).mcpServers.playwright,
    JSON.parse(read('fixtures/mcp/playwright.json')),
  );
else if (step.startsWith('GEMINI.md contains')) {
  assert.ok(read('GEMINI.md').includes(read('fixtures/prompt/my-prompt.md')));
  assert.match(
    read('GEMINI.md'),
    /<!-- agent-add:my-prompt -->[\s\S]*<!-- \/agent-add:my-prompt -->/,
  );
} else if (step.startsWith('.gemini/skills/my-skill'))
  assert.equal(
    read('.gemini/skills/my-skill/SKILL.md'),
    read('fixtures/skill/my-skill/SKILL.md'),
  );
else if (step.startsWith('.gemini/agents/my-agent.md preserves')) {
  const installed = source('.gemini/agents/my-agent.md');
  const fixture = source('fixtures/sub-agent/my-agent.md');
  assert.equal(installed.metadata.description, fixture.metadata.description);
  assert.equal(installed.body, fixture.body);
  assert.ok(
    Object.keys(installed.metadata).every(
      (key) => !key.startsWith('agent-add/'),
    ),
  );
} else if (step.startsWith('.gemini/commands/my-command.toml')) {
  const fixture = source('fixtures/command/my-command.md');
  assert.deepEqual(command('my-command'), {
    description: fixture.metadata.description,
    prompt: fixture.body,
  });
} else throw new Error('Unimplemented scenario step: ' + step);
