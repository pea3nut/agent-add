# 测试执行报告

**Run ID**: run-20260402-120000
**环境**: bash-shell
**并发数**: 4
**时间**: 2026-04-02T12:00:00Z ~ 2026-04-02T14:10:00Z（总耗时 7800000ms）
**Early Stop**: ✗

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| 70   | 67   | 3    | 0    | 0    |

## 失败用例

| caseId | Scenario | 错误类型 | 错误信息 |
|--------|----------|----------|----------|
| case-hcd0001 | Install MCP on Claude Desktop host (macOS) | environment | Windows 下 %APPDATA% 路径不受 AGENT_ADD_HOME 控制，claude-desktop 写入了系统 APPDATA（@P2 低优先级用例） |
| case-pm0002 | Explicit flag for unsupported asset type exits with code 2 (Roo Code) | assertion | roo-code 现已支持 command 类型，exit 0 并写入文件；feature 文件期望 exit 2，用例断言已过时 |
| case-re0006 | Cross-host MCP on Codex | environment | Windows/MSYS 路径映射不一致：AGENT_ADD_HOME="/tmp/..." 在 Node.js 中解析为 C:\tmp\...，bash 检测路径与实际写入路径不同 |

## 失败原因分析

3 个失败均属于 **environment / assertion** 类型：

1. **claude-desktop**（case-hcd0001，@P2）：Windows 下 `resolveConfigFilePath` 对 `%APPDATA%` 路径直接使用 `process.env['APPDATA']`，不经 `getHomedir()`，故 `AGENT_ADD_HOME` 无法重定向。需代码层修复或平台级跳过标记。

2. **roo-code command**（case-pm0002）：宿主能力矩阵已更新，roo-code 现支持 `command` 类型。feature 文件 `pack-mixed.feature` 仍期望 exit 2，需同步更新。

3. **Codex 内联 JSON 跨宿主**（case-re0006）：Git Bash 中 `mktemp -d` 返回 MSYS 风格路径 `/tmp/...`，作为 `AGENT_ADD_HOME` 传入 Node.js 时被解析为 `C:\tmp\...`，与 bash 实际检测的 MSYS 映射路径不一致。修复方案：feature 文件改用 `AGENT_ADD_HOME="$(cygpath -w "$SETUP_TMPDIR")"` 传入 Windows 原生路径。

## 趋势（最近 2 次 run）

| Run ID | 总计 | 通过 | 失败 | 跳过 | Early Stop |
|--------|------|------|------|------|------------|
| run-20260401-120000 | 62 | 11 | 3 | 50 | ✓ (Batch 3) |
| run-20260402-120000 | 70 | 67 | 3 | 0  | ✗ |
