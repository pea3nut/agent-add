# 测试执行报告

**Run ID**: run-20260401-120000
**Feature**: README.zh-CN.md documentation examples
**环境**: bash-shell
**并发数**: 4
**时间**: 2026-04-01T12:00:00Z ~ 2026-04-01T12:02:30Z（总耗时 ~150s）

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| 8    | 8    | 0    | 0    | 0    |

## 用例详情

| caseId | Scenario | 状态 | 耗时 |
|--------|----------|------|------|
| case-rd1a01 | Install MCP from inline JSON on Cursor (README format A) | passed | ~5s |
| case-rd1b01 | Install MCP from inline JSON with mcpServers wrapper (README format B) | passed | ~15s |
| case-rd2a01 | Install inline prompt on Claude Code (README example) | passed | ~10s |
| case-rd3a01 | Cross-host MCP on Cursor | passed | ~5s |
| case-rd3b01 | Cross-host MCP on Claude Code | passed | ~10s |
| case-rd3c01 | Cross-host MCP on Codex | passed | ~8s |
| case-rd4a01 | Install MCP from local JSON file on Cursor | passed | ~5s |
| case-rd5a01 | Install inline prompt on Cursor (README Cursor example) | passed | ~10s |

## 失败用例

无

## 备注

- Tags 过滤 `not @network and not @skip` 排除了 6 个需要网络的场景
- 被排除的 @network 场景覆盖：Git HTTPS MCP、HTTP URL MCP、Git Skill、Git Command、Git Sub-agent、多 Sub-agent 批量安装
