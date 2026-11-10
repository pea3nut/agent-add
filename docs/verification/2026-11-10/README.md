# agent-add 1.3.1: MCP registration checks

Checked 2026-11-10T04:05:48.073Z on Windows (v24.22.1). These are maintainer-run checks of configuration generation, not a third-party security certification.

- **15/15 project registration cases passed:** five repository examples × Cursor, Codex, and Gemini CLI.
- Each case checks exact command, arguments, environment, and working directory; preserves an existing server and client preference; repeats without changing the file; and refuses conflicting content without changing the file.
- **4/4 WinDbg Cursor skills passed:** source files copied byte for byte, then installed again. Mixed MCP + skill commands were used.
- **53 CLI invocations** in isolated temporary projects, with an isolated user profile. No real service credentials or host application configuration were used.
- The tested artifact was the published npm tarball, run through its Node.js bin entry point. Its SHA-512 matched the npm registry integrity: `sha512-eqOd0o5XbdKqYRJaQZetqqUMnh33yrkuSSRbIAjrHLEw6CUrcZpKfZoE+sDgFLO9nanoulSap/LX2MCy0Dm6Bw==`.
- The checks used Node.js directly, not an npx download or a live MCP client. No upstream MCP server, debugger, database, Zotero, Canvas, or GitHub API session was launched. Upstream application test suites were not run for these documentation-only changes; Canvas's prescribed Python suite requires uv, which is unavailable on this machine. All five patches passed `git diff --check`.

## Reviewed changes

| Repository | Base commit | Tested documentation in the proposed change |
| --- | --- | --- |
| designcomputer/mysql_mcp_server | `943ce8381637` | [README.md](https://github.com/pea3nut/mysql_mcp_server/blob/e21f97c0b7a6d249a1d901acc3a6154b734818fc/README.md) |
| svnscha/mcp-windbg | `6c7bd7598a1d` | [docs/reference/clients.md](https://github.com/pea3nut/mcp-windbg/blob/285748a8cb084c50614c7e394e85b056b1117a36/docs/reference/clients.md) |
| 54yyyu/zotero-mcp | `b083134d1d47` | [docs/getting-started.md](https://github.com/pea3nut/zotero-mcp/blob/b9d625affec1f4e9c6e7ec97e22ee7eb0ea8b3bc/docs/getting-started.md) |
| vishalsachdev/canvas-mcp | `4c40374c640d` | [README.md](https://github.com/pea3nut/canvas-mcp/blob/ccaed6d68da5983f354b5eb7a9f9d58bd20aa45f/README.md) |
| Jpisnice/shadcn-ui-mcp-server | `30efb8a0bf8d` | [README.md](https://github.com/pea3nut/shadcn-ui-mcp-server/blob/aebbab5c3bc574e98ba8b0ad8557391333f1b42b/README.md) |

The JSON report includes normalized-LF SHA-256 hashes of the tested documents, parsed inputs/outputs, exit codes, and sanitized CLI output. [Raw results](./results.json) · [Check script](./verify-outreach.mjs).

## Package evidence

- [npm provenance](https://www.npmjs.com/package/agent-add/v/1.3.1#provenance) links this release to its source/build. [GitHub Actions publishing run](https://github.com/pea3nut/agent-add/actions/runs/42591055819).
- [Socket Security report for the tested 1.3.1 artifact](https://socket.dev/npm/package/agent-add/alerts/1.3.1), viewed 2026-11-10: two license alerts (Copyleft License, Non-permissive License); no malware alerts listed. The package is MPL-2.0. This automated report does not guarantee safety.

## Reproducing the checks

1. Clone the five fork commits linked above into sibling directories named `mysql_mcp_server`, `mcp-windbg`, `zotero-mcp`, `canvas-mcp-agent-add`, and `shadcn-ui-mcp-server`.
2. Create a sibling `verification` directory and save the check script there.
3. Download and unpack the npm tarballs for `agent-add@1.3.1` into `verification/published-package` (keep `agent-add-1.3.1.tgz`) and `smol-toml@1.4.2` into `verification/toml-parser`. Each extraction retains the tarball's `package/` directory. The script checks agent-add's integrity before running it; smol-toml was also checked against registry integrity for this run.
4. Run `node verification/verify-outreach.mjs`. It creates a fresh temporary sandbox and writes `verification/results.json`; the host applications and upstream servers are not required.
