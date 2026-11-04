import { standardMcpServer } from './mcp.js';
import {
  HostId,
  type McpAdapter,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, file, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class GitHubCopilotAdapter implements HostAdapter {
  readonly id = HostId.GitHubCopilot;
  readonly selectionPriority = 5;
  readonly displayName = 'GitHub Copilot';
  readonly detection = {
    paths: ['.github/', '.vscode/'],
  };
  readonly mcp: McpAdapter = {
    convert: (input) => {
      const { url, transport } = input;
      const entry = standardMcpServer(input, this.id);
      delete entry.transport;
      return { ...entry, type: url !== undefined ? (transport === 'sse' ? 'sse' : 'http') : 'stdio' };
    },
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.vscode/mcp.json',
      configKey: 'servers',
      configFormat: 'jsonc',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: '.github/copilot-instructions.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.github/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.github/prompts/',
      fileExtension: '.prompt.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.github/agents/',
      fileExtension: '.agent.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { env } = environment;
    const { at, reject } = userPaths(environment);
    return env.COPILOT_HOME
      ? {
        skill: reject('COPILOT_HOME'),
        subAgent: reject('COPILOT_HOME'),
      }
      : {
        skill: skill(at('.copilot/skills')),
        subAgent: file(at('.copilot/agents'), '.agent.md'),
      };
  };
}
