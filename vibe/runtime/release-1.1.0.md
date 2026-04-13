## v1.1.0

### Wildcard Batch Install

Use the `/*` suffix to install all matching assets from a directory at once.

```bash
agent-add --mcp ./my-servers/*
agent-add --command ./commands/*
```

This expands the directory and installs each matching file (`.json` for MCP, `.md` for command/prompt/sub-agent) or subdirectory (for skill). Asset names are automatically prefixed with the directory name (e.g. `batch/svc-a`).

### GitHub & GitLab Web URL Support

Paste GitHub or GitLab web URLs directly — no need to manually convert them to git clone URLs.

```bash
agent-add --mcp https://github.com/user/repo/tree/main/path/to/mcp
agent-add --mcp https://gitlab.com/user/repo/-/tree/main/path/to/mcp
```

Tree and blob URLs are automatically normalized to the internal `repo.git#path@ref` format.
