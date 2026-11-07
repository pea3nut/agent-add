import fs from 'fs';
import { atomicWriteText, isRecord, readTextOrNull, resolveConfigPath } from '../utils/config.js';
import { editMcpConfig } from '../hosts/mcp-config.js';
import { convertMcpServer } from '../hosts/mcp-source.js';
import { unwrapMcpServers } from '../utils/unwrap-mcp-servers.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

export const mcpHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, resolvedSource } = job;
    let assetName = job.assetName;
    const mcpCapability = host.assets['mcp'];

    let configFilePath: string;
    try {
      configFilePath = await resolveConfigPath(mcpCapability);
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: (err as Error).message,
      };
    }

    let newServerConfig: Record<string, unknown>;
    try {
      const rawContent = await fs.promises.readFile(
        resolvedSource.localPath,
        'utf-8',
      );
      newServerConfig = JSON.parse(rawContent) as Record<string, unknown>;
      if (!isRecord(newServerConfig))
        throw new Error('MCP source must be a JSON object');

      // Unwrap nested mcpServers format if present
      const unwrapped = unwrapMcpServers(newServerConfig);
      if (unwrapped) {
        newServerConfig = unwrapped.config;
        assetName = unwrapped.name;
      }
      newServerConfig = convertMcpServer(host, newServerConfig, assetName);
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read MCP source file: ${(err as Error).message}`,
      };
    }

    try {
      const existing = await readTextOrNull(configFilePath);
      const edit = editMcpConfig(host, existing, configFilePath, assetName, newServerConfig, job.overwrite);
      if ('content' in edit) await atomicWriteText(configFilePath, edit.content);
      return {
        job,
        status: edit.status,
        ...('reason' in edit ? { reason: edit.reason } : {}),
        targetPath: configFilePath,
      };
    } catch (err) {
      return {
        job,
        status: 'error',
        targetPath: configFilePath,
        reason: (err as Error).message,
      };
    }
  },
};
