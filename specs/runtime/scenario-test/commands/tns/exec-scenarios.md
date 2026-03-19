# /tns:exec-scenarios

执行 Gherkin 测试用例。以流式增量模式（类 Node.js Stream）逐 Scenario 合成 MixedCase 指令包，合成即立即拉起 `scenario-case-runner` 子代理执行。

## 命令参数

```
/tns:exec-scenarios [cases=<.feature文件路径或Scenario片段>] [config=<配置文件路径>]
```

- `cases`：可选。指定要运行的用例：
  - 文件路径（如 `tests/features/search/product.feature`）
  - 目录路径（递归扫描该目录下所有 `.feature` 文件）
  - Scenario 标题或片段文本（AI 在用例库中匹配对应 Scenario）
  - **默认**：自动嗅探 `{testDir}/features/` 下所有用例
- `config`：可选。指定 `scenario-run-config.md` 的路径（**默认**：自动查找 `{testDir}/features/scenario-run-config.md`）

> 其他运行参数（并发数、最大失败容忍、tags 过滤等）均在 `scenario-run-config.md` 中配置，不通过命令行传入。

---

## 核心约束：主模型严禁直接执行测试步骤

> ⚠️ **本约束贯穿命令全程，无一例外。**

**主模型的职责仅限于**：
1. **分析/调研**：读取文件、分析回报、推断失败原因
2. **合成 MixedCase**：将 Gherkin 步骤翻译为具体工具调用指令，生成指令包
3. **拉起 Runner 子代理**：通过 `scenario-case-runner` 执行所有测试和调研操作
4. **汇总回报**：从子代理的文字回报中提取结果，写入 result.json / summary.md

**主模型严禁**：
- 直接调用 playwright-cli、curl、bash 或任何其他工具执行测试步骤
- 将"直接运行一下看看"作为调研手段

**若需调研**（如分析失败原因、验证某个假设）：
- 合成专用的"调研 MixedCase"（可聚焦于关键步骤，比正式 MixedCase 更精简）
- 拉起 `scenario-case-runner` 子代理执行，在 MixedCase 的 `caseId` 前缀中标记 `inv-`（如 `inv-case-7f3a2c`）
- 子代理回报后，主模型分析调研结果，用于改进 MixedCase 生成逻辑
- ⚠️ 调研运行结果**不计入**正式汇总（不写入 result.json / summary.md）
- ⚠️ 调研运行次数不受 `maxRetries` 约束，但应控制在合理范围内（通常 1-2 次）

---

## Phase 1：嗅探与配置检查

### 1.1 推断 testDir

按优先级依次检查（**不依赖配置文件**，纯嗅探）：
1. 项目根目录下是否存在 `tests/` 目录
2. 项目根目录下是否存在 `e2e/` 目录
3. 项目根目录下是否存在 `test/` 目录
4. 以上均不存在则兜底使用 `tests/`

得到 `SCENARIO_TEST_DIR`（如 `tests`）。配置文件路径为 `{SCENARIO_TEST_DIR}/features/scenario-run-config.md`。

### 1.2 检查配置文件（幂等）

检查 `{SCENARIO_TEST_DIR}/features/scenario-run-config.md` 是否存在：

**若不存在**：
1. 从 `.ttadk/plugins/tns/scenario-test/run-config-template.md` 复制到 `{SCENARIO_TEST_DIR}/features/scenario-run-config.md`（若 `{SCENARIO_TEST_DIR}/features/` 目录不存在则一并创建）
2. **暂停执行**，向用户展示：
   ```
   已生成 {SCENARIO_TEST_DIR}/features/scenario-run-config.md，请填写 executor 配置后重新运行：
   - command：执行器命令（默认已填 playwright-cli，可按需修改）
   - config：用自然语言描述你的执行器配置（目标地址、认证方式等）
   ```
3. 等待用户确认后重新运行（不继续执行）

**若存在**：读取所有配置字段，继续执行。若配置文件中有 `testDir` 字段且非空，用其覆盖 0.1 嗅探的结果。

### 1.3 读取配置

从 `scenario-run-config.md` 中提取以下变量（后续步骤使用**具体值**，不使用变量名）：
- `SCENARIO_TEST_DIR`：testDir 实际路径
- `SCENARIO_CONCURRENCY`：并发数（默认 4）
- `SCENARIO_MAX_FAILURES`：最大失败数（默认 10）
- `SCENARIO_MAX_RETRIES`：智能重试最大次数（默认 1，0 表示禁用智能重试）

从 `executor` 配置块提取：
- `EXECUTOR_COMMAND`：执行器命令的实际值（如 `playwright-cli`、`bash-curl`、`vitest run --reporter=json`）
- `EXECUTOR_CONFIG`：`executor.config` 字段的自由文字内容（整段文字，原样保留，供后续合成指令包时参考）

从 `## 运行时注记` 节提取：
- `RUNTIME_NOTES`：`notes:` 字段的自由文字内容（整段文字，原样保留）；若为空或字段不存在，视为无注记
- 合成每个 MixedCase 时，**必须将 `RUNTIME_NOTES` 的内容应用到指令包**（如补充步骤、调整等待时间等）

> **说明**：`executor.config` 和 `notes` 均为自由文字，不强制解析为固定字段。主模型在合成指令包时，根据 `EXECUTOR_COMMAND` 类型自行从 `EXECUTOR_CONFIG` 中理解并提取所需信息（如 baseUrl、认证方式等），同时将 `RUNTIME_NOTES` 中的通用改进一并注入每个步骤序列。

生成本次 run 的唯一标识：
- `RUN_ID`：格式 `run-{YYYYMMDD}-{HHmmss}`，如 `run-20260304-143021`
- `RUN_ARTIFACT_BASE`：`{SCENARIO_TEST_DIR}/test-results/{RUN_ID}/`（完整绝对路径）

---

## Phase 2：用例发现

### 2.1 扫描用例文件

根据参数确定扫描范围：
- 若提供 `cases=<文件路径>`：直接使用该文件
- 若提供 `cases=<目录路径>`：递归扫描该目录下所有 `.feature` 文件
- 若提供 `cases=<Scenario标题或片段文本>`：在 `{SCENARIO_TEST_DIR}/features/` 下递归搜索，匹配 Scenario 标题或步骤文本
- 若无参数：扫描 `{SCENARIO_TEST_DIR}/features/` 下所有 `.feature` 文件

**扫描结果**：得到有序的 `.feature` 文件列表（`FEATURE_FILES`）

### 2.2 Tags 过滤（若 run-config 中配置了 `tags` 字段）

若 `scenario-run-config.md` 中配置了 `tags` 过滤表达式，则对扫描到的每个 Scenario 按以下逻辑过滤：
- `@P0`：Scenario 含有 `@P0` tag
- `@P0 and @web`：同时含两个 tag（AND）
- `@P0 or @api`：含任一 tag（OR）
- `not @skip`：不含此 tag（NOT）
- 支持括号：`@P0 and (@web or @api)`

若 tags 表达式语法错误，立即停止并提示语法错误，不启动任何 Runner。

### 2.3 展示执行计划

向用户展示摘要：
```
即将执行：
  用例数量：N 个 Scenario（来自 M 个 .feature 文件）
  执行器：{EXECUTOR_COMMAND}
  并发数：{SCENARIO_CONCURRENCY}
  产物目录：{RUN_ARTIFACT_BASE}
```

**并发兼容性警告**（仅当 `SCENARIO_CONCURRENCY > 1` 时触发）：

- **playwright-cli**：每个 MixedCase 的 `[环境 Setup]` 通过 `-s=<caseId>` 命名 session 启动独立浏览器进程，天然进程级隔离，可放心并发：
  ```
  ✅  playwright-cli 并发执行：各 Runner 在独立 session（-s=<caseId>）中运行，进程级隔离，不共享浏览器状态。
      Setup 启动 session，Teardown 精确关闭，无并发风险。
  ```
- **自定义 CLI**：若 `EXECUTOR_CONFIG` 中描述了启动本地服务（含关键词 `port`、`dev server`、`localhost`），则 `[环境 Setup]` 中的临时目录隔离可能不足以解决端口冲突，需警告：
  ```
  ⚠️  CLI 执行器启动了本地服务，并发时可能存在端口冲突。
      建议将 concurrency 设为 1，或在 executor.config 中配置端口隔离参数（如 --port=auto）。
  ```
- **bash-curl**：`curl` 天然无状态，无需警告。

---

## Phase 3：批量并行执行

> **核心原则：能并行绝不串行**——所有 Runner 同时拉起，互不等待。`concurrency` 仅作为同时在途数量的上限，不是串行化的理由。

### 3.1 预扫描：获取全量 Scenario 列表

读取 `FEATURE_FILES` 中每个 `.feature` 文件，**一次性解析出所有 Scenario**，得到完整的待执行列表 `SCENARIO_LIST`。

Scenario 解析规则：识别 `Scenario:` 关键字块（到下一个 `Scenario:` 或文件末尾），记录 `featurePath` + `scenarioTitle` + `steps`。

### 3.2 批量合成 + 并行拉起

**将 `SCENARIO_LIST` 中所有 Scenario 一次性生成 MixedCase 指令包，然后同时拉起所有 Runner**：

1. 为每个 Scenario 合成对应的 MixedCase 指令包（按下方规则填充）
2. **将所有指令包同时发起 `scenario-case-runner` 调用**（并行工具调用，不等任何一个完成）
3. 等待所有 Runner 返回结果，汇总

若 `SCENARIO_LIST` 数量超过 `SCENARIO_CONCURRENCY`：先拉起前 `SCENARIO_CONCURRENCY` 个 Runner（同时拉起），等该批全部完成后，再拉起下一批（同时拉起），直到全部处理完。每批内部仍然是并行的。

#### 合成 MixedCase 指令包

> **重要**：必须参照 `.ttadk/plugins/tns/scenario-test/mixed-case-template.md` 中定义的格式，填充以下所有字段。**所有字段必须为具体值，禁止出现 `{变量}` 形式的占位符。指令包不含任何文件路径。**

填充指令包各字段：

1. **基本信息**：
   - `caseId`：基于 `featurePath + scenarioTitle` 生成的稳定短哈希，格式 `case-{6字符}`
   - `scenarioTitle`：Scenario 标题原文

2. **执行环境**（全部替换为具体值，从 `EXECUTOR_CONFIG` 自由文字中提取）：
   - `executor`：使用 `EXECUTOR_COMMAND` 的实际值（如 `playwright-cli`）
   - 根据 `EXECUTOR_COMMAND` 类型，从 `EXECUTOR_CONFIG` 文字中自行理解并提取所需环境信息：
     - **playwright-cli**：提取目标地址（作为 `baseUrl`）、认证方式（作为 `storageStatePath` 或 `authHeader`）
     - **bash-curl**：提取接口地址（作为 `baseUrl`）、Authorization header
     - **自定义 CLI**：提取 CLI 所需的环境变量、配置参数等
   - 将提取到的信息替换为具体值后写入指令包，**禁止将 `EXECUTOR_CONFIG` 原文照搬进指令包**

3. **执行步骤**（每步骤均为具体工具调用指令，即"喂嘴里"级别）：
   
   对 Scenario 中每个 Given/When/Then/And/But 步骤：
   - **所有步骤统一使用 `EXECUTOR_COMMAND`**（单一执行器，来自 run-config `executor.command`，已为具体值）
   - **翻译为具体工具调用指令**（主模型负责翻译）：
     - 将 Gherkin 自然语言描述翻译为具体的工具调用（工具名+完整参数）
     - 将所有参数替换为具体值（如 `"耳机"` 保持原样，从 `EXECUTOR_CONFIG` 提取的目标地址替换为实际 URL）
     - 若步骤涉及等待，写明等待策略（如等待某元素出现、等待 2 秒等）
     - 若步骤涉及滚动，写明滚动方向和目标
   - **写明断言目标**：期望的可观测结果（具体到页面元素或响应字段）
   - **不向指令包写入任何文件路径**（截图、结果文件等由主模型在子代理回报后负责）

   **Gherkin 步骤翻译规则（T606）**：
   
   根据 Gherkin 步骤的语义，翻译为 `EXECUTOR_COMMAND` 对应的具体工具调用：

   **当 `EXECUTOR_COMMAND` 为 `playwright-cli` 时**：
   > `playwright-cli` 通过 bash 命令行调用，所有命令带 `-s=<caseId>` 参数，操作 Setup 创建的独立 session。
   > 操作前通常需先 `snapshot` 获取元素 ref，再用 ref 交互。
   
   | Gherkin 语义 | 翻译为具体工具调用 |
   |---|---|
   | 用户访问/打开页面 URL | `bash: playwright-cli -s=<caseId> goto <从 EXECUTOR_CONFIG 提取的目标地址>/path` |
   | 检查页面现状（交互前） | `bash: playwright-cli -s=<caseId> snapshot`（获取元素列表和 ref） |
   | 用户点击某元素 | 先 `snapshot` 确认 ref，再 `bash: playwright-cli -s=<caseId> click <ref>` |
   | 用户填写/输入文字 | 先 `snapshot` 获取输入框 ref，再 `bash: playwright-cli -s=<caseId> fill <ref> "输入内容"` |
   | 用户按键（如 Enter） | `bash: playwright-cli -s=<caseId> press Enter` |
   | 用户等待某条件 | 重试 `snapshot`，在输出中验证目标内容出现（最多 N 次，间隔 1s） |
   | 断言页面包含某文字 | `bash: playwright-cli -s=<caseId> snapshot`；断言目标：快照输出包含 `"期望内容"` |
   | 加载 SSO 登录态 | `bash: playwright-cli -s=<caseId> state-load <storageStatePath>`（在 open 之后调用） |

   **当 `EXECUTOR_COMMAND` 为 `bash-curl` 时**：
   | Gherkin 语义 | 翻译为具体工具调用 |
   |---|---|
   | 发起 GET 请求 | `bash: curl -s -X GET "<从 EXECUTOR_CONFIG 提取的接口地址>/path" -H "<Authorization header>"` |
   | 发起 POST 请求（含 body） | `bash: curl -s -X POST "<接口地址>/path" -H "Content-Type: application/json" -d '{"key":"value"}'` |
   | 断言响应字段 | 工具调用：上述 curl + `| jq '.field'`；断言目标：输出等于 `"期望值"` |

   **当 `EXECUTOR_COMMAND` 为自定义 CLI（如 `vitest run`）时**：
   - 对每个 Scenario，构造完整的 CLI 调用命令
   - 示例：`bash: npx vitest run --testNamePattern="场景标题" --reporter=json`
   - 断言目标：CLI 退出码为 0，或输出中包含 `"passed"` 关键字

#### 合成 [环境 Setup] 和 [环境 Teardown]

每个 MixedCase 指令包**必须包含** `[环境 Setup]` 和 `[环境 Teardown]` 两节，用于创建和清理隔离的测试执行环境。子代理保证 Teardown 始终执行（类 try/finally）。

根据 `EXECUTOR_COMMAND` 类型填充：

根据 `EXECUTOR_COMMAND` 类型填充，**Teardown 必须精确清理 Setup 所创建的资源，禁止模糊清理（如 `playwright-cli close-all`）**：

**playwright-cli**：
- **Setup**：注入 `bash: playwright-cli -s=<caseId> open <baseUrl>`；`捕获输出: 无`（session 名称 = caseId，已知）
- **Teardown**：`依赖捕获: 无`；注入 `bash: playwright-cli -s=<caseId> close`（精确关闭本 Runner session，不影响其他 Runner）
- 即使 `concurrency = 1` 也必须注入，确保每次执行后浏览器进程干净退出
- 若配置中有 `storageStatePath`，在 Setup 中先 `open` 再 `bash: playwright-cli -s=<caseId> state-load <storageStatePath>`

**bash-curl**：
- **Setup / Teardown**：均填写 `"无"`，`curl` 天然无状态，无需隔离

**自定义 CLI**（如 `vitest run`、`jest --ci`）：
- **Setup**：注入 `bash: mktemp -d /tmp/scenario-${caseId}-XXXXXX`；`捕获输出: SETUP_TMPDIR` ← mktemp 的输出路径
- **Teardown**：`依赖捕获: SETUP_TMPDIR`；注入 `bash: rm -rf "<SETUP_TMPDIR>"`（精确删除该目录，不影响其他目录）
- 若 `EXECUTOR_CONFIG` 中无本地服务启动（无 `port`/`dev server` 关键词），Setup/Teardown 可简化为 `"无"`

#### 并行拉起所有 Runner

所有 MixedCase 指令包合成完毕后，**同时发起所有 `scenario-case-runner` 调用**（并行工具调用，不串行等待）：

- 若 `SCENARIO_LIST` 数量 ≤ `SCENARIO_CONCURRENCY`：一次性拉起全部，全部并行
- 若 `SCENARIO_LIST` 数量 > `SCENARIO_CONCURRENCY`：按批次处理，每批同时拉起 `SCENARIO_CONCURRENCY` 个 Runner，等该批全部完成后再拉起下一批

> ⚠️ **严禁串行**：禁止拉起一个 Runner 后等待其完成再拉起下一个。同一批次内的所有 Runner 必须同时在途。

每个 Scenario 分配独立的运行序号 `SEQ`（从 1 开始递增），供进度输出使用。

**Early Stop 检查（T506，仅作用于多批次场景）**：
- 维护全局失败计数器 `FAIL_COUNT`（初始为 0）
- 每当有子代理报告失败（`failed` 或 `error`）：`FAIL_COUNT` 加 1
- **检查时机**：每批次全部完成后，决定是否拉起下一批
- 若 `FAIL_COUNT` ≥ `SCENARIO_MAX_FAILURES`：
  - 不再拉起后续批次
  - 进入 Phase 5，在汇总中标记 `earlyStop: true`
- 注：同一批次内的 Runner 已并行拉起，不可中途取消

### 3.3 实时进度反馈

每当有 Scenario 完成时，输出一行进度：
```
[✓ passed] case-7f3a2c  搜索存在的商品  (1.2s)
[✗ failed] case-3b9d1e  登录失败提示    (断言失败：期望显示错误提示但页面无变化)
```

---

## Phase 4：智能重试（每批次完成后执行）

> **时机**：每批 Runner 全部完成后，在拉起下一批（或进入 Phase 5）之前执行此步骤。

### 4.1 分析失败 Case

对本批次中状态为 `failed` 或 `error` 的 Case，**逐一分析回报内容**，将每个失败分类为：

| 分类 | 识别标志 | 处理 |
|------|---------|------|
| `app-bug` | App 行为与 Scenario 期望的功能结果不符（如断言"按钮点击后应跳转登录页"但实际未跳转）；这是真实的业务 bug | 不重试，保留 failed 状态 |
| `mixcase-fixable` | MixedCase 步骤本身有问题（如缺少 SSO 认证步骤、步骤顺序错误、等待时间不足、特定数据未清理导致状态污染）；与 App 功能正确与否无关 | 重试（见 4.2） |
| `env-error` | 执行环境问题（session 启动失败、网络不可达、playwright-cli 命令本身报错）；不是 MixedCase 的问题 | 不重试，保留 error 状态 |

> **关键判断原则**：MixedCase 问题是"测试脚本写错了"，App-bug 是"被测系统有问题"。若无法确定，倾向于 `app-bug`（不盲目重试）。

### 4.2 对 `mixcase-fixable` Case 生成修复方案

对每个 `mixcase-fixable` Case，主模型生成修复方案，并判断修复是否通用：

**若仅凭回报无法判断根因，先做 Investigation Run**：
1. 合成专用的调研 MixedCase（可只包含关键步骤，`caseId` 以 `inv-` 为前缀，如 `inv-case-7f3a2c`）
2. 拉起 `scenario-case-runner` 子代理执行调研
3. 子代理回报后，主模型分析结果，明确根因
4. 调研结果不写入 result.json / summary.md（严禁计入正式汇总）
5. 基于调研结论，进入下方修复方案生成

**通用改进**（适用于所有/大多数 Scenario 的改进）：
- 示例：所有测试前都需要调用 `state-load` 加载 SSO 登录态
- 示例：导航后需额外等待 2s 才能交互
- 示例：某接口需要特定请求头

→ **操作**：
1. 向 `scenario-run-config.md` 的 `notes:` 字段追加一条改进条目（自然语言描述）
2. 重新生成本 Case 的 MixedCase（应用该改进）
3. 重新拉起 Runner；在回报中标记 `retried: true, retryReason: "通用改进：..."`

**一次性修复**（仅对本 Case 有效的改进）：
- 示例：清理上次执行遗留的特定商品数据（仅此 Case 受影响）
- 示例：本 Case 的某元素需要先滚动到可见区域才能点击

→ **操作**：
1. **不写入** `scenario-run-config.md`
2. 直接将修复内容体现在重新生成的 MixedCase 步骤中
3. 重新拉起 Runner；在回报中标记 `retried: true, retryReason: "一次性修复：..."`

### 4.3 重试约束

- **每个 Case 最多重试 `SCENARIO_MAX_RETRIES` 次**（默认 1）：已达到重试上限的 Case 若仍失败，直接记为最终状态（`failed` 或 `error`），不再重试
- **`SCENARIO_MAX_RETRIES = 0` 时**：跳过整个 Phase 4，不执行任何智能重试分析
- **重试计入 `maxFailures`**：重试后仍失败的 Case 算入失败计数
- **重试 Runner 属于当前批次的补充**：重试与下一正常批次互不干扰，重试 Runner 完成后再进入下一批次

---

## Phase 5：结果汇总

### 5.1 等待所有在途任务完成

等待所有已拉起的 `scenario-case-runner` 子代理返回文字结果。

### 5.2 汇总各 case 结果（T507）

从每个子代理的**文字回报**（不读取任何文件）中提取以下信息：
- `caseId`：用例标识
- `状态`：`passed` / `failed` / `error`
- `执行步骤数`：总步骤数
- `耗时`：约 X 秒
- `步骤结果`：每步的 passed/failed
- `失败原因`（若失败）：失败步骤和错误描述

统计汇总：
- `total`：总 Scenario 数
- `passed`：通过数
- `failed`：失败数（包括 early stop 后未执行的标记为 `skipped`）
- `skipped`：因 early stop 未执行的 Scenario 数
- `error`：子代理崩溃/异常数
- `durationMs`：总耗时（从首个 Scenario 开始到最后一个完成）
- `earlyStop`：是否触发了 maxFailures early stop

### 5.3 写入汇总文件

**result.json**（写入 `{RUN_ARTIFACT_BASE}/result.json`）：
```json
{
  "runId": "<RUN_ID>",
  "startTime": "<ISO 8601>",
  "endTime": "<ISO 8601>",
  "durationMs": <总耗时>,
  "executor": "<EXECUTOR_COMMAND>",
  "concurrency": <SCENARIO_CONCURRENCY>,
  "summary": {
    "total": <N>,
    "passed": <N>,
    "failed": <N>,
    "skipped": <N>,
    "error": <N>
  },
  "earlyStop": <true|false>,
  "cases": [
    {
      "caseId": "<case-id>",
      "scenarioTitle": "<标题>",
      "status": "passed|failed|error|skipped",
      "durationMs": <耗时>,
      "failedStep": <失败步骤序号或 null>,
      "errorType": "<assertion|timeout|environment|tool-error|null>",
      "errorMessage": "<错误描述或 null>"
    }
  ]
}
```

**summary.md**（写入 `{RUN_ARTIFACT_BASE}/summary.md`）：
```markdown
# 测试执行报告

**Run ID**: {RUN_ID}
**环境**: {EXECUTOR_COMMAND}
**并发数**: {SCENARIO_CONCURRENCY}
**时间**: {startTime} ~ {endTime}（总耗时 {durationMs}ms）

## 汇总

| 总计 | 通过 | 失败 | 跳过 | 错误 |
|------|------|------|------|------|
| N    | N    | N    | N    | N    |

## 失败用例

| caseId | Scenario | 错误类型 | 错误信息 |
|--------|----------|----------|----------|
| ...    | ...      | ...      | ...      |
```

**index.json**（写入 `{RUN_ARTIFACT_BASE}/index.json`）：
```json
{
  "runId": "<RUN_ID>",
  "resultPath": "<RUN_ARTIFACT_BASE>/result.json",
  "summaryPath": "<RUN_ARTIFACT_BASE>/summary.md",
  "generatedAt": "<ISO 8601>"
}
```

### 5.4 输出 exit code

- `0`：所有 Scenario 通过
- `1`：存在失败（failed > 0）
- `2`：环境不可用（baseUrl 不可达）或 early stop（maxFailures 触发）
- `3`：系统错误（子代理崩溃、文件写入失败等）

---

## 错误处理

- **目标地址不可达**：第一步做轻量 health check（GET 目标地址，超时 5 秒）；若不可达，立即停止并返回 exit code 2
- **子代理崩溃**：标记该 case 为 `error`，不影响其他 Runner，继续执行
- **用例语法错误**：跳过该 `.feature` 文件，记录警告，继续处理其余文件
- **产物目录创建失败**：立即停止，返回 exit code 3，提示用户检查文件系统权限

---

## 附录：可扩展执行器合成说明（T904）

当 `EXECUTOR_COMMAND` 为非内置执行器（非 `playwright-cli` / `bash-curl`）时，主模型合成指令包的翻译规则：

### 自定义 CLI 执行器

若 `EXECUTOR_COMMAND` 形如 `vitest run`、`jest --ci`、`playwright test` 等 CLI 工具：

- 翻译策略：**每个 Scenario 整体映射为一次 CLI 调用**（而非逐步骤翻译）
- 工具调用格式：`bash: {EXECUTOR_COMMAND} --testNamePattern="<scenarioTitle>" [其他参数]`
- 断言目标：CLI 退出码为 0（或根据 CLI 输出判断）
- 等待/交互：等待 CLI 进程完成（超时以 `EXECUTOR_CONFIG` 中描述的配置或默认 60 秒为准）

### MidScene 执行器

若 `EXECUTOR_COMMAND` 包含 `midscene` 关键字：

- 翻译策略：将 Gherkin 步骤翻译为 MidScene 的自然语言指令（`.ai()` 方法调用）
- 步骤格式示例：
  - `midscene: ai("在搜索框输入"耳机"并点击搜索按钮")`
  - `midscene: aiAssert("搜索结果列表已出现")`
- 断言目标：`aiAssert` 不抛出异常

### 扩展原则

- **主模型承担翻译责任**：无论何种执行器，主模型需将 Gherkin 自然语言翻译为该执行器可直接调用的具体指令
- **子代理照单调用**：子代理只需按 `工具调用` 字段执行，无需了解执行器类型
- **`run-config` 中声明**：用户在 `executor.command` 字段中声明使用的执行器，主模型据此选择翻译策略

---

## 附录：增强报告（T907）

> 以下为可选增强功能，在基础结果（result.json + summary.md）之外额外生成：

### HTML 报告（可选）

若用户在 `scenario-run-config.md` 中配置了 `report.html: true`，则额外生成：
- `{RUN_ARTIFACT_BASE}/report.html`：包含可折叠的用例列表、失败截图链接、耗时分布图

HTML 报告内容：
- 顶部：run 基本信息（run ID、环境、并发数、总耗时）
- 汇总统计：通过/失败/跳过的数量和百分比
- 失败用例详情：可展开查看步骤结果和错误描述
- 耗时分布：各 case 的耗时列表（从快到慢排序）

### 失败原因分类统计

在 `result.json` 的 `summary` 中追加：
```json
"failureBreakdown": {
  "assertion": <N>,
  "timeout": <N>,
  "environment": <N>,
  "tool-error": <N>
}
```

### 趋势分析（历史对比）

若 `{RUN_ARTIFACT_BASE}/../` 存在历史 run 目录（其他 `run-*` 子目录），可在 `summary.md` 末尾追加趋势信息：
```markdown
## 趋势（最近 5 次 run）

| Run ID | 总计 | 通过率 | 耗时 |
|--------|------|--------|------|
| ...    | ...  | ...%   | ...  |
```
