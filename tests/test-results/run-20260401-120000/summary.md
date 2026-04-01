# 测试执行报告

**Run ID**: run-20260401-120000
**环境**: bash-shell
**并发数**: 4
**时间**: 2026-04-01T12:00:00Z ~ 2026-04-01T12:15:00Z（总耗时 ~900s）

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| 21   | 21   | 0    | 0    | 0    |

## 用例结果

### multi-asset.feature (4/4 passed)
| caseId | Scenario | 状态 |
|--------|----------|------|
| case-m1a001 | Two MCP flags in one command on Cursor | ✓ passed |
| case-m1a002 | All 5 asset types in one command on Cursor | ✓ passed |
| case-m1a003 | Pack plus explicit MCP flag on Claude Code | ✓ passed |
| case-m1a004 | Pack with source array installs multiple assets of same type | ✓ passed |

### mcp-advanced.feature (6/6 passed)
| caseId | Scenario | 状态 |
|--------|----------|------|
| case-mcp001 | MCP with env variables preserves env in JSON output | ✓ passed |
| case-mcp002 | MCP install into pre-existing config preserves existing entries | ✓ passed |
| case-mcp003 | Two sequential MCP installs coexist in same config on Claude Code | ✓ passed |
| case-mcp004 | Codex MCP install produces TOML table format | ✓ passed |
| case-mcp005 | Codex TOML preserves env variables | ✓ passed |
| case-mcp006 | Vibe MCP install produces TOML array format | ✓ passed |

### prompt-lifecycle.feature (4/4 passed)
| caseId | Scenario | 状态 |
|--------|----------|------|
| case-pmt001 | Prompt update flow returns updated status on content change | ✓ passed |
| case-pmt002 | Two different prompts coexist in AGENTS.md with separate markers | ✓ passed |
| case-pmt003 | Prompt append preserves pre-existing non-agent-get content | ✓ passed |
| case-pmt004 | Prompt create-file-in-dir strategy on Roo Code | ✓ passed |

### sub-agent-advanced.feature (3/3 passed)
| caseId | Scenario | 状态 |
|--------|----------|------|
| case-sub001 | Sub-agent on Cursor expands cursor-specific frontmatter fields | ✓ passed |
| case-sub002 | Sub-agent on Claude Code expands claude-code-specific frontmatter fields | ✓ passed |
| case-sub003 | Sub-agent conflict detection when existing file has different content | ✓ passed |

### pack-mixed.feature (4/4 passed)
| caseId | Scenario | 状态 |
|--------|----------|------|
| case-pak001 | Pack on Codex installs MCP as TOML and prompt, skips unsupported types | ✓ passed |
| case-pak002 | Explicit flag for unsupported asset type exits with code 2 | ✓ passed |
| case-pak003 | Pack on Roo Code installs MCP, prompt as file-in-dir, and skill, skips command and subAgent | ✓ passed |
| case-pak004 | MCP conflict in single-asset install exits with code 1 | ✓ passed |

## 失败用例

无
