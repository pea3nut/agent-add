import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class ClineAdapter implements HostAdapter {
  readonly id = 'cline';
  readonly displayName = 'Cline CLI';
  readonly docs = 'https://docs.cline.bot/mcp/configuring-mcp-servers';
  readonly detection = { paths: ['.cline/', '~/.cline/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '~/.cline/data/settings/cline_mcp_settings.json',
      configPathEnv: 'CLINE_MCP_SETTINGS_PATH',
      configKey: 'mcpServers',
      mcpFormat: 'cline',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.cline/rules/',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.cline/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: false,
      reason:
        'Use Cline skills for slash invocation; no independent command-file schema is verified.',
    },
    subAgent: {
      supported: false,
      reason:
        'Cline subagent discovery and required file schema are not verified; IDE and CLI capabilities differ.',
    },
  };
}
