# MCP installation example checks

Checked 2026-11-10T05:01:02.809Z on Windows (v24.22.1) using the published `agent-add@1.3.1` artifact.

- **30/30 cases passed:** five project examples × Cursor, Codex CLI and Gemini CLI × user and project scope. User runs include `--global`; project runs omit it. The CLI has no `--project` flag.
- **90 CLI invocations** checked exact command, arguments, environment and working directory; preservation of an existing server and client preference; unchanged repeated installs; and refusal of conflicting entries without changing the file.
- User profiles and project directories were isolated. The shadcn/ui configuration was fetched from its documented public URL; the other four examples use inline JSON.
- The npm tarball's SHA-512 matched registry integrity: `sha512-eqOd0o5XbdKqYRJaQZetqqUMnh33yrkuSSRbIAjrHLEw6CUrcZpKfZoE+sDgFLO9nanoulSap/LX2MCy0Dm6Bw==`.
- These are configuration-generation checks run through the package's Node.js bin entry point. The npx bootstrap, host applications and live MCP services were not exercised. No real service credentials were used. MySQL credentials must still be available in the client's environment as documented by the project.
- All patches passed `git diff --check`. Upstream server suites were not run for these documentation changes; the Canvas Python suite requires uv, which is unavailable on this machine.

## Tested changes

Each review branch contains one commit on its upstream base, modifying one documentation file.

| Project | Tested document | Commit |
| --- | --- | --- |
| designcomputer/mysql_mcp_server | [README.md](https://github.com/pea3nut/mysql_mcp_server/blob/8d317cd4cb84b092cddd46df60e28f6a19d1b655/README.md) | [8d317cd](https://github.com/pea3nut/mysql_mcp_server/commit/8d317cd4cb84b092cddd46df60e28f6a19d1b655) |
| svnscha/mcp-windbg | [docs/reference/clients.md](https://github.com/pea3nut/mcp-windbg/blob/ecb9f1114f9d626258e00cf0257adf452c29ec67/docs/reference/clients.md) | [ecb9f11](https://github.com/pea3nut/mcp-windbg/commit/ecb9f1114f9d626258e00cf0257adf452c29ec67) |
| 54yyyu/zotero-mcp | [README.md](https://github.com/pea3nut/zotero-mcp/blob/d368cbe82e5c5b42526a134504cbf46a75997bf8/README.md) | [d368cbe](https://github.com/pea3nut/zotero-mcp/commit/d368cbe82e5c5b42526a134504cbf46a75997bf8) |
| vishalsachdev/canvas-mcp | [README.md](https://github.com/pea3nut/canvas-mcp/blob/dd36e50e8f933c65e96fcdfbbf72725c72003b63/README.md) | [dd36e50](https://github.com/pea3nut/canvas-mcp/commit/dd36e50e8f933c65e96fcdfbbf72725c72003b63) |
| Jpisnice/shadcn-ui-mcp-server | [README.md](https://github.com/pea3nut/shadcn-ui-mcp-server/blob/8a80862adcfa2fcaf5b309d723a79ec4e72fb715/README.md) | [8a80862](https://github.com/pea3nut/shadcn-ui-mcp-server/commit/8a80862adcfa2fcaf5b309d723a79ec4e72fb715) |

[Raw results](./results.json) · [Reproduction script](./verify-outreach.mjs). Document hashes normalize CRLF to LF; the checkout commit recorded in each case is the base before the edit.

## Package evidence

- [npm provenance for 1.3.1](https://www.npmjs.com/package/agent-add/v/1.3.1#provenance) · [publishing workflow](https://github.com/pea3nut/agent-add/actions/runs/42591055819).
- [Socket Security report for 1.3.1](https://socket.dev/npm/package/agent-add/alerts/1.3.1), checked 2026-11-10: two MPL-2.0 license alerts (Copyleft License and Non-permissive License); no malware alerts listed. Automated findings do not guarantee safety.
- The documentation uses npm's default tag. The PR text offers `npx agent-add@1.3.1` as an alternative that pins the installer release and omits `-y`.

## Reproduce

Clone the five linked commits into sibling directories named `mysql_mcp_server`, `mcp-windbg`, `zotero-mcp`, `canvas-mcp-agent-add` and `shadcn-ui-mcp-server`. Save the script in a sibling `verification/` directory. Extract the npm tarballs for `agent-add@1.3.1` into `verification/published-package/` (keep `agent-add-1.3.1.tgz`) and `smol-toml@1.4.2` into `verification/toml-parser/`, retaining each `package/` directory. Run `node verification/verify-outreach.mjs`. No live service credentials are required.
