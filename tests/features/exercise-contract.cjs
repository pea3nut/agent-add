const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const yaml = require('yaml');
const toml = require('smol-toml');
const JSON5 = require('json5');

const [scenario, directory] = process.argv.slice(2);
const root = path.resolve(__dirname, '../..');
const home = process.env.AGENT_ADD_HOME;
const target = (file) => path.resolve(directory, file);
const read = (file) => fs.readFileSync(target(file), 'utf8');
const exists = (file) => fs.existsSync(target(file));
const write = (file, content) => {
  fs.mkdirSync(path.dirname(target(file)), { recursive: true });
  fs.writeFileSync(target(file), content);
};
const json = (file, value) => write(file, JSON.stringify(value));
const decode = (file, parser = JSON5.parse) =>
  JSON.parse(JSON.stringify(parser(read(file))));
const local = {
  command: 'npx',
  args: ['-y', 'example-mcp'],
  env: { DEMO: 'yes' },
};
const remote = {
  url: 'https://example.com/mcp',
  headers: { 'X-Demo': 'example' },
};
const skill = () => {
  write(
    'my-skill/SKILL.md',
    '---\nname: my-skill\ndescription: Example skill\n---\nUse the resources.\n',
  );
  write('my-skill/resources/example.txt', 'supporting resource');
};
const cli = (host, flags, status = 0, env = {}) => {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'bin/agent-add.js'), '--host', host, ...flags],
    {
      cwd: directory,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 10000,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status, status, result.stdout + result.stderr);
  return result.stdout + result.stderr;
};
const mcp = (host, input, status = 0, env = {}) => {
  json('local.json', input);
  return cli(host, ['--mcp', './local.json'], status, env);
};
const assertSkill = (dir) => {
  assert.equal(read(dir + '/my-skill/SKILL.md'), read('my-skill/SKILL.md'));
  assert.equal(
    read(dir + '/my-skill/resources/example.txt'),
    'supporting resource',
  );
};

const cases = {
  'reserved-names'() {
    for (const name of ['__proto__', 'constructor', 'prototype', '<<']) {
      for (const [host, file] of [
        ['cursor', '.cursor/mcp.json'],
        ['openclaw', path.join(home, '.openclaw/openclaw.json')],
        ['goose', path.join(home, '.config/goose/config.yaml')],
        ['codex', path.join(home, '.codex/config.toml')],
      ]) {
        mcp(host, { mcpServers: Object.fromEntries([[name, local]]) }, 1);
        assert.equal(exists(file), false);
      }
    }
    write('.cursor/mcp.json', '{"keep":true}\n');
    write('AGENTS.md', 'Personal instructions.\n');
    json('safe.json', local);
    json('unsafe.json', {
      mcpServers: Object.fromEntries([['__proto__', local]]),
    });
    write('p.md', 'Must not be installed.');
    cli(
      'cursor',
      ['--mcp', './safe.json', '--mcp', './unsafe.json', '--prompt', './p.md'],
      1,
    );
    assert.equal(read('.cursor/mcp.json'), '{"keep":true}\n');
    assert.equal(read('AGENTS.md'), 'Personal instructions.\n');
    assert.equal(exists('.cursor/rules/p.md'), false);
  },
  'claude-remote'() {
    mcp('claude-code', remote);
    assert.deepEqual(decode('.mcp.json').mcpServers.local, {
      ...remote,
      type: 'http',
    });
    assert.match(mcp('claude-code', remote), /exists/);
    json('sse.json', { ...remote, type: 'sse' });
    cli('claude-code', ['--mcp', './sse.json']);
    assert.deepEqual(decode('.mcp.json').mcpServers.sse, {
      ...remote,
      type: 'sse',
    });
    json('alias.json', { ...remote, transport: 'streamable-http' });
    cli('claude-code', ['--mcp', './alias.json']);
    assert.deepEqual(decode('.mcp.json').mcpServers.alias, {
      ...remote,
      type: 'http',
    });
  },
  'symlink-targets'() {
    write('shared/AGENTS.md', 'Personal instructions.\n');
    fs.symlinkSync('shared/AGENTS.md', target('AGENTS.md'));
    write('p.md', 'Use tests.');
    cli('cursor', ['--prompt', './p.md']);
    assert.equal(fs.readlinkSync(target('AGENTS.md')), 'shared/AGENTS.md');
    assert.equal(read('shared/AGENTS.md'), read('AGENTS.md'));
    assert.match(
      read('shared/AGENTS.md'),
      /Personal instructions\.[\s\S]*Use tests\./,
    );
    assert.match(cli('cursor', ['--prompt', './p.md']), /exists/);
    write('shared/mcp.json', '{"keep":true}\n');
    fs.mkdirSync(target('.cursor'), { recursive: true });
    fs.symlinkSync('../shared/mcp.json', target('.cursor/mcp.json'));
    mcp('cursor', local);
    assert.equal(
      fs.readlinkSync(target('.cursor/mcp.json')),
      '../shared/mcp.json',
    );
    assert.deepEqual(decode('shared/mcp.json'), {
      keep: true,
      mcpServers: { local },
    });
    fs.unlinkSync(target('AGENTS.md'));
    fs.symlinkSync('missing.md', target('AGENTS.md'));
    cli('cursor', ['--prompt', './p.md'], 1);
    assert.equal(fs.readlinkSync(target('AGENTS.md')), 'missing.md');
    assert.equal(exists('missing.md'), false);
  },
  zed() {
    const file = path.join(home, '.config/zed/settings.json');
    write(
      file,
      '{ // keep settings comment\n"theme":"dark", "context_servers":{}, }',
    );
    json('local.json', local);
    json('remote.json', remote);
    write('p.md', 'Use tests.');
    skill();
    write('.rules', '# Effective rules\n');
    write('AGENTS.md', '# Lower priority\n');
    cli('zed', [
      '--mcp',
      './local.json',
      '--mcp',
      './remote.json',
      '--prompt',
      './p.md',
      '--skill',
      './my-skill',
    ]);
    assert.deepEqual(decode(file), {
      theme: 'dark',
      context_servers: { local, remote },
    });
    assert.match(read(file), /keep settings comment/);
    assert.match(read('.rules'), /Use tests/);
    assert.equal(read('AGENTS.md'), '# Lower priority\n');
    assertSkill('.agents/skills');
  },
  cline() {
    const file = target('custom/cline.json');
    json(file, { other: true, mcpServers: { existing: { command: 'echo' } } });
    json('local.json', local);
    json('remote.json', remote);
    write('p.md', 'Use tests.');
    skill();
    cli(
      'cline',
      [
        '--mcp',
        './local.json',
        '--mcp',
        './remote.json',
        '--prompt',
        './p.md',
        '--skill',
        './my-skill',
      ],
      0,
      { CLINE_MCP_SETTINGS_PATH: file },
    );
    assert.deepEqual(decode(file), {
      other: true,
      mcpServers: {
        existing: { command: 'echo' },
        local,
        remote: { ...remote, type: 'streamableHttp' },
      },
    });
    assert.equal(read('.cline/rules/p.md'), read('p.md'));
    assertSkill('.cline/skills');
    assert.equal(
      exists(path.join(home, '.cline/data/settings/cline_mcp_settings.json')),
      false,
    );
  },
  continue() {
    mcp('continue', { mcpServers: { demo: local } });
    write('p.md', 'Use tests.');
    cli('continue', ['--prompt', './p.md']);
    assert.deepEqual(decode('.continue/mcpServers/agent-add.json'), {
      mcpServers: { demo: local },
    });
    assert.equal(read('.continue/rules/p.md'), read('p.md'));
    assert.match(
      cli('continue', ['--skill', './unused'], 2),
      /does not support/,
    );
  },
  aider() {
    write(
      '.aider.conf.yml',
      '# keep YAML comment\nread: NOTES.md\nmodel: chosen\n',
    );
    write('p.md', 'Use tests.');
    cli('aider', ['--prompt', './p.md']);
    assert.match(cli('aider', ['--prompt', './p.md']), /exists/);
    assert.deepEqual(decode('.aider.conf.yml', yaml.parse), {
      read: ['NOTES.md', 'CONVENTIONS.md'],
      model: 'chosen',
    });
    assert.match(read('.aider.conf.yml'), /keep YAML comment/);
    assert.match(read('CONVENTIONS.md'), /Use tests/);
    write('p.md', 'Updated tests.');
    assert.match(cli('aider', ['--prompt', './p.md']), /updated/);
    assert.match(read('CONVENTIONS.md'), /Updated tests/);
    assert.equal(
      (read('CONVENTIONS.md').match(/<!-- agent-add:p -->/g) || []).length,
      1,
    );
    assert.match(cli('aider', ['--mcp', './unused'], 2), /does not support/);
  },
  'aider-invalid'() {
    const config = 'read: {not: a-list}\n';
    write('.aider.conf.yml', config);
    write('p.md', 'Use tests.');
    cli('aider', ['--prompt', './p.md'], 1);
    assert.equal(read('.aider.conf.yml'), config);
    assert.equal(exists('CONVENTIONS.md'), false);
  },
  goose() {
    const file = path.join(home, '.config/goose/config.yaml');
    write(
      file,
      '# keep goose comment\nGOOSE_PROVIDER: chosen\nextensions:\n  old:\n    type: builtin\n    enabled: false\n',
    );
    json('local.json', local);
    json('remote.json', remote);
    write('p.md', 'Use tests.');
    skill();
    cli(
      'goose',
      [
        '--mcp',
        './local.json',
        '--mcp',
        './remote.json',
        '--prompt',
        './p.md',
        '--skill',
        './my-skill',
      ],
      0,
      { CONTEXT_FILE_NAMES: '["TEAM.md"]' },
    );
    assert.deepEqual(decode(file, yaml.parse), {
      GOOSE_PROVIDER: 'chosen',
      extensions: {
        old: { type: 'builtin', enabled: false },
        local: {
          name: 'local',
          enabled: true,
          timeout: 300,
          type: 'stdio',
          cmd: local.command,
          args: local.args,
          envs: local.env,
        },
        remote: {
          name: 'remote',
          enabled: true,
          timeout: 300,
          type: 'streamable_http',
          uri: remote.url,
          headers: remote.headers,
        },
      },
    });
    assert.match(read(file), /keep goose comment/);
    assert.match(read('TEAM.md'), /Use tests/);
    assert.equal(exists('AGENTS.md'), false);
    assertSkill('.agents/skills');
  },
  'goose-sse'() {
    const file = path.join(home, '.config/goose/config.yaml');
    const original = '# preserve\nextensions: {}\n';
    write(file, original);
    assert.match(mcp('goose', { ...remote, type: 'sse' }, 1), /SSE/);
    assert.equal(read(file), original);
  },
  amp() {
    write(
      '.amp/settings.jsonc',
      '{ // preserve Amp\n"theme":"dark", "amp.mcpServers":{}, }',
    );
    mcp('amp', local);
    write('p.md', 'Use tests.');
    skill();
    cli('amp', ['--prompt', './p.md', '--skill', './my-skill']);
    assert.deepEqual(decode('.amp/settings.jsonc'), {
      theme: 'dark',
      'amp.mcpServers': { local },
    });
    assert.match(read('.amp/settings.jsonc'), /preserve Amp/);
    assert.equal(exists('.amp/settings.json'), false);
    assert.match(read('AGENTS.md'), /Use tests/);
    assertSkill('.agents/skills');
  },
  opencode() {
    write(
      'opencode.jsonc',
      '{ // preserve opencode\n"theme":"dark", "mcp":{}, }',
    );
    json('local.json', local);
    json('remote.json', remote);
    cli('opencode', ['--mcp', './local.json', '--mcp', './remote.json']);
    assert.deepEqual(decode('opencode.jsonc'), {
      theme: 'dark',
      mcp: {
        local: {
          type: 'local',
          command: ['npx', ...local.args],
          environment: local.env,
        },
        remote: { type: 'remote', ...remote },
      },
    });
    assert.match(read('opencode.jsonc'), /preserve opencode/);
    assert.equal(exists('opencode.json'), false);
    assert.match(cli('opencode', ['--mcp', './local.json']), /exists/);
  },
  kilo() {
    write(
      'kilo.jsonc',
      '{ // preserve Kilo\n"model":"chosen", "instructions":["existing.md"], }',
    );
    write('p.md', 'Use tests.');
    mcp('kilo-code', local);
    cli('kilo-code', ['--prompt', './p.md']);
    cli('kilo-code', ['--prompt', './p.md']);
    assert.deepEqual(decode('kilo.jsonc'), {
      model: 'chosen',
      instructions: ['existing.md', '.kilo/rules/p.md'],
      mcp: {
        local: {
          type: 'local',
          command: ['npx', ...local.args],
          environment: local.env,
        },
      },
    });
    assert.match(read('kilo.jsonc'), /preserve Kilo/);
    assert.equal(read('.kilo/rules/p.md'), read('p.md'));
    fs.renameSync(target('kilo.jsonc'), target('.kilo/kilo.jsonc'));
    cli('kilo-code', ['--prompt', './p.md']);
    assert.deepEqual(decode('.kilo/kilo.jsonc').instructions, [
      'existing.md',
      '.kilo/rules/p.md',
    ]);
  },
  'codex-agent'() {
    write(
      'reviewer.md',
      '\uFEFF---\r\nname: reviewer\r\ndescription: Review changes\r\n---\r\nKeep "quotes", \\paths and 中文.\r\n',
    );
    cli('codex', ['--sub-agent', './reviewer.md']);
    assert.deepEqual(decode('.codex/agents/reviewer.toml', toml.parse), {
      name: 'reviewer',
      description: 'Review changes',
      developer_instructions: 'Keep "quotes", \\paths and 中文.\n',
    });
    assert.match(cli('codex', ['--sub-agent', './reviewer.md']), /exists/);
    write(
      'bad.md',
      '---\ndescription: Review\ntools: [arbitrary]\n---\nReview.',
    );
    cli('codex', ['--sub-agent', './bad.md'], 1);
    assert.equal(exists('.codex/agents/bad.toml'), false);
  },
  vibe() {
    write('.vibe/config.toml', '# preserve Vibe\nactive_model = "chosen"\n');
    mcp('vibe', local);
    assert.deepEqual(decode('.vibe/config.toml', toml.parse), {
      active_model: 'chosen',
      mcp_servers: [{ ...local, name: 'local', transport: 'stdio' }],
    });
    assert.match(read('.vibe/config.toml'), /preserve Vibe/);
    write(
      'reviewer.md',
      '---\nname: reviewer\ndescription: Review changes\n---\nReview.\n',
    );
    cli('vibe', ['--sub-agent', './reviewer.md']);
    assert.deepEqual(decode('.vibe/agents/reviewer.toml', toml.parse), {
      display_name: 'reviewer',
      description: 'Review changes',
      agent_type: 'subagent',
      instructions: 'Review.\n',
    });
    write('main.md', '---\ndescription: Reserved\n---\nReview.');
    cli('vibe', ['--sub-agent', './main.md'], 1);
    assert.equal(exists('.vibe/agents/main.toml'), false);
  },
  'host-hints'() {
    for (const [file, fields] of [
      ['first.md', ['agent-add/cursor/name: preferred', 'name: generic']],
      ['second.md', ['name: generic', 'agent-add/cursor/name: preferred']],
    ]) {
      write(
        file,
        '\uFEFF---\r\n' +
          fields.join('\r\n') +
          '\r\ndescription: Example\r\nagent-add/claude-code/name: ignored\r\n---\r\nBody.\r\n',
      );
      cli('cursor', ['--sub-agent', './' + file]);
      const output = read('.cursor/agents/' + file);
      const match = output.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      assert.ok(match);
      assert.deepEqual(yaml.parse(match[1]), {
        name: 'preferred',
        description: 'Example',
      });
      assert.equal(match[2], 'Body.\n');
    }
    write('bad.md', '---\nname: unfinished\n');
    cli('cursor', ['--sub-agent', './bad.md'], 1);
    assert.equal(exists('.cursor/agents/bad.md'), false);
  },
  'codex-http'() {
    const file = path.join(home, '.codex/config.toml');
    write(file, '# preserve Codex\nmodel = "chosen"\n');
    mcp('codex', remote);
    assert.deepEqual(decode(file, toml.parse), {
      model: 'chosen',
      mcp_servers: { local: { url: remote.url, http_headers: remote.headers } },
    });
    assert.match(read(file), /preserve Codex/);
    assert.match(mcp('codex', remote), /exists/);
    const before = read(file);
    mcp('codex', { ...remote, command: 'bad' }, 1);
    assert.equal(read(file), before);
  },
  'key-order'() {
    const original =
      '{"mcpServers":{"local":{"env":{"DEMO":"yes"},"args":["-y","example-mcp"],"command":"npx"}}}\n';
    write('.cursor/mcp.json', original);
    assert.match(mcp('cursor', local), /exists/);
    assert.equal(read('.cursor/mcp.json'), original);
    mcp('cursor', { ...local, args: ['example-mcp', '-y'] }, 1);
    assert.equal(read('.cursor/mcp.json'), original);
  },
  'roo-prompt'() {
    write('p.md', 'Original.');
    cli('roo-code', ['--prompt', './p.md']);
    assert.match(cli('roo-code', ['--prompt', './p.md']), /exists/);
    write('p.md', 'Changed.');
    assert.match(cli('roo-code', ['--prompt', './p.md'], 1), /conflict/);
    assert.equal(read('.roo/rules/p.md'), 'Original.');
  },
  'prompt-collision'() {
    write('a/p.md', 'First.');
    write('b/p.md', 'Second.');
    json('local.json', local);
    assert.match(
      cli(
        'cursor',
        [
          '--prompt',
          './a/p.md',
          '--prompt',
          './b/p.md',
          '--mcp',
          './local.json',
        ],
        1,
      ),
      /conflict/,
    );
    assert.equal(exists('AGENTS.md'), false);
    assert.equal(exists('.cursor/mcp.json'), false);
    write('b/p.md', 'First.');
    cli('cursor', ['--prompt', './a/p.md', '--prompt', './b/p.md']);
    assert.equal(
      (read('AGENTS.md').match(/<!-- agent-add:p -->/g) || []).length,
      1,
    );
  },
  markers() {
    const original = '<!-- agent-add:p -->\nUnclosed.\n';
    write('AGENTS.md', original);
    write('p.md', 'New.');
    cli('cursor', ['--prompt', './p.md'], 1);
    assert.equal(read('AGENTS.md'), original);
    write(
      'AGENTS.md',
      '<!-- agent-add:p-extra -->\nKeep.\n<!-- /agent-add:p-extra -->\n',
    );
    cli('cursor', ['--prompt', './p.md']);
    assert.match(read('AGENTS.md'), /Keep/);
    assert.match(read('AGENTS.md'), /New/);
  },
  openclaw() {
    const file = path.join(home, '.openclaw/openclaw.json');
    const workspace = target('selected-workspace');
    write(
      file,
      '// keep JSON5 comment\n{agents:{defaults:{workspace:' +
        JSON.stringify(workspace) +
        '}}, mcp:{servers:{}}, limit:Infinity,}',
    );
    mcp('openclaw', local);
    write('p.md', 'Use tests.');
    skill();
    cli('openclaw', ['--prompt', './p.md', '--skill', './my-skill']);
    const value = JSON5.parse(read(file));
    assert.deepEqual(value.mcp.servers.local, local);
    assert.equal(value.limit, Infinity);
    assert.match(read(file), /keep JSON5 comment/);
    assert.match(read('selected-workspace/AGENTS.md'), /Use tests/);
    assertSkill('selected-workspace/skills');
    assert.equal(exists('AGENTS.md'), false);
  },
  'gemini-context'() {
    write(
      '.gemini/settings.json',
      '{"context":{"fileName":["TEAM.md","OTHER.md"]}}',
    );
    write('p.md', 'Use tests.');
    cli('gemini', ['--prompt', './p.md']);
    assert.match(read('TEAM.md'), /Use tests/);
    assert.equal(exists('GEMINI.md'), false);
  },
  'invalid-config'() {
    for (const [host, file, content] of [
      ['cursor', '.cursor/mcp.json', '{'],
      ['amp', '.amp/settings.json', '{"amp.mcpServers":[]}'],
      [
        'goose',
        path.join(home, '.config/goose/config.yaml'),
        'extensions: [\n',
      ],
      ['codex', path.join(home, '.codex/config.toml'), 'mcp_servers = ['],
    ]) {
      write(file, content);
      mcp(host, local, 1);
      assert.equal(read(file), content);
    }
  },
};
assert.ok(
  Object.hasOwn(cases, scenario),
  'Unknown contract scenario: ' + scenario,
);
cases[scenario]();
