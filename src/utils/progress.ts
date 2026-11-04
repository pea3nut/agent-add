export interface SourceProgress {
  phase: 'download' | 'checkout';
  receivedBytes?: number;
  totalBytes?: number;
  done?: boolean;
  detail?: string;
}

export type OnSourceProgress = (progress: SourceProgress) => void;

interface Output {
  isTTY?: boolean;
  columns?: number;
  write(text: string): unknown;
}

function clean(text: string): string {
  return text.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
}

function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 ** 2).toFixed(1)} MiB`;
}

function bar(percent: number): string {
  const filled = Math.round(Math.min(100, Math.max(0, percent)) / 10);
  return `[${'#'.repeat(filled)}${'-'.repeat(10 - filled)}] ${Math.floor(percent)}%`;
}

export class InstallProgress {
  private label?: string;
  private message = '';
  private timer?: ReturnType<typeof setInterval>;
  private frame = 0;
  private lastLog = 0;
  private lastMessage = '';
  private phase = '';

  constructor(private readonly output: Output = process.stdout) {}

  pending(label: string): void {
    this.output.write(`  pending     ${clean(label)}\n`);
  }

  start(label: string, message = 'resolving'): void {
    this.stop();
    this.label = clean(label);
    this.phase = '';
    this.update(message);
    this.timer = setInterval(() => {
      if (this.output.isTTY) this.render();
      else if (this.message !== this.lastMessage && Date.now() - this.lastLog >= 1000) this.update(this.message);
    }, this.output.isTTY ? 100 : 1000);
    this.timer.unref();
  }

  update(message: string): void {
    if (!this.label) return;
    this.message = clean(message);
    if (this.output.isTTY) this.render();
    else {
      this.output.write(`  ${this.message}  ${this.label}\n`);
      this.lastMessage = this.message;
      this.lastLog = Date.now();
    }
  }

  readonly source: OnSourceProgress = (progress) => {
    let message = progress.phase === 'checkout' ? 'checking out' : 'downloading';
    if (progress.receivedBytes !== undefined) {
      message += progress.totalBytes
        ? ` ${bar(progress.receivedBytes / progress.totalBytes * 100)} ${bytes(progress.receivedBytes)} / ${bytes(progress.totalBytes)}`
        : ` ${bytes(progress.receivedBytes)}`;
    } else if (progress.detail) {
      const percent = progress.detail.match(/(\d+)%/);
      if (percent) message += ` ${bar(Number(percent[1]))}`;
      message += ` ${progress.detail}`;
    }
    this.message = clean(message);
    const now = Date.now();
    const complete = progress.done;
    if (this.output.isTTY) {
      if (progress.phase !== this.phase || complete) this.render();
    } else if (progress.phase !== this.phase || now - this.lastLog >= 1000 || complete) {
      this.update(message);
    }
    this.phase = progress.phase;
  };

  finish(status: string): void {
    const label = this.label;
    this.stop();
    if (label) this.output.write(`  ${clean(status).padEnd(12)} ${label}\n`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (this.label && this.output.isTTY) this.output.write('\r\x1b[2K');
    this.label = undefined;
  }

  private render(): void {
    if (!this.label) return;
    const spinner = ['|', '/', '-', '\\'][this.frame++ % 4];
    const line = `  ${spinner} ${this.label} — ${this.message}`;
    const width = Math.max(1, (this.output.columns ?? 80) - 1);
    this.output.write(`\r\x1b[2K${line.length > width ? line.slice(0, width - 1) + '…' : line}`);
  }
}
