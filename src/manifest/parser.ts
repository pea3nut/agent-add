import fs from 'fs';
import { resolveSource } from '../source/index.js';
import { ManifestSchema, type Manifest } from './schema.js';

export async function loadManifest(source: string, cwd: string): Promise<Manifest> {
  let jsonContent: string;

  try {
    const resolved = await resolveSource(source, cwd);
    jsonContent = await fs.promises.readFile(resolved.localPath, 'utf-8');

    if (resolved.tempDir) {
      try {
        await fs.promises.rm(resolved.tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  } catch (err) {
    process.stderr.write(`agent-get error: Failed to load Manifest from: ${source}\n`);
    process.stderr.write(`  Cause: ${(err as Error).message}\n`);
    process.exit(2);
  }

  let rawData: unknown;
  try {
    rawData = JSON.parse(jsonContent);
  } catch (err) {
    process.stderr.write(`agent-get error: Invalid JSON in Manifest: ${source}\n`);
    process.stderr.write(`  Cause: ${(err as Error).message}\n`);
    process.exit(2);
  }

  const parsed = ManifestSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    if (firstIssue) {
      const fieldPath = firstIssue.path.join('.');
      const message = firstIssue.message;

      const isTypeField = fieldPath.includes('type');
      const isNameField = fieldPath === 'name';

      if (isTypeField) {
        const assetArr = Array.isArray((rawData as Record<string, unknown>)?.['assets'])
          ? ((rawData as Record<string, unknown>)['assets'] as Array<Record<string, unknown>>)
          : [];
        const validTypes = new Set(['mcp', 'skill', 'prompt', 'command', 'subAgent']);
        const badType = assetArr.find((a) => typeof a?.['type'] === 'string' && !validTypes.has(a['type'] as string))?.['type'] ?? 'unknown';
        process.stderr.write(
          `agent-get error: Unsupported asset type: '${String(badType)}'. Supported: mcp, skill, prompt, command, subAgent\n`,
        );
      } else if (isNameField && (message.includes('namespace/pack-name') || message.includes('Invalid'))) {
        process.stderr.write(
          `agent-get error: Manifest name must match namespace/pack-name format\n`,
        );
      } else {
        process.stderr.write(
          `agent-get error: Manifest missing required field: ${fieldPath || 'unknown'}\n`,
        );
        process.stderr.write(`  ${message}\n`);
      }
    } else {
      process.stderr.write(`agent-get error: Invalid Manifest format\n`);
    }
    process.exit(2);
  }

  return parsed.data;
}
