/**
 * Detect if a parsed JSON object uses the wrapped mcpServers format
 * (e.g. {"mcpServers":{"playwright":{"command":"npx","args":[...]}}})
 * and extract the single inner server entry.
 *
 * Returns { name, config } if wrapped with exactly one server,
 * or null if not in wrapped format.
 */
export function unwrapMcpServers(
  parsed: Record<string, unknown>,
): { name: string; config: Record<string, unknown> } | null {
  if (!('mcpServers' in parsed)) return null;

  const mcpServers = parsed['mcpServers'];
  if (typeof mcpServers !== 'object' || mcpServers === null || Array.isArray(mcpServers)) {
    return null;
  }

  const entries = Object.entries(mcpServers as Record<string, unknown>);
  if (entries.length === 0) {
    return null;
  }
  if (entries.length > 1) {
    throw new Error(
      `Wrapped mcpServers format must contain exactly one server, found ${entries.length}`,
    );
  }

  const [name, config] = entries[0]!;
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new Error(`Server config for "${name}" must be a JSON object`);
  }

  return { name, config: config as Record<string, unknown> };
}
