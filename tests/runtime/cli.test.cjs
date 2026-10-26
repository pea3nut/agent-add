const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// CI 指向解包后的发布产物；本地默认检查刚构建的 CLI。
const bin = process.env.AGENT_ADD_BIN || path.resolve(__dirname, '../../bin/agent-add.js');

// 每次检查使用独立项目和用户目录，避免读写真实配置，结束后清理。
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
  // 用当前测试进程的 Node 启动 CLI，确保测到矩阵指定的运行时版本。
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

// 普通管道不会进入交互分支；用真实终端检查选宿主依赖在旧 Node 上是否崩溃。
// 这里只做运行时冒烟，安装结果等业务语义由 scenario tests 覆盖。
test('published CLI completes host selection without a runtime crash through a real TTY', { skip: process.platform !== 'linux' }, async () => {
  await withProject(async (root, options) => {
    fs.mkdirSync(path.join(root, '.cursor'));
    fs.writeFileSync(path.join(root, 'review.md'), '# Review\n');
    // script 的 -c 参数交给 shell 执行，因此路径中的单引号也需要转义。
    const quote = (value) => "'" + value.replace(/'/g, "'\\''") + "'";
    const command = [process.execPath, bin, '--command', './review.md'].map(quote).join(' ');
    const output = await new Promise((resolve, reject) => {
      // Linux 的 script 分配伪终端，让 CLI 的 stdin/stdout 都表现为 TTY。
      const proc = spawn('script', ['-q', '-e', '-c', command, '/dev/null'], options);
      let output = '';
      let selected = false;
      proc.on('error', reject);
      proc.stdout.on('data', (chunk) => {
        output += chunk;
        if (!selected && output.includes('Select target host:')) {
          // 提示出现后只发送一次回车，接受默认宿主，让 CLI 完成执行。
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
  });
});
