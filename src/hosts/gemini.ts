import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class GeminiAdapter implements HostAdapter {
  readonly id = 'gemini';
  readonly displayName = 'Gemini CLI';
  readonly docs = 'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html';
  readonly detection = {
    paths: ['.gemini/'],
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
    skill: NOT_SUPPORTED('Gemini CLI does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Gemini CLI does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Gemini CLI does not support sub-agent configuration files.'),
  };
}
