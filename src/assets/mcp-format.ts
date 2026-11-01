import { assertSafeConfigKey, isRecord } from '../utils/config.js';
import type { InstallJob } from './types.js';

export function convertMcpServer(
  job: InstallJob,
  source: Record<string, unknown>,
  name: string,
): Record<string, unknown> {
  assertSafeConfigKey(name);
  const format =
    job.host.assets.mcp.mcpFormat ??
    (['opencode', 'kilo-code'].includes(job.host.id)
      ? 'opencode'
      : job.host.id === 'github-copilot'
        ? 'vscode'
        : job.host.id === 'codex'
          ? 'codex'
          : job.host.id === 'vibe'
            ? 'vibe'
            : 'standard');
  const command = source.command;
  const args = source.args;
  const env = source.env ?? source.environment;
  const url = source.url ?? source.serverUrl;
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
  if (
    url !== undefined &&
    (typeof url !== 'string' || !/^https?:\/\//.test(url))
  )
    throw new Error('MCP URL must be an HTTP(S) URL');
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
  const transport = source.type ?? source.transport;
  const remoteTypes = [
    'http',
    'sse',
    'streamable-http',
    'streamableHttp',
    'streamable_http',
    'remote',
  ];
  if (
    transport !== undefined &&
    (typeof transport !== 'string' ||
      !(url === undefined ? ['stdio', 'local'] : remoteTypes).includes(
        transport,
      ))
  )
    throw new Error('MCP transport does not match its command or URL');
  if (url !== undefined && args !== undefined)
    throw new Error('Remote MCP cannot use stdio args');
  if (command !== undefined && source.headers !== undefined)
    throw new Error('Stdio MCP cannot use HTTP headers');
  if (
    url !== undefined &&
    transport === 'sse' &&
    ['codex', 'opencode', 'goose', 'zed'].includes(format)
  )
    throw new Error(
      job.host.id + ' does not support converting legacy SSE transport',
    );
  if (format === 'goose' || format === 'zed') {
    const allowed = new Set([
      'command',
      'args',
      'env',
      'environment',
      'url',
      'serverUrl',
      'headers',
      'type',
      'transport',
      ...(format === 'goose' ? ['enabled', 'timeout'] : []),
    ]);
    for (const key of Object.keys(source))
      if (!allowed.has(key))
        throw new Error(job.host.id + ' cannot represent MCP field ' + key);
    if (Array.isArray(command))
      throw new Error(job.host.id + ' requires command to be a string');
    if (url !== undefined && env !== undefined)
      throw new Error(
        'Remote MCP does not support process environment variables',
      );
    if (format === 'zed')
      return url === undefined
        ? {
            command,
            ...(args === undefined ? {} : { args }),
            ...(env === undefined ? {} : { env }),
          }
        : {
            url,
            ...(source.headers === undefined
              ? {}
              : { headers: source.headers }),
          };
    return {
      name,
      enabled: source.enabled ?? true,
      timeout: source.timeout ?? 300,
      ...(url === undefined
        ? { type: 'stdio', cmd: command, args: args ?? [], envs: env ?? {} }
        : {
            type: 'streamable_http',
            uri: url,
            ...(source.headers === undefined
              ? {}
              : { headers: source.headers }),
          }),
    };
  }
  if (format === 'opencode') {
    const allowed = new Set([
      'type',
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
      if (entry.transport !== undefined && entry.transport !== 'stdio')
        throw new Error('Vibe command MCP requires stdio transport');
      return { ...entry, name, transport: 'stdio' };
    }
    if (source.headers !== undefined) {
      if (source.http_headers !== undefined)
        throw new Error('Use either headers or http_headers, not both');
      entry.http_headers = source.headers;
      delete entry.headers;
    }
    const allowed = new Set([
      'command',
      'args',
      'env',
      'cwd',
      'env_vars',
      'url',
      'http_headers',
      'env_http_headers',
      'bearer_token_env_var',
      'startup_timeout_sec',
      'tool_timeout_sec',
      'enabled',
      'required',
      'enabled_tools',
      'disabled_tools',
      'tools',
      'experimental_environment',
    ]);
    for (const key of Object.keys(entry))
      if (!allowed.has(key))
        throw new Error('Codex cannot represent MCP field ' + key);
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
  if (format === 'vscode')
    return {
      ...entry,
      type:
        url !== undefined ? (transport === 'sse' ? 'sse' : 'http') : 'stdio',
    };
  if (format === 'cline' && url !== undefined)
    return { ...entry, type: transport === 'sse' ? 'sse' : 'streamableHttp' };
  if (job.host.id === 'claude-code' && url !== undefined) {
    delete entry.transport;
    return { ...entry, type: transport === 'sse' ? 'sse' : 'http' };
  }
  return entry;
}
