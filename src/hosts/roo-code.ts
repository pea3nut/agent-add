import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class RooCodeAdapter implements HostAdapter {
  readonly id = 'roo-code';
  readonly displayName = 'Roo Code';
  readonly docs = 'https://docs.roocode.com/features/mcp/using-mcp-in-roo';
  readonly detection = {
    paths: ['.roo/'],
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
}
