# 测试执行报告

**Run ID**: run-20260401-120000
**环境**: bash-shell
**并发数**: 4
**时间**: 2026-04-01T12:00:00Z ~ 2026-04-01T12:08:30Z（总耗时 ~510s）
**Early Stop**: ⚠️ 触发（maxFailures=2，第3批次后 failCount=3）

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| 62   | 11   | 3    | 50   | 0    |

已执行 12 个 Scenario（3批 × 4并发），50 个因 Early Stop 未执行（标记 skipped）。

## 失败用例

| caseId | Scenario | 错误类型 | 错误信息 |
|--------|----------|----------|----------|
| case-cb0001 | --version outputs the correct version number | assertion | 版本 "0.0.1-beta.1" 含预发布后缀，runner 断言过严（实际包含 \d+\.\d+\.\d+ 模式） |
| case-mc0006 | Install MCP from inline JSON source | environment | Windows 下 inline JSON `{...}` 被当作文件路径处理，CLI 报 "Local source not found" |
| case-mc0007 | Repeated inline MCP install returns exists | environment | 同 case-mc0006，inline JSON 源在 Windows 下路径解析异常 |

## 执行用例明细（已执行 12 个）

| caseId | Scenario | 状态 |
|--------|----------|------|
| case-cb0001 | --version outputs the correct version number | ✗ failed |
| case-cb0002 | --help outputs help information | ✓ passed |
| case-cb0003 | No --host flag in non-TTY exits with error code 2 | ✓ passed |
| case-ce0001 | Explicit unsupported asset type exits with code 2 | ✓ passed |
| case-mc0001 | Install MCP on Cursor succeeds | ✓ passed |
| case-mc0002 | MCP install writes to the correct file with correct content | ✓ passed |
| case-mc0003 | Repeated install of same content returns exists | ✓ passed |
| case-mc0004 | Install with conflicting key returns conflict | ✓ passed |
| case-mc0005 | Install from non-existent path returns error | ✓ passed |
| case-mc0006 | Install MCP from inline JSON source | ✗ failed |
| case-mc0007 | Repeated inline MCP install returns exists | ✗ failed |
| case-pr0001 | Install prompt on Cursor appends to AGENTS.md | ✓ passed |

## 跳过用例（50 个，Early Stop）

所有 Batch 4–16 用例（prompt/skill/command/sub-agent/pack/host/complex 系列）因 maxFailures 触发 Early Stop 而未执行。
