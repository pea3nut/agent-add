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
  {repo:'designcomputer/mysql_mcp_server', folder:'mysql_mcp_server', doc:'README.md', marker:'### Register in Cursor, Codex, or Gemini CLI', name:'mysql'},
  {repo:'svnscha/mcp-windbg', folder:'mcp-windbg', doc:'docs/reference/clients.md', marker:'## Cursor, Codex, and Gemini CLI with agent-add', name:'mcp-windbg'},
  {repo:'54yyyu/zotero-mcp', folder:'zotero-mcp', doc:'docs/getting-started.md', marker:'## Registering in Cursor, Codex, or Gemini CLI', name:'zotero'},
  {repo:'vishalsachdev/canvas-mcp', folder:'canvas-mcp-agent-add', doc:'README.md', marker:'<summary><strong>Cursor, Codex, or Gemini CLI with agent-add</strong></summary>', name:'canvas-api'},
  {repo:'Jpisnice/shadcn-ui-mcp-server', folder:'shadcn-ui-mcp-server', doc:'README.md', source:'.mcp.json', name:'shadcn-ui'},
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
  scope:'Project-scope configuration generation only; no MCP servers or host applications launched and no live service credentials used.',
  cases:[],
};
for (const spec of specs) {
  const checkout = path.join(root, spec.folder);
  const doc = await fs.readFile(path.join(checkout, spec.doc), 'utf8');
  let source;
  if (spec.source) source = await fs.readFile(path.join(checkout, spec.source),'utf8');
  else {
    const section = doc.slice(doc.indexOf(spec.marker)).replaceAll('\r\n','\n');
    assert.ok(doc.includes(spec.marker));
    source = section.split('```json\n')[1]?.split('```')[0];
    assert.ok(source, 'Missing documented JSON for ' + spec.repo);
  }
  const config = JSON.parse(source);
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
    const args = ['--host',host.id,'--mcp',sourcePath];
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
      input:config,output:parsed,checks:['exact command/args/env/cwd','existing server and preferences preserved','identical repeat unchanged','conflicting repeat refused without changes'],status:'passed'});
  }
}
// The WinDbg addition also documents installing its optional Cursor workflows.
const skillSource = path.join(root,'mcp-windbg/plugins/mcp-windbg-skills/skills');
const skillProject = path.join(sandbox,'windbg-skills');
await fs.mkdir(skillProject,{recursive:true});
const skillArgs = ['--host','cursor','--mcp',path.join(sandbox,'mcp-windbg.json')];
for (const name of ['analyze-dump','debug-remote','kernel-debug','windbg-doctor']) {
  run(skillProject,[...skillArgs,'--skill',path.join(skillSource,name)]);
}
let skillFiles = 0;
async function compareTree(src,dest) {
  for(const entry of await fs.readdir(src,{withFileTypes:true})) {
    if(entry.isDirectory()) await compareTree(path.join(src,entry.name),path.join(dest,entry.name));
    else if(entry.isFile()) {assert.deepEqual(await fs.readFile(path.join(src,entry.name)),await fs.readFile(path.join(dest,entry.name)));skillFiles++;}
  }
}
await compareTree(skillSource,path.join(skillProject,'.cursor/skills'));
for (const name of ['analyze-dump','debug-remote','kernel-debug','windbg-doctor']) {
  run(skillProject,[...skillArgs,'--skill',path.join(skillSource,name)]);
}
await compareTree(skillSource,path.join(skillProject,'.cursor/skills'));
report.skills={repo:'svnscha/mcp-windbg',host:'cursor',workflows:4,comparedFiles:skillFiles/2,status:'passed',scope:'Copied workflow bytes and repeat installation only; workflows not executed.'};
report.invocations=logs.length;
report.passed=report.cases.length;
report.logs=logs;
await fs.writeFile(path.join(here,'results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,skills:report.skills,invocations:logs.length,report:path.join(here,'results.json')},null,2));

