import os from 'os';
import path from 'path';
import type { AssetCapability, AssetType, HostAdapter, InstallScope } from './types.js';

interface UserEnvironment {
  home: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
}

const unsupported = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});
const skill = (installDir: string): AssetCapability => ({
  supported: true,
  installDir,
  entryFile: 'SKILL.md',
  writeStrategy: 'copy-file',
});
const file = (installDir: string, fileExtension = '.md'): AssetCapability => ({
  supported: true,
  installDir,
  fileExtension,
  writeStrategy: 'copy-file',
});
const prompt = (targetFile: string): AssetCapability => ({
  supported: true,
  targetFile,
  writeStrategy: 'append-with-marker',
});
const rules = (installDir: string): AssetCapability => ({
  supported: true,
  installDir,
  writeStrategy: 'create-file-in-dir',
});
const mcp = (configFile: string, configKey = 'mcpServers', jsonc = false): AssetCapability => ({
  supported: true,
  configFile,
  configKey,
  configFormat: jsonc ? 'jsonc' : 'json',
  writeStrategy: 'inject-json-key',
});

function userAssets(id: string, { home, env, platform }: UserEnvironment): Partial<Record<AssetType, AssetCapability>> {
  const at = (...parts: string[]) => path.join(home, ...parts);
  const override = (name: string, fallback: string): string => {
    const value = env[name];
    if (!value) return fallback;
    if (!path.isAbsolute(value)) throw new Error(name + ' must be an absolute path for user installation');
    return path.normalize(value);
  };
  const custom = (names: string[]) => names.find((name) => env[name]);
  const reject = (name: string) => unsupported('User installation with ' + name + ' is not supported; no default destination was used.');
  let assets: Partial<Record<AssetType, AssetCapability>> = {};
  switch (id) {
    case 'cursor':
      assets = {
        mcp: mcp(at('.cursor/mcp.json'), 'mcpServers', true),
        skill: skill(at('.cursor/skills')),
        subAgent: file(at('.cursor/agents')),
      };
      break;
    case 'claude-code': {
      const root = override('CLAUDE_CONFIG_DIR', at('.claude'));
      assets = {
        mcp: env.CLAUDE_CONFIG_DIR ? reject('CLAUDE_CONFIG_DIR for MCP') : mcp(at('.claude.json')),
        prompt: prompt(path.join(root, 'CLAUDE.md')),
        skill: skill(path.join(root, 'skills')),
        command: file(path.join(root, 'commands')),
        subAgent: file(path.join(root, 'agents')),
      };
      break;
    }
    case 'github-copilot':
      assets = env.COPILOT_HOME
        ? {
          skill: reject('COPILOT_HOME'),
          subAgent: reject('COPILOT_HOME'),
        }
        : {
          skill: skill(at('.copilot/skills')),
          subAgent: file(at('.copilot/agents'), '.agent.md'),
        };
      break;
    case 'gemini': {
      const root = path.join(override('GEMINI_CLI_HOME', home), '.gemini');
      assets = {
        mcp: mcp(path.join(root, 'settings.json'), 'mcpServers', true),
        prompt: prompt(path.join(root, 'GEMINI.md')),
        skill: skill(path.join(root, 'skills')),
        command: file(path.join(root, 'commands'), '.toml'),
        subAgent: file(path.join(root, 'agents')),
      };
      break;
    }
    case 'kilo-code':
      assets = {
        mcp: {
          ...mcp(at('.config/kilo/kilo.jsonc'), 'mcp', true),
          configFileAlternatives: [at('.config/kilo/kilo.json')],
        },
        skill: skill(at('.kilo/skills')),
        command: file(at('.config/kilo/commands')),
        subAgent: file(at('.config/kilo/agents')),
      };
      break;
    case 'qwen-code':
      assets = {
        mcp: mcp(at('.qwen/settings.json'), 'mcpServers', true),
        skill: skill(at('.qwen/skills')),
        command: file(at('.qwen/commands')),
        subAgent: file(at('.qwen/agents')),
      };
      break;
    case 'opencode': {
      const name = custom(['OPENCODE_CONFIG', 'OPENCODE_CONFIG_DIR', 'OPENCODE_CONFIG_CONTENT']);
      if (name) return Object.fromEntries(['mcp', 'prompt', 'skill', 'command', 'subAgent'].map((type) => [type, reject(name)]));
      assets = {
        mcp: {
          ...mcp(at('.config/opencode/opencode.json'), 'mcp', true),
          configFileAlternatives: [at('.config/opencode/opencode.jsonc')],
        },
        prompt: prompt(at('.config/opencode/AGENTS.md')),
        skill: skill(at('.config/opencode/skills')),
        command: file(at('.config/opencode/commands')),
        subAgent: file(at('.config/opencode/agents')),
      };
      break;
    }
    case 'augment':
      assets = {
        mcp: mcp(at('.augment/settings.json'), 'mcpServers', true),
        prompt: rules(at('.augment/rules')),
        skill: skill(at('.augment/skills')),
        command: file(at('.augment/commands')),
        subAgent: file(at('.augment/agents')),
      };
      break;
    case 'windsurf':
      assets = { command: file(at('.codeium/windsurf/global_workflows')) };
      break;
    case 'roo-code':
      assets = {
        prompt: rules(at('.roo/rules')),
        skill: skill(at('.roo/skills')),
        command: file(at('.roo/commands')),
      };
      break;
    case 'kiro':
      assets = {
        mcp: mcp(at('.kiro/settings/mcp.json')),
        prompt: rules(at('.kiro/steering')),
        skill: skill(at('.kiro/skills')),
        subAgent: file(at('.kiro/agents')),
      };
      break;
    case 'codex': {
      const root = override('CODEX_HOME', at('.codex'));
      assets = {
        mcp: mcp(path.join(root, 'config.toml'), 'mcp_servers'),
        prompt: prompt(path.join(root, 'AGENTS.md')),
        skill: skill(at('.agents/skills')),
        subAgent: file(path.join(root, 'agents'), '.toml'),
      };
      break;
    }
    case 'tabnine':
      assets = {
        mcp: mcp(at('.tabnine/mcp_servers.json')),
        command: file(at('.tabnine/agent/commands'), '.toml'),
      };
      break;
    case 'kimi':
      assets = {
        mcp: env.KIMI_SHARE_DIR ? reject('KIMI_SHARE_DIR for MCP') : mcp(at('.kimi/mcp.json')),
        skill: skill(at('.kimi/skills')),
      };
      break;
    case 'trae':
      assets = { skill: skill(at('.trae/skills')) };
      break;
    case 'openclaw': {
      const name = env.OPENCLAW_PROFILE && env.OPENCLAW_PROFILE !== 'default' ? 'OPENCLAW_PROFILE' : custom(['OPENCLAW_HOME']);
      assets = { skill: name ? reject(name) : skill(path.join(override('OPENCLAW_STATE_DIR', at('.openclaw')), 'skills')) };
      break;
    }
    case 'vibe': {
      const root = override('VIBE_HOME', at('.vibe'));
      assets = {
        mcp: mcp(path.join(root, 'config.toml'), 'mcp_servers'),
        prompt: prompt(path.join(root, 'AGENTS.md')),
        skill: skill(path.join(root, 'skills')),
        subAgent: file(path.join(root, 'agents'), '.toml'),
      };
      break;
    }
    case 'claude-desktop':
      assets = { mcp: platform === 'darwin' ? mcp(at('Library/Application Support/Claude/claude_desktop_config.json')) : platform === 'win32' && env.APPDATA ? mcp(path.join(override('APPDATA', ''), 'Claude/claude_desktop_config.json')) : unsupported('Claude Desktop user MCP requires macOS or Windows with APPDATA; no verified target exists for this platform.') };
      break;
    case 'cline': {
      const root = override('CLINE_DIR', at('.cline'));
      const data = override('CLINE_DATA_DIR', path.join(root, 'data'));
      assets = {
        mcp: mcp(override('CLINE_MCP_SETTINGS_PATH', path.join(data, 'settings/cline_mcp_settings.json'))),
        prompt: rules(path.join(root, 'rules')),
        skill: skill(path.join(root, 'skills')),
      };
      break;
    }
    case 'amp':
      assets = {
        mcp: {
          ...mcp(at('.config/amp/settings.json'), 'amp.mcpServers', true),
          configFileAlternatives: [at('.config/amp/settings.jsonc')],
        },
        prompt: prompt(at('.config/amp/AGENTS.md')),
        skill: skill(at('.config/amp/skills')),
      };
      break;
    case 'zed':
      assets = {
        prompt: platform === 'win32' ? unsupported('No Windows user instruction path is selected for Zed.') : prompt(at('.config/zed/AGENTS.md')),
        skill: skill(at('.agents/skills')),
      };
      break;
    case 'goose':
      assets = {
        prompt: platform === 'win32' ? unsupported('No Windows user hints path is selected for goose.') : prompt(at('.config/goose/.goosehints')),
        skill: skill(at('.agents/skills')),
      };
      break;
  }
  if (env.XDG_CONFIG_HOME) {
    const root = at('.config') + path.sep;
    for (const [type, capability] of Object.entries(assets))
      if ([capability.configFile, capability.targetFile, capability.installDir].some((target) => target?.startsWith(root)))
        assets[type as AssetType] = reject('XDG_CONFIG_HOME');
  }
  return assets;
}

export function selectHostScope(
  host: HostAdapter,
  scope: InstallScope,
  cwd: string,
  environment: UserEnvironment = {
    home: os.homedir(),
    env: process.env,
    platform: process.platform,
  },
): HostAdapter {
  const selected = scope === 'user' ? userAssets(host.id, environment) : host.assets;
  const assets = {} as Record<AssetType, AssetCapability>;
  for (const type of ['mcp', 'skill', 'prompt', 'command', 'subAgent'] as const) {
    const capability = { ...(selected[type] ?? unsupported('No verified user-level ' + type + ' installation target is selected for ' + host.displayName + '.')) };
    for (const key of ['configFile', 'installDir', 'targetFile'] as const)
      if (capability[key]) capability[key] = path.resolve(cwd, capability[key]);
    if (capability.configFileAlternatives)
      capability.configFileAlternatives = capability.configFileAlternatives.map((file) => path.resolve(cwd, file));
    assets[type] = capability;
  }
  return {
    ...host,
    assets,
    scope,
    rootDir: path.resolve(cwd),
  };
}
