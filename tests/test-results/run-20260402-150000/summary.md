# 测试执行报告

**Run ID**: run-20260402-150000
**范围**: tests/features/core/git-source.feature（tags: @network and not @skip）
**环境**: bash-shell
**并发数**: 3
**时间**: 2026-04-02T15:00:00Z ~ 2026-04-02T15:03:00Z（总耗时 180000ms）

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| 3    | 3    | 0    | 0    | 0    |

## 通过用例

| caseId    | Scenario                                                                    | 耗时  |
|-----------|-----------------------------------------------------------------------------|-------|
| case-gs001 | Install MCP from HTTPS git URL with @branch and #subpath (`@main`)         | 40s   |
| case-gs002 | Install MCP from HTTPS git URL with @branch and #subpath on non-default branch (`feat/url-elicitation`) | 45s |
| case-gs003 | Install MCP from HTTPS git URL with @tag and #subpath (`2026.1.26`)        | 60s   |

## 失败用例

无

## 说明

- case-gs002 和 case-gs003 是本次新解除 @skip 的用例，之前因为使用杜撰仓库 `pea3nut/agent-add-fixtures` 而标记跳过
- 替换为 `modelcontextprotocol/servers`（82k stars）后，branch `feat/url-elicitation` 和 tag `2026.1.26` 均已验证存在 `.mcp.json` 文件，全部通过
