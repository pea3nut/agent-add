import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse as parseToml } from './toml-parser/package/dist/index.js';

// Run from a directory containing the five upstream checkouts. The package and
// TOML parser are extracted npm tarballs; no MCP server is launched by this test.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const bin = path.join(here, 'published-package/package/bin/agent-add.js');
const expectedIntegrity = 'sha512-eqOd0o5XbdKqYRJaQZetqqUMnh33yrkuSSRbIAjrHLEw6CUrcZpKfZoE+sDgFLO9nanoulSap/LX2MCy0Dm6Bw==';
const tarball = await fs.readFile(path.join(here, 'published-package/agent-add-1.3.1.tgz'));
assert.equal('sha512-' + createHash('sha512').update(tarball).digest('base64'), expectedIntegrity);
const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-add-outreach-'));
const specs = [
  {repo:'designcomputer/mysql_mcp_server', folder:'mysql_mcp_server', doc:'README.md', marker:'### Installing via Agent Add', name:'mysql'},
  {repo:'svnscha/mcp-windbg', folder:'mcp-windbg', doc:'docs/reference/clients.md', marker:'## Claude Desktop', name:'mcp-windbg', jsonExample:true},
  {repo:'54yyyu/zotero-mcp', folder:'zotero-mcp', doc:'docs/getting-started.md', marker:'## Using with Other MCP Clients', name:'zotero'},
  {repo:'vishalsachdev/canvas-mcp', folder:'canvas-mcp-agent-add', doc:'README.md', marker:'<summary><strong>Other AI agents</strong></summary>', name:'canvas-api'},
  {repo:'Jpisnice/shadcn-ui-mcp-server', folder:'shadcn-ui-mcp-server', doc:'README.md', marker:'## 💻 Other AI Agent Integration', source:'.mcp.json', name:'shadcn-ui'},
];
const hosts = [
  {id:'cursor', file:'.cursor/mcp.json', key:'mcpServers'},
  {id:'codex', file:'.codex/config.toml', key:'mcp_servers'},
  {id:'gemini', file:'.gemini/settings.json', key:'mcpServers'},
];
const clean = value => value.replaceAll(sandbox, '<SANDBOX>').replaceAll(root, '<WORKSPACE>');
const logs = [];
function run(cwd, args, expectedExit = 0) {
  const profile = path.join(sandbox, 'isolated-profile');
  const r = spawnSync(process.execPath, [bin, ...args], {
    cwd, encoding:'utf8', timeout:30000,
    env:{...process.env, HOME:profile, USERPROFILE:profile,
      APPDATA:path.join(profile,'AppData/Roaming'), LOCALAPPDATA:path.join(profile,'AppData/Local'),
      CODEX_HOME:path.join(profile,'.codex'), CI:'1', NO_COLOR:'1'},
  });
  const output = clean((r.stdout || '') + (r.stderr || ''));
  logs.push({args:args.map(clean),exitCode:r.status,output});
  if (r.error) throw r.error;
  assert.equal(r.status, expectedExit, output);
}
const report = {
  checkedAt:new Date().toISOString(), package:'agent-add@1.3.1',
  integrity:expectedIntegrity, integrityVerified:true,
  environment:{platform:process.platform,arch:process.arch,node:process.version},
  scope:'Project-scope configuration generation with the published 1.3.1 artifact; automated runs add --host to the interactive documentation examples. No MCP servers or host applications launched and no live service credentials used.',
  cases:[],
};
for (const spec of specs) {
  const checkout = path.join(root, spec.folder);
  const doc = await fs.readFile(path.join(checkout, spec.doc), 'utf8');
  let source;
  const section = doc.slice(doc.indexOf(spec.marker)).replaceAll('\r\n','\n');
  assert.ok(doc.includes(spec.marker));
  let documentedSource;
  if (spec.jsonExample) {
    // This guide reuses its existing Claude Desktop JSON instead of repeating it.
    source = section.slice(section.indexOf('```json')).split('\n').slice(1).join('\n').split('```')[0];
  } else {
    const line = section.split('\n').find(s=>s.startsWith('npx -y agent-add --mcp '));
    assert.ok(line, 'Missing documented command for '+spec.repo);
    documentedSource = line.slice('npx -y agent-add --mcp '.length);
    if (spec.source) source = await fs.readFile(path.join(checkout,spec.source),'utf8');
    else source = documentedSource.slice(1,-1); // Bash single-quoted inline JSON.
  }
  const input = JSON.parse(source);
  const config = input.mcpServers ? input : {mcpServers:input};
  assert.deepEqual(Object.keys(config.mcpServers), [spec.name]);
  const sourcePath = path.join(sandbox, spec.folder + '.json');
  await fs.writeFile(sourcePath, source);
  const expected = config.mcpServers[spec.name];
  for (const host of hosts) {
    const project = path.join(sandbox, spec.folder, host.id);
    const destination = path.join(project, host.file);
    await fs.mkdir(path.dirname(destination), {recursive:true});
    const seedEntry = {command:'existing-server',args:['--keep']};
    const seed = host.id === 'codex'
      ? '# Existing user comment\nmodel = "existing-model"\n\n[mcp_servers.existing]\ncommand = "existing-server"\nargs = ["--keep"]\n'
      : JSON.stringify({existingPreference:true,mcpServers:{existing:seedEntry}},null,2)+'\n';
    await fs.writeFile(destination, seed);
    const args = ['--host',host.id,'--mcp',spec.jsonExample ? sourcePath : spec.source ? documentedSource : source];
    run(project,args);
    const first = await fs.readFile(destination,'utf8');
    const parsed = host.id === 'codex' ? parseToml(first) : JSON.parse(first);
    assert.deepEqual(parsed[host.key][spec.name],expected);
    assert.deepEqual(parsed[host.key].existing,seedEntry);
    assert.equal(host.id === 'codex' ? parsed.model : parsed.existingPreference,
      host.id === 'codex' ? 'existing-model' : true);
    if(host.id === 'codex') assert.ok(first.includes('# Existing user comment'));
    run(project,args);
    assert.equal(await fs.readFile(destination,'utf8'),first,'Repeat changed the configuration');
    const conflictPath = path.join(sandbox,spec.folder+'-conflict.json');
    await fs.writeFile(conflictPath,JSON.stringify({mcpServers:{[spec.name]:{command:'different-server'}}}));
    run(project,['--host',host.id,'--mcp',conflictPath],1);
    assert.equal(await fs.readFile(destination,'utf8'),first,'Conflicting install changed the configuration');
    report.cases.push({repo:spec.repo,host:host.id,
      upstreamCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'}).trim(),
      doc:spec.doc,docSha256:createHash('sha256').update(doc.replaceAll('\r\n','\n')).digest('hex'),
      input:config,sourceKind:spec.jsonExample?'reused JSON file':spec.source?'documented remote URL':'documented inline JSON',output:parsed,checks:['exact command/args/env/cwd','existing server and preferences preserved','identical repeat unchanged','conflicting repeat refused without changes'],status:'passed'});
  }
}
report.invocations=logs.length;
report.passed=report.cases.length;
report.logs=logs;
await fs.writeFile(path.join(here,'results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,invocations:logs.length,report:path.join(here,'results.json')},null,2));

