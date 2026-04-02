# 测试执行报告

**Run ID**: run-20260402-140000
**环境**: bash-shell
**并发数**: 4
**时间**: 2026-04-02T14:00:00Z ~ 2026-04-02T14:06:00Z（总耗时 360000ms）
**Early Stop**: ✗

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| 13   | 13   | 0    | 0    | 0    |

## 失败用例

无。

## 说明

本次 run 针对修复后的 3 个 feature 文件重新执行：
- `tests/features/host/claude-desktop.feature`（1 个 scenario）
- `tests/features/complex/pack-mixed.feature`（4 个 scenario）
- `tests/features/complex/readme-examples.feature`（8 个非 @network scenario）

修复内容：
1. **case-hcd0001**：`src/assets/mcp.ts` 增加 `%APPDATA%` 路径对 `AGENT_ADD_HOME` 的支持；feature 文件改用 `cygpath -w` 转换路径，断言兼容 macOS/Windows 双平台
2. **case-pm0002**：更新 roo-code 不支持能力的测试对象，从 `--command`（现已支持）改为 `--sub-agent`（仍不支持）
3. **case-re0006**：Codex 内联 JSON 场景使用 `cygpath -w "$SETUP_TMPDIR"` 生成 Windows 原生路径作为 `AGENT_ADD_HOME`，解决 MSYS 路径映射不一致问题
