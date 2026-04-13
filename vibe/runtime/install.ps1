tsx ../../src/index.ts -- `
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}' `
  --mcp 'git@github.com:modelcontextprotocol/servers.git#.mcp.json' `
  --skill 'https://github.com/anthropics/skills.git#skills/pdf' `
  --prompt "# Code Review Rules`n`nAlways review for security issues first." `
  --command 'https://github.com/wshobson/commands.git#tools/security-scan.md' `
  --sub-agent 'https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md'