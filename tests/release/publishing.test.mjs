import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import yaml from 'yaml';
import {
  prepare, releaseVersion, validatePackage, validateReceipt, validateRegistryMetadata,
  validateSource, verifyArtifact, validateProvenance,
} from '../../.github/scripts/release.mjs';

const pkg = () => ({ name: 'agent-add', version: '2.0.0', repository: { type: 'git', url: 'https://github.com/pea3nut/agent-add.git' } });
const receipt = () => ({ repository: 'pea3nut/agent-add', version: '2.0.0', commit: 'a'.repeat(40), filename: 'agent-add-2.0.0.tgz', integrity: 'sha512-tested', sha512: 'f'.repeat(128) });
const context = () => ({ GITHUB_REPOSITORY: 'pea3nut/agent-add', GITHUB_REF: 'refs/tags/2.0.0', GITHUB_SHA: 'a'.repeat(40) });

test('accepts stable version tags and npm-normalized repository URLs', () => {
  assert.equal(releaseVersion('refs/tags/2.0.0'), '2.0.0');
  validatePackage(pkg(), '2.0.0');
  validatePackage({ ...pkg(), repository: { url: 'git+https://github.com/pea3nut/agent-add.git' } }, '2.0.0');
});

for (const ref of ['refs/heads/master', 'refs/tags/v2.0.0', 'refs/tags/2.0.0-beta.1', 'refs/tags/02.0.0', 'refs/tags/2.0', 'refs/tags/2.0.0/../../x', 'refs/tags/2.0.0\nextra']) {
  test(`rejects non-release or unsafe ref ${JSON.stringify(ref)}`, () => assert.throws(() => releaseVersion(ref)));
}

test('rejects wrong package identity, mismatched versions and consumer install hooks', () => {
  assert.throws(() => validatePackage({ ...pkg(), name: 'other' }, '2.0.0'));
  assert.throws(() => validatePackage(pkg(), '2.0.1'));
  assert.throws(() => validatePackage({ ...pkg(), repository: { url: 'https://github.com/attacker/agent-add' } }, '2.0.0'));
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare'])
    assert.throws(() => validatePackage({ ...pkg(), scripts: { [hook]: 'node surprise.js' } }, '2.0.0'));
});

test('rejects fork identities, wrong commits and archive path traversal', () => {
  validateReceipt(receipt(), context());
  assert.throws(() => validateReceipt(receipt(), { ...context(), GITHUB_REPOSITORY: 'fork/agent-add' }));
  assert.throws(() => validateReceipt(receipt(), { ...context(), GITHUB_SHA: 'b'.repeat(40) }));
  assert.throws(() => validateReceipt({ ...receipt(), filename: '../../other.tgz' }, context()));
});

test('real Git preflight and packed archive reject unmerged commits and modified bytes', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-release-'));
  const source = path.join(directory, 'source');
  const output = path.join(directory, 'artifacts');
  fs.mkdirSync(source);
  const previous = process.cwd();
  const previousCache = process.env.npm_config_cache;
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd: source, encoding: 'utf8' }).trim();
  try {
    git('init', '-q', '-b', 'master');
    git('config', 'user.name', 'Codex tests');
    git('config', 'user.email', 'codex-tests@example.invalid');
    fs.mkdirSync(path.join(source, 'bin'));
    fs.writeFileSync(path.join(source, 'bin/agent-add.js'), 'console.log("fixture");\n');
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({
      ...pkg(), files: ['bin'], bin: { 'agent-add': 'bin/agent-add.js' },
      scripts: { prepack: 'node -e "require(\'fs\').writeFileSync(\'unexpected-hook\',\'ran\')"' },
    }));
    git('add', '.'); git('commit', '-qm', '[Codex] release fixture');
    git('tag', '2.0.0');
    const commit = git('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/master', commit);
    process.chdir(source);
    process.env.npm_config_cache = path.join(directory, 'npm-cache');
    const env = { ...context(), GITHUB_SHA: commit };
    const packed = prepare(output, env);
    assert.ok(!fs.existsSync(path.join(source, 'unexpected-hook')), 'npm pack must not execute prepack');
    assert.equal(verifyArtifact(output, env).integrity, packed.integrity);
    fs.appendFileSync(path.join(source, 'bin/agent-add.js'), '// uncommitted modification\n');
    assert.throws(() => validateSource(env));
    git('checkout', '--', 'bin/agent-add.js');
    const archive = path.join(output, packed.filename);
    fs.appendFileSync(archive, 'tampered');
    assert.throws(() => verifyArtifact(output, env), /mismatch/);
    git('checkout', '-qb', 'unmerged');
    fs.writeFileSync(path.join(source, 'change'), 'unmerged');
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ ...pkg(), version: '2.0.1' }));
    git('add', '.'); git('commit', '-qm', '[Codex] unmerged fixture'); git('tag', '2.0.1');
    const next = git('rev-parse', 'HEAD');
    assert.throws(() => validateSource({ ...env, GITHUB_SHA: next, GITHUB_REF: 'refs/tags/2.0.1' }));
    assert.throws(() => validateSource({ ...env, GITHUB_SHA: next, GITHUB_REF: 'refs/tags/2.0.0' }), /version|tag/i);
  } finally {
    process.chdir(previous);
    if (previousCache === undefined) delete process.env.npm_config_cache;
    else process.env.npm_config_cache = previousCache;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('registry verification requires the tested digest and provenance, not just a registry signature', () => {
  const metadata = {
    ...pkg(), repository: { url: 'git+https://github.com/pea3nut/agent-add.git' },
    dist: { integrity: receipt().integrity, tarball: 'https://registry.npmjs.org/agent-add/-/agent-add-2.0.0.tgz',
      attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/agent-add@2.0.0', provenance: { predicateType: 'https://slsa.dev/provenance/v1' } } },
  };
  validateRegistryMetadata(metadata, receipt());
  for (const changes of [
    { integrity: 'sha512-other' }, { tarball: 'https://attacker.example/package.tgz' },
    { attestations: undefined, signatures: [{ sig: 'registry-signature-only' }] },
    { attestations: { url: 'https://attacker.example/attestations', provenance: { predicateType: 'x' } } },
  ]) assert.throws(() => validateRegistryMetadata({ ...metadata, dist: { ...metadata.dist, ...changes } }, receipt()));
});

test('provenance binds the artifact digest, repository, workflow, tag and exact commit', () => {
  const statement = {
    predicateType: 'https://slsa.dev/provenance/v1',
    subject: [{ name: 'pkg:npm/agent-add@2.0.0', digest: { sha512: receipt().sha512 } }],
    predicate: { buildDefinition: {
      buildType: 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',
      externalParameters: { workflow: { repository: 'https://github.com/pea3nut/agent-add', ref: 'refs/tags/2.0.0', path: '.github/workflows/publish.yml' } },
      resolvedDependencies: [{ uri: 'git+https://github.com/pea3nut/agent-add@refs/tags/2.0.0', digest: { gitCommit: receipt().commit } }],
    } },
  };
  const bundle = (value) => ({ attestations: [{ predicateType: statement.predicateType,
    bundle: { dsseEnvelope: { payload: Buffer.from(JSON.stringify(value)).toString('base64') } } }] });
  validateProvenance(bundle(statement), receipt());
  for (const mutate of [
    (s) => { s.subject[0].digest.sha512 = '0'.repeat(128); },
    (s) => { s.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'b'.repeat(40); },
    (s) => { s.predicate.buildDefinition.externalParameters.workflow.repository = 'https://github.com/fork/agent-add'; },
    (s) => { s.predicate.buildDefinition.externalParameters.workflow.path = '.github/workflows/other.yml'; },
    (s) => { s.predicate.buildDefinition.externalParameters.workflow.ref = 'refs/heads/master'; },
  ]) {
    const changed = structuredClone(statement); mutate(changed);
    assert.throws(() => validateProvenance(bundle(changed), receipt()));
  }
});

test('publishing privilege is isolated behind packed-runtime success and the named environment', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const workflow = yaml.parse(fs.readFileSync(path.join(root, '.github/workflows/publish.yml'), 'utf8'));
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(workflow.defaults.run.shell, 'bash', 'Piped signature verification must use pipefail');
  assert.deepEqual(workflow.jobs.publish.needs, ['build', 'runtime']);
  assert.equal(workflow.jobs.publish.environment, 'npm-publish');
  assert.equal(workflow.jobs.publish.permissions['id-token'], 'write');
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (name !== 'publish') assert.notEqual(job.permissions?.['id-token'], 'write');
    for (const step of job.steps) if (step.uses) {
      const sha = step.uses.split('@')[1];
      assert.equal(Buffer.from(sha, 'hex').toString('hex'), sha);
      assert.equal(sha.length, 40, 'Actions must be pinned to full commits');
    }
  }
  const publisher = workflow.jobs.publish.steps;
  assert.ok(publisher.every((step) => !step.uses?.startsWith('actions/checkout@')));
  const publishCommand = publisher.find((step) => step.name?.startsWith('Recheck')).run;
  assert.ok(publishCommand.includes("'--ignore-scripts'"));
  assert.ok(publishCommand.includes("'--provenance'"));
  assert.ok(!publishCommand.includes('npm run build'));
  assert.ok(workflow.jobs.verify.steps.some((step) => step.run?.includes('npm audit signatures')));
});
