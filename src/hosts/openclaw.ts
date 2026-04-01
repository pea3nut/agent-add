import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class OpenclawAdapter implements HostAdapter {
  readonly id = 'openclaw';
  readonly displayName = 'OpenClaw';
  readonly docs = 'https://openclawlab.com/en/docs/tools/skills-config/';
  readonly detection = {
    paths: ['~/.openclaw/', '.openclaw/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: NOT_SUPPORTED('OpenClaw does not natively support MCP server configuration (native MCP support was marked NOT_PLANNED by maintainers).'),
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.openclaw/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED('OpenClaw does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('OpenClaw does not support sub-agent configuration files.'),
  };
}
