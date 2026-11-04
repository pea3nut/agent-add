import path from 'path';
import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class OpenclawAdapter implements HostAdapter {
  readonly id = HostId.OpenClaw;
  readonly selectionPriority = 16;
  readonly displayName = 'OpenClaw';
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

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { env } = environment;
    const { at, override, custom, reject } = userPaths(environment);
    const name = env.OPENCLAW_PROFILE && env.OPENCLAW_PROFILE !== 'default' ? 'OPENCLAW_PROFILE' : custom(['OPENCLAW_HOME']);
    return { skill: name ? reject(name) : skill(path.join(override('OPENCLAW_STATE_DIR', at('.openclaw')), 'skills')) };
  };
}
