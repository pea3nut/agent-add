import { readTextOrNull, isRecord, parseConfig } from '../utils/config.js';
import { geminiMcp } from './mcp.js';
import path from 'path';
import {
  HostId,
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

export class GeminiAdapter implements HostAdapter {
  readonly id = HostId.Gemini;
  readonly displayName = 'Gemini CLI';
  readonly detection = {
    paths: ['.gemini/'],
  };
  readonly mcp: McpAdapter = {
    interpolateEnvironment: true,
    convert: (input) => geminiMcp(input, this.id),
  };

  readonly resolvePromptTarget = async (host: HostAdapter): Promise<string> => {
    const cwd = host.rootDir ?? process.cwd();
    const root = host.scope === 'user' ? path.dirname(host.assets.prompt.targetFile!) : cwd;
    const content = await readTextOrNull(host.assets.mcp.configFile!);
    const config = content === null ? {} : parseConfig(content, 'jsonc');
    const context = config.context;
    const name = isRecord(context) ? context.fileName : undefined;
    if (name !== undefined) {
      const names = Array.isArray(name) ? name : [name];
      if (
        !names.length ||
        names.some((v) => typeof v !== 'string' || !v.trim())
      )
        throw new Error(
          'Gemini context.fileName must be a nonempty filename or filename array',
        );
      const target = path.resolve(root, names[0] as string);
      const relative = path.relative(root, target);
      if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
        throw new Error('Gemini context.fileName must stay inside the ' + (host.scope === 'user' ? 'user configuration root' : 'project'));
      return target;
    }
    return path.resolve(host.assets.prompt.targetFile!);
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.gemini/settings.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'GEMINI.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.gemini/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.gemini/commands/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.gemini/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { home } = environment;
    const { override } = userPaths(environment);
    const root = path.join(override('GEMINI_CLI_HOME', home), '.gemini');
    return {
      mcp: mcp(path.join(root, 'settings.json'), 'mcpServers', true),
      prompt: prompt(path.join(root, 'GEMINI.md')),
      skill: skill(path.join(root, 'skills')),
      command: file(path.join(root, 'commands'), '.toml'),
      subAgent: file(path.join(root, 'agents')),
    };
  };
}
