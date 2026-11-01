const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const directory = process.argv[2];
const source = path.join(directory, 'git-source');
const bare = path.join(directory, 'fixture.git');
const git = (args, cwd = source, input) =>
  execFileSync('git', args, { cwd, input, stdio: 'pipe' }).toString().trim();
fs.mkdirSync(source);
git(['init', '-q', '-b', 'main']);
const object = (type, content) =>
  git(['hash-object', '-t', type, '--stdin', '-w'], source, content);
const commit = (content, parent) => {
  const blob = object('blob', content);
  const tree = object(
    'tree',
    Buffer.concat([
      Buffer.from('100644 .mcp.json\0'),
      Buffer.from(blob, 'hex'),
    ]),
  );
  return object(
    'commit',
    'tree ' +
      tree +
      '\n' +
      (parent ? 'parent ' + parent + '\n' : '') +
      'author Fixture <fixture@example.com> 0 +0000\ncommitter Fixture <fixture@example.com> 0 +0000\n\nSynthetic source fixture\n',
  );
};
const main = commit('{"mcpServers":{"default-only":{"command":"echo"}}}');
git(['update-ref', 'refs/heads/main', main]);
git([
  'update-ref',
  'refs/heads/feature/test',
  commit(
    '{"mcpServers":{"mcp-docs":{"command":"echo","args":["non-default-branch"]}}}',
    main,
  ),
]);
git(['clone', '-q', '--bare', source, bare]);
git(['symbolic-ref', 'HEAD', 'refs/heads/main'], bare);
fs.writeFileSync(
  path.join(directory, 'gitconfig'),
  '[url "' +
    pathToFileURL(bare).href +
    '"]\n\tinsteadOf = https://github.com/agent-add-test/fixture.git\n',
);
