/**
 * Extract one server from an mcpServers wrapper or a flat name/config map.
 *
 * Returns { name, config } if wrapped with exactly one server,
 * or null if not in wrapped format.
 */
export function unwrapMcpServers(
  parsed: Record<string, unknown>,
): { name: string; config: Record<string, unknown> } | null {
  const wrapped = Object.hasOwn(parsed, 'mcpServers');
  const mcpServers = wrapped ? parsed['mcpServers'] : parsed;
  if (
    typeof mcpServers !== 'object' ||
    mcpServers === null ||
    Array.isArray(mcpServers)
  ) {
    return null;
  }

  const entries = Object.entries(mcpServers as Record<string, unknown>);
  if (entries.length === 0) {
    return null;
  }
  if (entries.length > 1) {
    if (!wrapped) return null;
    throw new Error(
      `Wrapped mcpServers format must contain exactly one server, found ${entries.length}`,
    );
  }

  const [name, config] = entries[0]!;
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    if (!wrapped) return null;
    throw new Error(`Server config for "${name}" must be a JSON object`);
  }
  if (!name.trim()) throw new Error('MCP server name must not be empty');
  return { name, config: config as Record<string, unknown> };
}
