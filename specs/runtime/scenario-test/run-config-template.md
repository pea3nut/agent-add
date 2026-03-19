# scenario-run-config.md
# 测试执行配置文件
# 由 /tns:exec-scenarios 首次执行时从模板自动生成，请根据实际项目填写

---

## 运行控制

# 最大并发 Runner 数量（默认：4）
# 建议：本地开发 2-4，CI 环境 4-8
concurrency: 4

# 最大失败容忍数量（超过则 early stop，默认：10）
maxFailures: 10

# 智能重试最大次数（默认：1；0 表示禁用智能重试）
# 每个 Case 最多尝试 (1 + maxRetries) 次，超出后直接记为最终状态
maxRetries: 1

# 测试目录路径（可选，留空则自动嗅探 tests/ / e2e/ / test/）
# 示例：tests | e2e | src/__tests__
testDir:

# Tags 过滤（可选，留空则不过滤）
# 语法：@P0 | @P0 and @web | @P0 or @api | not @skip | @P0 and (@web or @api)
tags:

---

## Executor 配置

# 本次 run 使用的执行器（单一执行器模型：每次 run 只使用一个执行器）
executor:

  # 执行器命令（必填）
  # 内置选项：
  #   playwright-cli         —— playwright-cli（浏览器 UI 自动化，默认；通过 -s=<caseId> session 实现并发隔离）
  #   bash-curl              —— Bash curl（HTTP 接口请求）
  # 自定义示例（单测框架 CLI）：
  #   command: vitest run --reporter=json
  #   command: jest --ci --json --outputFile=result.json
  command: playwright-cli

  # 执行器配置（自由文字描述，AI 自行理解和提取）
  # 不同执行器所需的配置各不相同，只需用自然语言说清楚即可。
  #
  # playwright-cli 示例：
  #   目标地址：https://your-platform.example.com
  #   认证：Bearer Token eyJhbGciOiJSUzI1NiJ9...
  #   （或）认证：使用 playwright-storage-state.json 保存的 SSO 登录态
  #   安装：npm install -g @playwright/cli@latest && playwright-cli install --skills
  #
  # bash-curl 示例：
  #   接口地址：https://api.example.com
  #   认证：Authorization: Bearer eyJhbGciOiJSUzI1NiJ9...
  #
  # vitest 示例：
  #   运行配置文件：vitest.config.ts，测试在 staging 环境运行
  #
  config: |
    （在此用自然语言描述你的执行器配置，填完后删除上方示例）

---

## 运行时注记（由 /tns:exec-scenarios 自动维护）

# 此节记录了历次执行中发现的通用 MixedCase 生成改进，适用于所有 Scenario。
# /tns:exec-scenarios 在合成每个 MixedCase 时，必须参照此节内容并将其应用到每个指令包。
# ⚠️ 勿手动删除 AI 追加的条目（除非该条目已确认过时），否则后续执行会丢失重要上下文。
# ⚠️ 此节由命令自动追加，用户仅在确认过时时手动删除条目。

notes: |
  （此处由 /tns:exec-scenarios 在执行过程中追加通用改进条目，初始为空）
