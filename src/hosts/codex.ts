import { editTomlMcpConfig } from './mcp-config.js';
import { readTextOrNull } from '../utils/config.js';
import { stringify } from 'smol-toml';
import { z } from 'zod';
import {
  flag, text, strings, stringMap, seconds,
  standardMcpServer, rejectLegacySse,
} from './mcp.js';
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
import { codexCommandToSkill } from './codex-command.js';

export class CodexAdapter implements HostAdapter {
  readonly id = HostId.Codex;
  readonly selectionPriority = 6;
  readonly displayName = 'Codex CLI';
  readonly detection = {
    paths: ['.codex/'],
  };
  readonly commandToSkill = codexCommandToSkill;
  readonly mcp: McpAdapter = {
    editConfig: (current, file, name, server, overwrite) =>
      editTomlMcpConfig(current, file, name, server, 'table', this.displayName, overwrite),
    convert: (input) => {
      rejectLegacySse(input, this.id);
      const { source, command, url } = input;
      const entry = standardMcpServer(input, this.id);
      delete entry.type;
      delete entry.transport;
      if (source.headers !== undefined) {
        if (source.http_headers !== undefined)
          throw new Error('Use either headers or http_headers, not both');
        entry.http_headers = source.headers;
        delete entry.headers;
      }
      z.strictObject({
        command: text,
        args: strings,
        env: stringMap,
        cwd: text,
        env_vars: z.array(z.union([
          z.string(),
          z.strictObject({ name: z.string(), source: text }),
        ])).optional(),
        url: text,
        http_headers: stringMap,
        env_http_headers: stringMap,
        bearer_token_env_var: text,
        startup_timeout_sec: seconds,
        tool_timeout_sec: seconds,
        enabled: flag,
        required: flag,
        enabled_tools: strings,
        disabled_tools: strings,
        tools: z.record(z.string(), z.strictObject({
          approval_mode: z.enum(['auto', 'prompt', 'writes', 'approve']).optional(),
          output_token_limit: z.number().int().positive().optional(),
        })).optional(),
      }).parse(entry);
      if (
        url !== undefined &&
        ['args', 'env', 'cwd', 'env_vars'].some((key) => entry[key] !== undefined)
      )
        throw new Error('Codex HTTP MCP cannot use stdio-only fields');
      if (
        command !== undefined &&
        ['http_headers', 'env_http_headers', 'bearer_token_env_var'].some(
          (key) => entry[key] !== undefined,
        )
      )
        throw new Error('Codex stdio MCP cannot use HTTP-only fields');
      return entry;
    },
  };

  readonly serializeSubAgent = (
    { metadata: processed, body }: SubAgentContent,
    name: string,
  ): string => {
    if (
      typeof processed.description !== 'string' ||
      !processed.description.trim()
    )
      throw new Error('A nonempty sub-agent description is required');
    const { readonly: readOnly, model, ...native } = processed;
    if (readOnly !== undefined && typeof readOnly !== 'boolean')
      throw new Error('Codex sub-agent readonly must be a boolean');
    const allowed = new Set([
      'name',
      'description',
      'developer_instructions',
      'model_provider',
      'model_reasoning_effort',
      'sandbox_mode',
      'mcp_servers',
      'skills',
      'nickname_candidates',
    ]);
    for (const key of Object.keys(native))
      if (!allowed.has(key))
        throw new Error(
          'Codex sub-agent cannot represent field ' +
          key +
          '; use host-specific hints',
        );
    const result: Record<string, unknown> = {
      ...native,
      name: native.name ?? path.basename(name),
      developer_instructions: native.developer_instructions ?? body,
    };
    // Codex inherits the selected/default model when no override is present.
    if (model !== undefined && model !== 'inherit') result.model = model;
    for (const key of [
      'name',
      'description',
      'developer_instructions',
    ] as const)
      if (typeof result[key] !== 'string' || !result[key].trim())
        throw new Error('Codex requires nonempty ' + key);
    // Custom agents inherit sandbox permissions from the parent session.
    // Preserve read-only intent as instructions, not an ineffective sandbox override.
    if (readOnly)
      result.developer_instructions +=
        '\n\nRead-only agent: Do not create, edit, delete, or otherwise modify files.';
    return stringify(result);
  };

  readonly resolvePromptTarget = async (host: HostAdapter): Promise<string> => {
    if (host.scope === 'user') {
      const override = path.join(path.dirname(host.assets.prompt.targetFile!), 'AGENTS.override.md');
      if ((await readTextOrNull(override))?.trim()) return override;
    }
    return path.resolve(host.assets.prompt.targetFile!);
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.codex/config.toml',
      configKey: 'mcp_servers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.agents/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: skill('.agents/skills/'),
    subAgent: {
      supported: true,
      installDir: '.codex/agents/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, override } = userPaths(environment);
    const root = override('CODEX_HOME', at('.codex'));
    return {
      mcp: mcp(path.join(root, 'config.toml'), 'mcp_servers'),
      prompt: prompt(path.join(root, 'AGENTS.md')),
      skill: skill(at('.agents/skills')),
      command: skill(at('.agents/skills')),
      subAgent: file(path.join(root, 'agents'), '.toml'),
    };
  };
}
