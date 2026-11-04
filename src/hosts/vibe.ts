import { editTomlMcpConfig } from './mcp-config.js';
import { stringify } from 'smol-toml';
import { standardMcpServer } from './mcp.js';
import path from 'path';
import {
  HostId,
  type SubAgentContent,
  type McpAdapter,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, file, prompt, mcp, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class VibeAdapter implements HostAdapter {
  readonly id = HostId.Vibe;
  readonly selectionPriority = 17;
  readonly displayName = 'Mistral Vibe';
  readonly detection = {
    paths: ['.vibe/'],
  };
  readonly mcp: McpAdapter = {
    editConfig: (current, file, name, server) =>
      editTomlMcpConfig(current, file, name, server, 'named-array', this.displayName),
    convert: (input, name) => {
      const { url } = input;
      const entry = standardMcpServer(input, this.id);
      delete entry.type;
      delete entry.transport;
      if (url !== undefined)
        throw new Error(
          'Remote Vibe MCP transport is not implemented; refusing to drop its URL',
        );
      const allowed = new Set(['command', 'args', 'env', 'transport', 'name']);
      for (const key of Object.keys(entry))
        if (!allowed.has(key))
          throw new Error('Vibe cannot represent MCP field ' + key);
      return { ...entry, name, transport: 'stdio' };
    },
  };

  readonly serializeSubAgent = (
    { metadata: processed, body }: SubAgentContent,
    assetName: string,
  ): string => {
    if (
      typeof processed.description !== 'string' ||
      !processed.description.trim()
    )
      throw new Error('A nonempty sub-agent description is required');
    if (path.basename(assetName) === 'main')
      throw new Error('Vibe reserves the agent name main');
    const { name, model, ...native } = processed;
    if (native.system_prompt_id !== undefined)
      throw new Error(
        'Use inline instructions for Vibe sub-agents; external prompt references are not installed automatically',
      );
    if (native.agent_type !== undefined && native.agent_type !== 'subagent')
      throw new Error('Vibe sub-agent must have agent_type = subagent');
    const allowed = new Set([
      'description',
      'display_name',
      'instructions',
      'agent_type',
      'active_model',
      'safety',
      'enabled_tools',
      'disabled_tools',
      'tools',
      'enabled_skills',
      'disabled_skills',
    ]);
    for (const key of Object.keys(native))
      if (!allowed.has(key))
        throw new Error(
          'Vibe sub-agent cannot represent field ' +
          key +
          '; use host-specific hints',
        );
    const result = {
      ...native,
      agent_type: 'subagent',
      display_name: native.display_name ?? name ?? path.basename(assetName),
      instructions: native.instructions ?? body,
    };
    if (typeof result.instructions !== 'string' || !result.instructions.trim())
      throw new Error('Vibe sub-agent instructions must be a nonempty string');
    return stringify(
      model === undefined ? result : { active_model: model, ...result },
    );
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.vibe/config.toml',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.vibe/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED(
      'Mistral Vibe does not support custom slash commands via files.',
    ),
    subAgent: {
      supported: true,
      installDir: '.vibe/agents/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, override } = userPaths(environment);
    const root = override('VIBE_HOME', at('.vibe'));
    return {
      mcp: mcp(path.join(root, 'config.toml'), 'mcp_servers'),
      prompt: prompt(path.join(root, 'AGENTS.md')),
      skill: skill(path.join(root, 'skills')),
      subAgent: file(path.join(root, 'agents'), '.toml'),
    };
  };
}
