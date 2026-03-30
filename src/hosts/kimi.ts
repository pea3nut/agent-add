import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class KimiAdapter implements HostAdapter {
  readonly id = 'kimi';
  readonly displayName = 'Kimi Code';
  readonly docs = 'https://moonshotai.github.io/kimi-cli/en/customization/mcp.html';
  readonly detection = {
    paths: ['~/.kimi/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/.kimi/mcp.json',
        linux: '~/.kimi/mcp.json',
        win32: '%USERPROFILE%\\.kimi\\mcp.json',
      },
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: NOT_SUPPORTED('Kimi Code does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Kimi Code does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Kimi Code does not support sub-agent configuration files.'),
  };
}
