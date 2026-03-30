import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class GitHubCopilotAdapter implements HostAdapter {
  readonly id = 'github-copilot';
  readonly displayName = 'GitHub Copilot';
  readonly docs = 'https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp';
  readonly detection = {
    paths: ['.github/', '.vscode/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.vscode/mcp.json',
      configKey: 'servers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: '.github/copilot-instructions.md',
      writeStrategy: 'append-with-marker',
    },
    skill: NOT_SUPPORTED('GitHub Copilot does not support project-level skill directories.'),
    command: NOT_SUPPORTED('GitHub Copilot does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('GitHub Copilot does not support sub-agent configuration files.'),
  };
}
