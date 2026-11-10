# agent-add 1.3.1: concise installation example checks

Checked 2026-11-10T04:26:18.435Z. These are maintainer-run configuration checks on Windows (v24.22.1).

- **15/15 cases passed:** the revised examples for five projects, tested with Cursor, Codex, and Gemini CLI. Automated runs supplied `--host` to the interactive examples.
- Each case checks command, arguments, environment and working directory; preservation of an existing server and preference; an unchanged repeat; and refusal of conflicting content without modifying the configuration.
- **45 automated CLI invocations** used isolated temporary projects and a separate user profile. The shadcn/ui example was loaded from the exact documented public URL; the WinDbg example reuses the guide's existing Claude Desktop JSON.
- A separate **interactive PTY check** in PowerShell 7.6.9 displayed the client picker, selected Cursor and successfully wrote the expected Zotero configuration.
- The published `agent-add@1.3.1` tarball was run through its Node.js bin entry point. SHA-512 matched npm registry integrity: `sha512-eqOd0o5XbdKqYRJaQZetqqUMnh33yrkuSSRbIAjrHLEw6CUrcZpKfZoE+sDgFLO9nanoulSap/LX2MCy0Dm6Bw==`.
- No upstream MCP server, database, debugger, Canvas or Zotero session was launched. The npx bootstrap itself and host application connections were not tested. Upstream application test suites were not run for these documentation changes; Canvas's prescribed Python suite requires unavailable uv. All five patches passed `git diff --check`.

## Tested documentation

| Project | Revised example |
| --- | --- |
| designcomputer/mysql_mcp_server | [README.md](https://github.com/pea3nut/mysql_mcp_server/blob/cffd1c67889b6c24b4ff3af263910ccdfafa323d/README.md) |
| svnscha/mcp-windbg | [docs/reference/clients.md](https://github.com/pea3nut/mcp-windbg/blob/6550f6594201d285af4eb603989fe5f2ab07c16f/docs/reference/clients.md) |
| 54yyyu/zotero-mcp | [docs/getting-started.md](https://github.com/pea3nut/zotero-mcp/blob/fa35597d79e1e863366d9d1464da824007595426/docs/getting-started.md) |
| vishalsachdev/canvas-mcp | [README.md](https://github.com/pea3nut/canvas-mcp/blob/db9a8c5a92f5bbe59691714be6592bf7d8a5c16c/README.md) |
| Jpisnice/shadcn-ui-mcp-server | [README.md](https://github.com/pea3nut/shadcn-ui-mcp-server/blob/e13fdfe70b5602ffba3f8e8e9c9f88cc554736bc/README.md) |

[Raw results and sanitized output](./results.json) · [Check script](./verify-outreach.mjs). Document hashes use normalized LF line endings; the recorded checkout commit is the base before the documentation edit.

## Package evidence

- [npm provenance for 1.3.1](https://www.npmjs.com/package/agent-add/v/1.3.1#provenance) · [publishing workflow](https://github.com/pea3nut/agent-add/actions/runs/42591055819).
- [Socket Security report for 1.3.1](https://socket.dev/npm/package/agent-add/alerts/1.3.1), checked 2026-11-10: Copyleft License and Non-permissive License alerts for MPL-2.0; no malware alerts listed. Automated findings do not guarantee safety.
- npm's default tag resolved to 1.3.1 when checked. The documentation uses the default tag; the PR text offers to pin the installer to `agent-add@1.3.1` instead. Pinning chooses a particular release; `-y` still skips npx's installation confirmation.

## Reproduce

Clone the linked fork commits into sibling directories named `mysql_mcp_server`, `mcp-windbg`, `zotero-mcp`, `canvas-mcp-agent-add` and `shadcn-ui-mcp-server`. Save the check script in a sibling `verification/` directory. Extract the npm tarballs for `agent-add@1.3.1` into `verification/published-package/` (keep `agent-add-1.3.1.tgz`) and `smol-toml@1.4.2` into `verification/toml-parser/`, retaining each `package/` directory. Run `node verification/verify-outreach.mjs`. The script creates a fresh sandbox and writes `verification/results.json`; no service credentials are required.
