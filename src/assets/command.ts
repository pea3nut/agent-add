import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { stringify } from 'smol-toml';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

// Gemini 命令以 TOML 存储：Markdown 正文放入 prompt，仅保留可选的 description。
function toToml(content: string): string {
  // 只识别文件开头由 --- 包围的 YAML frontmatter，兼容 BOM 和 LF/CRLF。
  // 第 1 组是元数据，第 2 组是正文；未匹配时，把全文作为 prompt。
  const match = content.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?\r?\n)?---[\t ]*(?:\r?\n|$)([\s\S]*)$/);
  let prompt = content;
  let description: string | undefined;

  if (match) {
    // 空 frontmatter 解析为 null；否则必须是映射，且 description 若存在就必须是字符串。
    const metadata: unknown = yaml.parse(match[1] ?? '');
    if (metadata !== null && (typeof metadata !== 'object' || Array.isArray(metadata))) {
      throw new Error('Command frontmatter must be a YAML mapping');
    }
    const value = (metadata as Record<string, unknown> | null)?.description;
    if (value !== undefined && typeof value !== 'string') {
      throw new Error('Command description must be a string');
    }
    description = value;
    prompt = match[2]!;
  }

  // 由序列化器处理引号、反斜杠和换行，避免手工拼接出非法 TOML。
  return stringify(description === undefined ? { prompt } : { description, prompt });
}

// 单个 command 的安装流程：读源文件 → 转成宿主格式 → 比较目标 → 写入或返回冲突。
export const commandHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const commandCapability = host.assets['command'];
    const installDir = commandCapability.installDir as string;
    const ext = commandCapability.fileExtension ?? '.md';
    const targetPath = path.resolve(process.cwd(), installDir, `${assetName}${ext}`);

    let newContent: string;
    try {
      newContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read command source: ${(err as Error).message}`,
      };
    }

    // 按宿主声明的扩展名选择格式：目前 Gemini 用 TOML，其他宿主仍原样写 Markdown。
    if (ext === '.toml') {
      try {
        newContent = toToml(newContent);
      } catch (err) {
        return {
          job,
          status: 'error',
          reason: `Failed to convert command source to TOML: ${(err as Error).message}`,
        };
      }
    }

    // 转换和校验成功后才创建目录，格式错误时不留下目标文件。
    await ensureDir(path.dirname(targetPath));

    let existingContent: string | null = null;
    try {
      existingContent = await fs.promises.readFile(targetPath, 'utf-8');
    } catch {
      // 未读到已有内容，继续尝试写入。
    }

    // 比较最终写入的内容（Gemini 为转换后的 TOML）；相同则跳过，不同则保留旧文件并报冲突。
    if (existingContent !== null) {
      if (existingContent === newContent) {
        return { job, status: 'exists', targetPath };
      }
      return {
        job,
        status: 'conflict',
        targetPath,
        reason: `${targetPath} already exists with different content`,
      };
    }

    await fs.promises.writeFile(targetPath, newContent, 'utf-8');
    return { job, status: 'written', targetPath };
  },
};
