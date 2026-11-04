import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class GitHubCopilotAdapter implements HostAdapter {
  readonly id = 'github-copilot';
  readonly displayName = 'GitHub Copilot';
  readonly detection = {
    paths: ['.github/', '.vscode/'],
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
}
