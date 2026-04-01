import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class WindsurfAdapter implements HostAdapter {
  readonly id = 'windsurf';
  readonly displayName = 'Windsurf';
  readonly docs = 'https://docs.windsurf.com/windsurf/cascade/mcp';
  readonly detection = {
    paths: ['~/.codeium/windsurf/', '.windsurf/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/.codeium/windsurf/mcp_config.json',
        linux: '~/.codeium/windsurf/mcp_config.json',
        win32: '%APPDATA%\\Codeium\\windsurf\\mcp_config.json',
      },
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.windsurf/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.windsurf/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.windsurf/workflows/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: NOT_SUPPORTED('Windsurf does not have a sub-agent file format.'),
  };
}
