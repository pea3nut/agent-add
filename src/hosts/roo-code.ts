import { z } from 'zod';
import { flag, strings, text, standardMcpServer } from './mcp.js';
import {
  HostId,
  type McpAdapter,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, file, rules, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class RooCodeAdapter implements HostAdapter {
  readonly id = HostId.RooCode;
  readonly selectionPriority = 11;
  readonly displayName = 'Roo Code';
  readonly detection = {
    paths: ['.roo/'],
  };
  readonly mcp: McpAdapter = {
    convert: (input) => {
      const { source, url, transport } = input;
      const entry = standardMcpServer(input, this.id);
      z.object({
        disabled: flag,
        disabledTools: strings,
        cwd: text,
        alwaysAllow: strings,
        watchPaths: strings,
        timeout: z.number().min(1).max(3600).optional(),
      }).parse(entry);
      delete entry.transport;
      if (url !== undefined) entry.type = transport === 'sse' ? 'sse' : 'streamable-http';
      else if (source.type !== undefined || source.transport !== undefined) entry.type = 'stdio';
      return entry;
    },
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.roo/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.roo/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.roo/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.roo/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: NOT_SUPPORTED('Roo Code does not support sub-agent configuration files.'),
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      prompt: rules(at('.roo/rules')),
      skill: skill(at('.roo/skills')),
      command: file(at('.roo/commands')),
    };
  };
}
