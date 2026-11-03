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
    paths: ['.openclaw/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: NOT_SUPPORTED('No verified project-level installation target is supported.'),
    prompt: NOT_SUPPORTED('No verified project-level installation target is supported.'),
    skill: NOT_SUPPORTED('No verified project-level installation target is supported.'),
    command: NOT_SUPPORTED(
      'OpenClaw does not support custom slash commands via files.',
    ),
    subAgent: NOT_SUPPORTED(
      'OpenClaw does not support sub-agent configuration files.',
    ),
  };
}
