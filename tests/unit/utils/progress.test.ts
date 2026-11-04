import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallProgress } from '../../../src/utils/progress.js';

afterEach(() => vi.useRealTimers());

describe('InstallProgress renderer', () => {
  it('refreshes a single TTY line while idle and stops on completion', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const progress = new InstallProgress({ isTTY: true, columns: 80, write });
    progress.pending('command/review');
    progress.start('command/review');
    progress.source({ phase: 'download', receivedBytes: 1024, totalBytes: 2048 });
    expect(write).toHaveBeenLastCalledWith(expect.stringContaining('[#####-----] 50% 1.0 KiB / 2.0 KiB'));
    const before = write.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(write.mock.calls.length).toBeGreaterThan(before);
    progress.finish('written');
    expect(write).toHaveBeenLastCalledWith('  written      command/review\n');
    const finished = write.mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect(write).toHaveBeenCalledTimes(finished);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('throttles plain logs without losing final byte counts', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const progress = new InstallProgress({ write });
    progress.start('command/review');
    progress.source({ phase: 'download', receivedBytes: 0 });
    const before = write.mock.calls.length;
    for (let i = 1; i < 100; i++) progress.source({ phase: 'download', receivedBytes: i });
    expect(write).toHaveBeenCalledTimes(before);
    vi.advanceTimersByTime(1000);
    progress.source({ phase: 'download', receivedBytes: 100 });
    progress.source({ phase: 'download', receivedBytes: 101, done: true });
    progress.finish('ready');
    const output = write.mock.calls.flat().join('');
    expect(output).toContain('downloading 99 B');
    expect(output).toContain('downloading 101 B');
    expect(output).not.toMatch(/[\r\x1b]/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limits animated line width and strips control characters from labels', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const progress = new InstallProgress({ isTTY: true, columns: 30, write });
    progress.start('command/\nreview\x1b[2J');
    progress.source({ phase: 'download', detail: 'Receiving objects: 50% (5/10)' });
    for (const [line] of write.mock.calls) {
      expect(line.slice('\r\x1b[2K'.length).length).toBeLessThan(30);
      expect(line).not.toContain('\x1b[2J');
      expect(line).not.toContain('\n');
    }
    progress.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
