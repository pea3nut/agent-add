import { assertSafeConfigKey, isRecord } from '../utils/config.js';
import { standardMcpServer } from './mcp.js';
import type { HostAdapter } from './types.js';

export function convertMcpServer(
  host: HostAdapter,
  source: Record<string, unknown>,
  name: string,
): Record<string, unknown> {
  assertSafeConfigKey(name);
  host.mcp?.validateSource?.(source);
  const nativeHttp = source.httpUrl !== undefined;
  if (nativeHttp) {
    if (source.url !== undefined || source.serverUrl !== undefined)
      throw new Error(
        'Use either httpUrl, url or serverUrl, not multiple endpoints',
      );
    source = { ...source, url: source.httpUrl };
    delete source.httpUrl;
  }
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
        /[\s\\]/.test(url)
      )
        throw new Error();
      const validationUrl = host.mcp?.normalizeUrl?.(url) ?? url;
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
  const input = { source, command, args, env, url, transport, nativeHttp };
  return host.mcp
    ? host.mcp.convert(input, name)
    : standardMcpServer(input, host.id);
}
