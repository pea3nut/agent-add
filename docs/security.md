# Security and verifiable releases

**English** | [中文](./security.zh-CN.md)

This page describes the agent-add installer and its release process. The behavior of the MCP servers, Skills, and other content you install is outside its scope.

## What the installer accesses

| Access | Purpose |
| --- | --- |
| Local reads | Read the sources and pack manifests you provide, inspect known host paths for detection, and read existing destination files to merge or compare content. |
| Local writes | Update the selected host's project files, or user configuration with `--global`; create temporary downloads and installation staging/backup files. |
| Network | Download HTTP(S) sources and fetch Git repositories selected by your arguments or pack manifests. HTTP downloads can follow redirects. |
| Child processes | Run the installed `git` executable to initialize, fetch, and check out source repositories. MCP commands are written into host configuration; agent-add does not start those servers or run setup commands from asset content. |

The installer has no built-in telemetry, analytics, update checks, or feature for uploading local configuration. Source servers still receive normal connection/request metadata. npm/npx also contacts its registry to download agent-add; that is separate from the installer's requests.

The CLI runs with your user permissions. Git uses your existing Git/SSH configuration and may invoke configured credential helpers or filters. This is not a sandbox: use a disposable environment with restricted files, credentials, and network access if you need enforced isolation.

Relevant code: [source resolution](../src/source/index.ts), [HTTP downloads](../src/source/http-file.ts), [Git operations](../src/source/git.ts), [host detection](../src/hosts/detect.ts), and [installation](../src/installer.ts).

## Verify where an npm version came from

The [publishing workflow](../.github/workflows/publish.yml) uses npm Trusted Publishing (GitHub Actions OIDC). It checks that the version tag matches `package.json` and the commit is merged into `master`, builds and tests a tarball, then publishes that same artifact with provenance. The publish job requires the `npm-publish` GitHub Environment; its approval rules are configured in repository settings.

To verify a particular version:

1. Open [agent-add on npm](https://www.npmjs.com/package/agent-add) and select the version you intend to install.
2. Click the provenance check mark beside the version, then **View more details**.
3. Follow **Source Commit**, **Build Summary**, and **Build File** to inspect the linked commit, Actions run, and workflow. Confirm they point to `pea3nut/agent-add` and the expected release.

Provenance is recorded per version. Version **1.3.0** predates this workflow and has no provenance attestation, as checked on **2026-11-09**. Configuring a trusted publisher does not add proof to an already published version. A workflow status badge alone does not establish the provenance of a specific tarball.

See npm's instructions for [viewing and verifying provenance](https://docs.npmjs.com/viewing-package-provenance/). Provenance establishes the publishing origin; reviewing the code and build process remains necessary to assess its behavior.

## Recorded checks

| Check | Scope and result | Evidence |
| --- | --- | --- |
| npm dependency audit, 2026-11-09 UTC | Repository lockfile at [`ad8cd77`](https://github.com/pea3nut/agent-add/commit/ad8cd77a12f5b0743c04c2d07a5857ce261b8bba), including development/build dependencies: **0 known vulnerabilities** reported by npm 11.9.0. | [Full JSON report, command, commit and lockfile hash](./security/reports/npm-audit-2026-11-09.json) |

This audit was run by Codex using the npm registry's advisory data. It is an automated dependency check, not an independent audit of installer behavior. Its result is a dated snapshot; new advisories can change it. To repeat it from a repository checkout:

```bash
npm audit --package-lock-only --include=dev --json --registry=https://registry.npmjs.org
```

The [build bundles libraries into the CLI](../tsup.config.ts). An empty runtime dependency list therefore does not mean there is no third-party code. A scan of only a consumer's npm dependency tree can miss bundled libraries; the source lockfile and published bundle both matter.

## External reports to add

The following checks are recommended next. No completed Socket, CodeQL, or Scorecard report is claimed by this document yet.

| Priority | Service | What to review |
| --- | --- | --- |
| First | [Socket](https://docs.socket.dev/docs/faq) | The actual npm package version and its published files: suspicious behavior, installation scripts, network/filesystem capabilities, and bundled code. Capabilities can be expected for an installer; inspect individual findings and scan coverage. |
| First | [GitHub CodeQL](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning) | JavaScript/TypeScript source vulnerabilities. Enable code scanning, review its findings, and link the exact Actions run plus a reviewed report or summary that readers can access. |
| Optional | [OpenSSF Scorecard](https://scorecard.dev/) | Repository and supply-chain practices, such as workflow permissions, dependency pinning, and review rules. A score describes these practices; it does not certify the absence of malicious code. |

For every report, record its public link or raw output, package version/commit, UTC date, tool version, scope/rules, findings, and unresolved limitations. Check that the link is readable without maintainer access. Link badges to this evidence and update it when the reviewed code changes.

## ChatGPT or other AI-assisted reviews

A shared conversation or screenshot can supplement the reports above. Label it **AI-assisted code review**, name the model/tool and review date, pin the source commit and package version, and include the review scope, findings, and remaining uncertainties. Prefer the full shareable conversation or exported report alongside any screenshots so readers can inspect the original context.

Do not describe an AI response as an independent security certification. A statement that no suspicious code was found applies only to the code and scope actually reviewed; it is not a guarantee about every release.
