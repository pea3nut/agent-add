# agent-add 1.3.1: concise installation example checks

Checked 2026-11-10T04:26:18.435Z. These are maintainer-run configuration checks on Windows (v24.22.1).

- **15/15 cases passed:** the revised examples for five projects, tested with Cursor, Codex, and Gemini CLI in user scope (`--global`). Automated runs supplied `--host` to the interactive examples.
- Each case checks command, arguments, environment and working directory; preservation of an existing server and preference; an unchanged repeat; and refusal of conflicting content without modifying the configuration.
- **45 automated CLI invocations** used isolated temporary projects and a separate user profile. The shadcn/ui example was loaded from the exact documented public URL; the WinDbg example reuses the guide's existing Claude Desktop JSON.
- A separate **interactive PTY check** (project scope) in PowerShell 7.6.9 displayed the client picker, selected Cursor and successfully wrote the expected Zotero configuration.
- The published `agent-add@1.3.1` tarball was run through its Node.js bin entry point. SHA-512 matched npm registry integrity: `sha512-eqOd0o5XbdKqYRJaQZetqqUMnh33yrkuSSRbIAjrHLEw6CUrcZpKfZoE+sDgFLO9nanoulSap/LX2MCy0Dm6Bw==`.
- No upstream MCP server, database, debugger, Canvas or Zotero session was launched. The npx bootstrap itself and host application connections were not tested. Upstream application test suites were not run for these documentation changes; Canvas's prescribed Python suite requires unavailable uv. All five patches passed `git diff --check`.

## Tested documentation

| Project | Revised example |
| --- | --- |
| designcomputer/mysql_mcp_server | [README.md](https://github.com/pea3nut/mysql_mcp_server/blob/6e5aabf0f65ebe27400ba88e24d6c1d146b51dd5/README.md) |
| svnscha/mcp-windbg | [docs/reference/clients.md](https://github.com/pea3nut/mcp-windbg/blob/29dc4d37ad01f74024c727b93002111d7909864a/docs/reference/clients.md) |
| 54yyyu/zotero-mcp | [docs/getting-started.md](https://github.com/pea3nut/zotero-mcp/blob/99853440b1338d0569aa79ef6ae1f5ba5e27510a/docs/getting-started.md) |
| vishalsachdev/canvas-mcp | [README.md](https://github.com/pea3nut/canvas-mcp/blob/71c19471d0a7d0b0893ce85e9598d8d67bd1aeb8/README.md) |
| Jpisnice/shadcn-ui-mcp-server | [README.md](https://github.com/pea3nut/shadcn-ui-mcp-server/blob/7a90b55e000bea4e35e3b0a22f7e0efbf66b278d/README.md) |

[Raw results and sanitized output](./results.json) · [Check script](./verify-outreach.mjs). Document hashes use normalized LF line endings; the recorded checkout commit is the base before the documentation edit.

## Package evidence

- [npm provenance for 1.3.1](https://www.npmjs.com/package/agent-add/v/1.3.1#provenance) · [publishing workflow](https://github.com/pea3nut/agent-add/actions/runs/42591055819).
- [Socket Security report for 1.3.1](https://socket.dev/npm/package/agent-add/alerts/1.3.1), checked 2026-11-10: Copyleft License and Non-permissive License alerts for MPL-2.0; no malware alerts listed. Automated findings do not guarantee safety.
- npm's default tag resolved to 1.3.1 when checked. The documentation uses the default tag; the PR text offers to pin the installer to `agent-add@1.3.1` instead. Pinning chooses a particular release; `-y` still skips npx's installation confirmation.

## Reproduce

Clone the linked fork commits into sibling directories named `mysql_mcp_server`, `mcp-windbg`, `zotero-mcp`, `canvas-mcp-agent-add` and `shadcn-ui-mcp-server`. Save the check script in a sibling `verification/` directory. Extract the npm tarballs for `agent-add@1.3.1` into `verification/published-package/` (keep `agent-add-1.3.1.tgz`) and `smol-toml@1.4.2` into `verification/toml-parser/`, retaining each `package/` directory. Run `node verification/verify-outreach.mjs`. The script creates a fresh sandbox and writes `verification/results.json`; no service credentials are required.
