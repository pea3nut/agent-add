import { z } from 'zod';
import type { HostId, McpServerInput } from './types.js';

export const text = z.string().optional();
export const flag = z.boolean().optional();
export const strings = z.array(z.string()).optional();
export const stringMap = z.record(z.string(), z.string()).optional();
export const seconds = z.number().nonnegative().lt(2 ** 64).optional();

export function rejectLegacySse(
  { url, transport }: McpServerInput,
  id: HostId,
): void {
  if (url !== undefined && transport === 'sse')
    throw new Error(id + ' does not support converting legacy SSE transport');
}

export function standardMcpServer(
  { source, command, url, env }: McpServerInput,
  id: HostId,
): Record<string, unknown> {
  if (Array.isArray(command))
    throw new Error(id + ' requires command to be a string');
  const entry = { ...source };
  if (source.serverUrl !== undefined) {
    entry.url = url;
    delete entry.serverUrl;
  }
  if (source.environment !== undefined) {
    entry.env = env;
    delete entry.environment;
  }
  return entry;
}

export function openCodeMcp(
  input: McpServerInput,
  id: HostId.OpenCode | HostId.KiloCode,
  extendedOAuth = false,
): Record<string, unknown> {
  rejectLegacySse(input, id);
  const { source, command, args, env, url } = input;
  const allowed = new Set([
    'type',
    'transport',
    'command',
    'args',
    'env',
    'environment',
    'url',
    'serverUrl',
    'headers',
    'enabled',
    'timeout',
    'oauth',
  ]);
  for (const key of Object.keys(source))
    if (!allowed.has(key))
      throw new Error(id + ' cannot represent MCP field ' + key);
  z.object({
    enabled: flag,
    timeout: z.number().int().positive().optional(),
    oauth: z.union([
      z.literal(false),
      z.strictObject({
        clientId: text,
        clientSecret: text,
        scope: text,
        ...(extendedOAuth ? {
          callbackPort: z.number().int().min(1).max(65535).optional(),
          redirectUri: text,
        } : {}),
      }),
    ]).optional(),
  }).parse(source);
  const remote = url !== undefined;
  if (remote && env !== undefined)
    throw new Error('Remote MCP does not support env');
  if (!remote && (source.headers !== undefined || source.oauth !== undefined))
    throw new Error('Local MCP does not support headers or OAuth');
  const entry: Record<string, unknown> = remote
    ? { type: 'remote', url }
    : {
      type: 'local',
      command: Array.isArray(command)
        ? command
        : [command, ...((args as string[]) ?? [])],
    };
  if (env !== undefined) entry.environment = env;
  for (const key of ['headers', 'enabled', 'timeout', 'oauth'])
    if (source[key] !== undefined) entry[key] = source[key];
  return entry;
}

export function geminiMcp(
  input: McpServerInput,
  id: HostId.Gemini | HostId.QwenCode,
): Record<string, unknown> {
  const { url, transport, nativeHttp } = input;
  const entry = standardMcpServer(input, id);
  delete entry.type;
  delete entry.transport;
  z.object({
    cwd: text,
    timeout: z.number().optional(),
    trust: flag,
    description: text,
    includeTools: strings,
    excludeTools: strings,
    oauth: z.object({
      enabled: flag,
      clientId: text,
      clientSecret: text,
      authorizationUrl: text,
      tokenUrl: text,
      redirectUri: text,
      tokenParamName: text,
      registrationUrl: text,
      issuer: text,
      scopes: strings,
      audiences: strings,
      authorizationResponseIssParameterSupported: flag,
      allowPrivateNetwork: flag,
    }).optional(),
  }).parse(entry);
  if (url !== undefined) {
    delete entry.type;
    delete entry.transport;
    delete entry.url;
    return {
      ...entry,
      [transport === 'http' || transport === 'remote' || nativeHttp ? 'httpUrl' : 'url']: url,
    };
  }
  return entry;
}
