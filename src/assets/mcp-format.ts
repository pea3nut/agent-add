import { assertSafeConfigKey, isRecord } from '../utils/config.js';
import { z } from 'zod';
import type { InstallJob } from './types.js';

const text = z.string().optional();
const flag = z.boolean().optional();
const strings = z.array(z.string()).optional();
const stringMap = z.record(z.string(), z.string()).optional();
const seconds = z.number().nonnegative().lt(2 ** 64).optional();

export function convertMcpServer(
  job: InstallJob,
  source: Record<string, unknown>,
  name: string,
): Record<string, unknown> {
  assertSafeConfigKey(name);
  const nativeHttp = source.httpUrl !== undefined;
  if (nativeHttp) {
    if (source.url !== undefined || source.serverUrl !== undefined)
      throw new Error(
        'Use either httpUrl, url or serverUrl, not multiple endpoints',
      );
    source = { ...source, url: source.httpUrl };
    delete source.httpUrl;
  }
  const format = ['opencode', 'kilo-code'].includes(job.host.id)
    ? 'opencode'
    : job.host.id === 'github-copilot' ? 'vscode' : job.host.id;
  const command = source.command;
  const args = source.args;
  const env = source.env !== undefined ? source.env : source.environment;
  const url = source.url !== undefined ? source.url : source.serverUrl;
  if (source.env !== undefined && source.environment !== undefined)
    throw new Error('Use either env or environment, not both');
  if (source.url !== undefined && source.serverUrl !== undefined)
    throw new Error('Use either url or serverUrl, not both');
  if (command !== undefined && url !== undefined)
    throw new Error('MCP source must not mix command and URL transports');
  if (command === undefined && url === undefined)
    throw new Error('MCP source requires a command or URL');
  if (
    command !== undefined &&
    typeof command !== 'string' &&
    !(
      Array.isArray(command) &&
      command.length &&
      command.every((v) => typeof v === 'string')
    )
  )
    throw new Error(
      'MCP command must be a string or executable/argument array',
    );
  if (
    (typeof command === 'string' && !command.trim()) ||
    (Array.isArray(command) && !command[0].trim())
  )
    throw new Error('MCP command must not be empty');
  if (
    args !== undefined &&
    (!Array.isArray(args) || args.some((v) => typeof v !== 'string'))
  )
    throw new Error('MCP args must be an array of strings');
  if (Array.isArray(command) && args !== undefined)
    throw new Error('Use either a command array or command/args, not both');
  if (url !== undefined) {
    try {
      if (
        typeof url !== 'string' ||
        !/^https?:\/\/[^/?#\s\\]/i.test(url) ||
        /[\r\n\t]/.test(url)
      )
        throw new Error();
      const validationUrl = ['gemini', 'qwen-code'].includes(job.host.id)
        ? url.replace(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g, '1')
        : url;
      const parsed = new URL(validationUrl);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname)
        throw new Error();
    } catch {
      throw new Error(
        'MCP URL must be an HTTP(S) URL with a valid hostname and port',
      );
    }
  }
  for (const [label, value] of [
    ['environment', env],
    ['headers', source.headers],
  ] as const) {
    if (
      value !== undefined &&
      (!isRecord(value) ||
        Object.values(value).some((v) => typeof v !== 'string'))
    )
      throw new Error('MCP ' + label + ' must contain string values');
  }
  const normalizeTransport = (value: unknown): unknown =>
    ['http', 'streamable-http', 'streamableHttp', 'streamable_http'].includes(
      value as string,
    )
      ? 'http'
      : value === 'local'
        ? 'stdio'
        : value;
  const type = normalizeTransport(source.type);
  const alias = normalizeTransport(source.transport);
  if (type !== undefined && alias !== undefined && type !== alias)
    throw new Error('MCP type and transport must agree');
  const transport =
    type !== undefined
      ? type
      : alias !== undefined
        ? alias
        : nativeHttp
          ? 'http'
          : undefined;
  const remoteTypes = ['http', 'sse', 'remote'];
  if (
    transport !== undefined &&
    (typeof transport !== 'string' ||
      !(url === undefined ? ['stdio'] : remoteTypes).includes(
        transport,
      ))
  )
    throw new Error('MCP transport does not match its command or URL');
  if (nativeHttp && transport === 'sse')
    throw new Error('httpUrl requires Streamable HTTP, not SSE');
  if (url !== undefined && args !== undefined)
    throw new Error('Remote MCP cannot use stdio args');
  if (command !== undefined && source.headers !== undefined)
    throw new Error('Stdio MCP cannot use HTTP headers');
  if (
    url !== undefined &&
    transport === 'sse' &&
    ['codex', 'opencode'].includes(format)
  )
    throw new Error(
      job.host.id + ' does not support converting legacy SSE transport',
    );
  if (format === 'opencode') {
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
        throw new Error(job.host.id + ' cannot represent MCP field ' + key);
    z.object({
      enabled: flag,
      timeout: z.number().int().positive().optional(),
      oauth: z.union([
        z.literal(false),
        z.strictObject({
          clientId: text,
          clientSecret: text,
          scope: text,
          ...(job.host.id === 'opencode' ? {
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
  if (format === 'codex' || format === 'vibe') {
    if (Array.isArray(command))
      throw new Error(job.host.id + ' requires command to be a string');
    const entry = { ...source };
    delete entry.type;
    delete entry.transport;
    if (source.serverUrl !== undefined) {
      entry.url = source.serverUrl;
      delete entry.serverUrl;
    }
    if (source.environment !== undefined) {
      entry.env = source.environment;
      delete entry.environment;
    }
    if (format === 'vibe') {
      if (url !== undefined)
        throw new Error(
          'Remote Vibe MCP transport is not implemented; refusing to drop its URL',
        );
      const allowed = new Set(['command', 'args', 'env', 'transport', 'name']);
      for (const key of Object.keys(entry))
        if (!allowed.has(key))
          throw new Error('Vibe cannot represent MCP field ' + key);
      return { ...entry, name, transport: 'stdio' };
    }
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
  }
  if (Array.isArray(command))
    throw new Error(job.host.id + ' requires command to be a string');
  const entry = { ...source };
  if (source.serverUrl !== undefined) {
    entry.url = url;
    delete entry.serverUrl;
  }
  if (source.environment !== undefined) {
    entry.env = env;
    delete entry.environment;
  }
  if (['gemini', 'qwen-code'].includes(job.host.id)) {
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
  }
  if (['roo-code', 'kiro'].includes(job.host.id)) {
    z.object({
      disabled: flag,
      disabledTools: strings,
      ...(job.host.id === 'kiro' ? { autoApprove: strings } : {
        cwd: text,
        alwaysAllow: strings,
        watchPaths: strings,
        timeout: z.number().min(1).max(3600).optional(),
      }),
    }).parse(entry);
    if (job.host.id === 'roo-code') {
      delete entry.transport;
      if (url !== undefined)
        entry.type = transport === 'sse' ? 'sse' : 'streamable-http';
      else if (source.type !== undefined || source.transport !== undefined)
        entry.type = 'stdio';
    }
  }
  if (['gemini', 'qwen-code'].includes(job.host.id) && url !== undefined) {
    delete entry.type;
    delete entry.transport;
    delete entry.url;
    return {
      ...entry,
      [transport === 'http' || transport === 'remote' || nativeHttp ? 'httpUrl' : 'url']: url,
    };
  }
  if (format === 'vscode') {
    delete entry.transport;
    return {
      ...entry,
      type:
        url !== undefined ? (transport === 'sse' ? 'sse' : 'http') : 'stdio',
    };
  }
  if (job.host.id === 'claude-code' && url !== undefined) {
    delete entry.transport;
    return { ...entry, type: transport === 'sse' ? 'sse' : 'http' };
  }
  return entry;
}
