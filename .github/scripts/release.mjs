import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const repository = 'pea3nut/agent-add';
const registry = 'https://registry.npmjs.org';

export function releaseVersion(ref) {
  assert.equal(typeof ref, 'string', 'A release tag is required');
  assert.ok(ref.startsWith('refs/tags/'), 'Run publishing from a version tag, not a branch');
  const version = ref.slice('refs/tags/'.length);
  const parts = version.split('.');
  assert.ok(parts.length === 3 && parts.every((part) => {
    const number = Number(part);
    return Number.isSafeInteger(number) && number >= 0 && String(number) === part;
  }), 'Release tags must be stable versions such as 1.3.1 (without a v prefix)');
  return version;
}

export function validatePackage(pkg, version) {
  assert.equal(pkg.name, 'agent-add', 'Unexpected npm package name');
  assert.equal(pkg.version, version, 'Tag and package version must match');
  const url = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  assert.ok([
    `https://github.com/${repository}`,
    `https://github.com/${repository}.git`,
    `git+https://github.com/${repository}`,
    `git+https://github.com/${repository}.git`,
  ].includes(url), 'The package repository must identify pea3nut/agent-add');
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare'])
    assert.equal(pkg.scripts?.[hook], undefined, `Unexpected consumer lifecycle hook: ${hook}`);
}

export function validateReceipt(receipt, context = process.env) {
  assert.equal(context.GITHUB_REPOSITORY, repository, 'Publishing is restricted to the upstream repository');
  assert.equal(receipt.version, releaseVersion(context.GITHUB_REF));
  assert.equal(receipt.repository, repository);
  assert.equal(receipt.commit, context.GITHUB_SHA, 'Artifact and workflow commits must match');
  assert.ok(typeof receipt.commit === 'string' && Buffer.from(receipt.commit, 'hex').length === 20
    && Buffer.from(receipt.commit, 'hex').toString('hex') === receipt.commit, 'Invalid commit SHA');
  assert.equal(receipt.filename, `agent-add-${receipt.version}.tgz`, 'Unexpected archive filename');
}

export function verifyArtifact(directory, context = process.env) {
  const receipt = JSON.parse(fs.readFileSync(path.join(directory, 'release.json'), 'utf8'));
  validateReceipt(receipt, context);
  const file = path.join(directory, receipt.filename);
  const bytes = fs.readFileSync(file);
  const hash = createHash('sha512').update(bytes);
  assert.equal(hash.copy().digest('hex'), receipt.sha512, 'Archive SHA-512 mismatch');
  assert.equal('sha512-' + hash.digest('base64'), receipt.integrity, 'Archive integrity mismatch');
  const pkg = JSON.parse(execFileSync('tar', ['-xOf', file, 'package/package.json'], { encoding: 'utf8' }));
  validatePackage(pkg, receipt.version);
  return receipt;
}

export function validateSource(context = process.env) {
  const version = releaseVersion(context.GITHUB_REF);
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  validatePackage(pkg, version);
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const commit = git('rev-parse', 'HEAD');
  validateReceipt({ repository, version, commit, filename: `agent-add-${version}.tgz` }, context);
  assert.equal(commit, context.GITHUB_SHA, 'Checkout must match the workflow commit');
  assert.equal(git('rev-parse', '--verify', `${context.GITHUB_REF}^{commit}`), commit, 'Checkout must match the tag');
  execFileSync('git', ['merge-base', '--is-ancestor', commit, 'refs/remotes/origin/master']);
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--']);
  return { version, commit };
}

export function prepare(directory, context = process.env) {
  const { version, commit } = validateSource(context);
  fs.mkdirSync(directory, { recursive: true });
  const packed = JSON.parse(execFileSync('npm', [
    'pack', '--ignore-scripts', '--json', '--pack-destination', directory,
  ], { encoding: 'utf8' }));
  assert.equal(packed.length, 1, 'Expected exactly one npm package');
  assert.equal(packed[0].filename, `agent-add-${version}.tgz`, 'Unexpected npm pack filename');
  const receipt = {
    repository, version, commit, filename: packed[0].filename,
    integrity: packed[0].integrity,
    sha512: createHash('sha512').update(fs.readFileSync(path.join(directory, packed[0].filename))).digest('hex'),
  };
  fs.writeFileSync(path.join(directory, 'release.json'), JSON.stringify(receipt, null, 2) + '\n');
  verifyArtifact(directory, context);
  if (context.GITHUB_OUTPUT)
    fs.appendFileSync(context.GITHUB_OUTPUT, `version=${version}\nfilename=${receipt.filename}\nsha512=${receipt.sha512}\n`);
  return receipt;
}

export function validateRegistryMetadata(metadata, receipt) {
  validatePackage(metadata, receipt.version);
  assert.equal(metadata.dist?.integrity, receipt.integrity, 'Registry integrity differs from the tested package');
  assert.equal(metadata.dist.tarball, `${registry}/agent-add/-/${receipt.filename}`, 'Unexpected registry archive URL');
  assert.ok(typeof metadata.dist.attestations?.url === 'string', 'npm provenance is missing');
  assert.equal(new URL(metadata.dist.attestations.url).origin, registry, 'Unexpected attestation registry');
  assert.ok(metadata.dist.attestations.provenance?.predicateType, 'npm provenance predicate is missing');
}

// This checks the signed statement's expected identity. npm audit signatures
// subsequently verifies its cryptography; decoding JSON alone is not a signature check.
export function validateProvenance(attestations, receipt) {
  const type = 'https://slsa.dev/provenance/v1';
  const entry = attestations.attestations?.find((item) => item.predicateType === type);
  assert.ok(entry?.bundle?.dsseEnvelope?.payload, 'SLSA v1 provenance statement is missing');
  const statement = JSON.parse(Buffer.from(entry.bundle.dsseEnvelope.payload, 'base64').toString('utf8'));
  assert.equal(statement.predicateType, type);
  assert.ok(statement.subject?.some((item) => item.name === `pkg:npm/agent-add@${receipt.version}`
    && item.digest?.sha512 === receipt.sha512), 'Provenance does not identify the tested package digest');
  const definition = statement.predicate?.buildDefinition;
  const ref = `refs/tags/${receipt.version}`;
  assert.equal(definition?.buildType, 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1');
  assert.deepEqual(definition.externalParameters?.workflow, {
    repository: `https://github.com/${repository}`, ref, path: '.github/workflows/publish.yml',
  }, 'Provenance workflow identity differs from this release');
  assert.ok(definition.resolvedDependencies?.some((item) =>
    item.uri === `git+https://github.com/${repository}@${ref}` && item.digest?.gitCommit === receipt.commit),
  'Provenance does not identify the release commit');
}

export async function verifyRegistry(directory, context = process.env) {
  const receipt = verifyArtifact(directory, context);
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(`${registry}/agent-add/${receipt.version}?verify=${Date.now()}`, {
        signal: AbortSignal.timeout(15000), cache: 'no-store',
      });
      assert.equal(response.status, 200, `Registry metadata returned ${response.status}`);
      const metadata = await response.json();
      validateRegistryMetadata(metadata, receipt);
      const [tarball, provenanceResponse] = await Promise.all([
        fetch(`${metadata.dist.tarball}?verify=${Date.now()}`, { signal: AbortSignal.timeout(30000), cache: 'no-store' }),
        fetch(metadata.dist.attestations.url, { signal: AbortSignal.timeout(15000), cache: 'no-store' }),
      ]);
      assert.equal(tarball.status, 200, `Registry tarball returned ${tarball.status}`);
      assert.equal(provenanceResponse.status, 200, 'Cannot retrieve provenance');
      const bytes = Buffer.from(await tarball.arrayBuffer());
      assert.equal(createHash('sha512').update(bytes).digest('hex'), receipt.sha512, 'Published archive differs from the tested archive');
      const provenance = await provenanceResponse.json();
      validateProvenance(provenance, receipt);
      fs.writeFileSync(path.join(directory, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
      fs.writeFileSync(path.join(directory, 'registry-verification.json'), JSON.stringify({
        ...receipt, attestations: metadata.dist.attestations,
        workflow: `${context.GITHUB_SERVER_URL}/${repository}/actions/runs/${context.GITHUB_RUN_ID}`,
      }, null, 2) + '\n');
      if (context.GITHUB_STEP_SUMMARY)
        fs.appendFileSync(context.GITHUB_STEP_SUMMARY, `## agent-add ${receipt.version}\n\nSource: [${receipt.commit}](https://github.com/${repository}/commit/${receipt.commit})\n\nThe npm tarball matches the tested SHA-512. Provenance: ${metadata.dist.attestations.url}\n\nCryptographic attestation verification runs in the next step.\n`);
      return receipt;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw lastError;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, directory] = process.argv.slice(2);
  assert.ok(directory, 'An artifact directory is required');
  const commands = { prepare, check: verifyArtifact, 'verify-registry': verifyRegistry, validate: () => validateSource() };
  assert.ok(Object.hasOwn(commands, command), 'Unknown release command');
  await commands[command](path.resolve(directory));
}
