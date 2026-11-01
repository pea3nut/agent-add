import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class OpenclawAdapter implements HostAdapter {
  readonly id = 'openclaw';
  readonly displayName = 'OpenClaw';
  readonly docs = 'https://docs.openclaw.ai/tools/mcp';
  readonly detection = {
    paths: ['~/.openclaw/', '.openclaw/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '~/.openclaw/openclaw.json',
      configPathEnv: 'OPENCLAW_CONFIG_PATH',
      configKeyPath: ['mcp', 'servers'],
      configFormat: 'json5',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '~/.openclaw/workspace/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED(
      'OpenClaw does not support custom slash commands via files.',
    ),
    subAgent: NOT_SUPPORTED(
      'OpenClaw does not support sub-agent configuration files.',
    ),
  };
}
