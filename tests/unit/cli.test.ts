import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const selectMock = vi.fn();
vi.mock('@inquirer/select', () => ({ default: selectMock }));

const { createProgram } = await import('../../src/cli.js');

describe('CLI host prompt TTY detection', () => {
  let stdinIsTTY: PropertyDescriptor | undefined;
  let stdoutIsTTY: PropertyDescriptor | undefined;

  beforeEach(() => {
    stdinIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
    stdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
    selectMock.mockReset();
  });

  afterEach(() => {
    for (const [stream, desc] of [
      [process.stdin, stdinIsTTY],
      [process.stdout, stdoutIsTTY],
    ] as const) {
      if (desc) {
        Object.defineProperty(stream, 'isTTY', desc);
      } else {
        delete (stream as { isTTY?: boolean }).isTTY;
      }
    }
    vi.restoreAllMocks();
  });

  function setTTY(stdin: boolean, stdout: boolean): void {
    Object.defineProperty(process.stdin, 'isTTY', { value: stdin, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: stdout, configurable: true });
  }

  async function runWithoutHost(): Promise<{ exitCode: number | undefined; stderr: string }> {
    let stderr = '';
    vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => {
      stderr += String(chunk);
      return true;
    });
    vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as never);

    let exitCode: number | undefined;
    try {
      await createProgram().parseAsync(['node', 'agent-add', '--mcp', './x.json']);
    } catch (err) {
      const match = /process\.exit\((\d+)\)/.exec((err as Error).message);
      if (!match) throw err;
      exitCode = Number(match[1]);
    }
    return { exitCode, stderr };
  }

  it('requires --host instead of prompting when stdin is piped but stdout is a TTY (regression)', async () => {
    setTTY(false, true);
    const { exitCode, stderr } = await runWithoutHost();
    expect(exitCode).toBe(2);
    expect(stderr).toContain('Non-interactive environment detected');
    expect(selectMock).not.toHaveBeenCalled();
  });

  it('requires --host when stdout is not a TTY', async () => {
    setTTY(true, false);
    const { exitCode } = await runWithoutHost();
    expect(exitCode).toBe(2);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it('prompts for a host when both stdin and stdout are TTYs', async () => {
    setTTY(true, true);
    selectMock.mockRejectedValue(new Error('prompt shown'));
    await expect(createProgram().parseAsync(['node', 'agent-add', '--mcp', './x.json'])).rejects.toThrow(
      'prompt shown',
    );
    expect(selectMock).toHaveBeenCalledOnce();
  });
});
