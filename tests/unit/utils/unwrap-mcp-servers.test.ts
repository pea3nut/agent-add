import { describe, it, expect } from 'vitest';
import { unwrapMcpServers } from '../../../src/utils/unwrap-mcp-servers.js';

describe('unwrapMcpServers', () => {
  it('should return null for inner config format (no mcpServers key)', () => {
    const input = { command: 'npx', args: ['@playwright/mcp@latest'] };
    expect(unwrapMcpServers(input)).toBeNull();
  });

  it('should unwrap single server from mcpServers', () => {
    const input = {
      mcpServers: {
        playwright: { command: 'npx', args: ['@playwright/mcp@latest'] },
      },
    };
    const result = unwrapMcpServers(input);
    expect(result).toEqual({
      name: 'playwright',
      config: { command: 'npx', args: ['@playwright/mcp@latest'] },
    });
  });

  it('should throw for multiple servers in mcpServers', () => {
    const input = {
      mcpServers: {
        playwright: { command: 'npx', args: ['@playwright/mcp'] },
        filesystem: { command: 'npx', args: ['@anthropic/mcp-filesystem'] },
      },
    };
    expect(() => unwrapMcpServers(input)).toThrow(/exactly one server/);
  });

  it('should return null for empty mcpServers', () => {
    const input = { mcpServers: {} };
    expect(unwrapMcpServers(input)).toBeNull();
  });

  it('should return null when mcpServers is not an object', () => {
    expect(unwrapMcpServers({ mcpServers: 'string' })).toBeNull();
    expect(unwrapMcpServers({ mcpServers: null })).toBeNull();
    expect(unwrapMcpServers({ mcpServers: ['array'] })).toBeNull();
  });

  it('should throw when server config is not an object', () => {
    const input = { mcpServers: { playwright: 'not-an-object' } };
    expect(() => unwrapMcpServers(input)).toThrow(/must be a JSON object/);
  });
});
