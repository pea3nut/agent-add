# MixedCase 指令包格式模板

> **此文件仅供 `/tns:exec-scenarios` 主模型参照使用，不暴露给用户，用户无需填写或修改。**
>
> 主模型合成 MixedCase 指令包时，必须按此格式填充所有字段，确保 `scenario-case-runner` 子代理能够直接照单调用工具，无需任何推断。
>
> **关键要求**：
> - 所有字段必须为具体值，**禁止出现 `{变量}` 占位符**
> - **指令包不含任何文件路径**（不含产物路径、结果路径等），子代理不写任何文件
> - 每个步骤的工具调用指令必须具体到"喂嘴里"的程度——包含工具名、参数、等待逻辑、断言目标，**不是** Gherkin 原文的直接翻译
> - 子代理收到此包后直接调用工具并以**文字形式**回报每步结果

---

## 指令包格式

```
=== MixedCase 指令包 ===

[基本信息]
caseId: <由主模型生成的稳定唯一标识，基于 featurePath + scenarioTitle 的哈希，如 case-a3f2b1>
scenarioTitle: <Scenario 标题原文，如 "搜索存在的商品">

[执行环境]
executor: <执行器命令的具体值，如 playwright-cli | bash-curl | vitest run --reporter=json>
<主模型从 run-config 的 executor.config 自由文字中理解并提取环境信息，转化为具体值填写在此，例如：>
baseUrl: <从 executor.config 中提取的目标地址，如 https://platform-boe.example.com（若执行器不需要则省略）>
authHeader: <从 executor.config 中提取的认证 header，如 "Bearer eyJ..." | "none"（若执行器不需要则省略）>
<其他执行器特有参数，按实际需要添加，主模型自行判断提取什么信息对子代理执行有用>

[环境 Setup]
说明: 在执行测试步骤之前，子代理须先完成此节所有操作，为本 Runner 创建与其他并发 Runner 完全隔离的执行环境。
      若 Setup 中任意步骤失败，立即停止（不进入 [执行步骤]），但仍须执行 [环境 Teardown]。
      ⚠️ 使用 playwright-cli 时，session 名称直接使用 caseId（已在 [基本信息] 声明），无需捕获，Teardown 直接引用即可。

setup-1:
  工具调用: <创建隔离环境的具体工具调用，例如:
    - playwright-cli: bash: playwright-cli -s=<caseId> open（为本 Runner 创建独立 session，进程级隔离，不与其他 Runner 共享浏览器状态）
    - bash: mktemp -d /tmp/scenario-XXXXXX（为 CLI 工具创建隔离临时目录，命令输出即为目录路径）
    - 无需隔离时填写 "无">
  等待/交互: <等待环境就绪，例如: 等待 playwright-cli session 启动完成（exit code 0）| 无>
  断言目标: <环境就绪的可观测标志，例如: playwright-cli 命令退出码为 0，session 已就绪 | 临时目录路径非空 | 无>
  捕获输出: <从本步骤工具调用的返回值中提取的资源标识，存入命名变量供 Teardown 引用，例如:
    - playwright-cli 方案: 无（session 名称 = caseId，已知，无需捕获）
    - SETUP_TMPDIR: mktemp 输出的目录路径（用于 Teardown 精确删除该目录）
    - 无需捕获时填写 "无">

<若需要多个 Setup 步骤，按 setup-2、setup-3 继续追加>

[执行步骤]
以下步骤已将 Gherkin 展开为可直接执行的工具调用序列。
每步骤包含：工具调用指令（具体工具名+参数）+ 等待/重试逻辑 + 断言目标。
子代理按序号逐步执行，某步断言失败时立即停止并告知失败原因。

步骤 1:
  工具调用: <具体的工具调用，如:
    - bash: playwright-cli -s=<caseId> goto https://platform-boe.example.com（playwright-cli 导航到目标页面）
    - bash: playwright-cli -s=<caseId> snapshot（获取页面快照，了解当前元素和 ref）
    - bash: playwright-cli -s=<caseId> click <ref>（通过 snapshot 获取的 ref 精确点击元素）
    - bash: curl -X POST https://api.example.com/login -H "Content-Type: application/json" -d '{"user":"alice"}'
    - bash: vitest run tests/login.spec.ts --reporter=json>
  等待/交互: <如有需要，如: snapshot 输出中出现目标元素（最多重试 3 次）| 无>
  断言目标: <期望的可观测结果，如: 页面 URL 变为 /dashboard，snapshot 中可见导航栏 | 响应状态码为 200，body.token 字段非空>

步骤 2:
  工具调用: <具体工具调用>
  等待/交互: <等待/滚动/重试说明 | 无>
  断言目标: <期望结果>

步骤 N:
  工具调用: <具体工具调用>
  等待/交互: <等待/滚动/重试说明 | 无>
  断言目标: <期望结果>

[环境 Teardown]
说明: 子代理必须保证本节在任何情况下都执行，相当于强制 try/finally 中的 finally 块。
      ⚠️ 子代理在 Teardown 全部完成前不得退出，任何错误都是暂停，不是终止。

[Teardown 执行情况表——子代理必须覆盖全部 4 种情况]

| 情况 | 前阶段结果 | Teardown 行为 | 最终回报状态 |
|------|-----------|--------------|-------------|
| ① 正常通过 | Setup 全部成功 → 执行步骤全部通过 | 执行全部 Teardown 步骤 | passed |
| ② 执行步骤失败 | Setup 全部成功 → 某执行步骤失败（后续步骤跳过） | 执行全部 Teardown 步骤（不跳过） | failed |
| ③ Setup 失败 | 某 Setup 步骤失败（后续 Setup 步骤跳过，执行步骤不执行） | 仅执行**已成功 Setup 步骤**对应的 Teardown；未执行的 Setup 步骤的资源无需清理 | error（setup-failed） |
| ④ Teardown 自身失败 | 任意情况 | 记录该步骤为 teardown-warning，**继续执行剩余 Teardown 步骤**（不中断） | 沿用上方状态，不降级 |

      ⚠️ playwright-cli 方案：直接用 `playwright-cli -s=<caseId> close` 精确关闭本 Runner 的 session，无需捕获变量。

teardown-1:
  依赖捕获: <引用 Setup 步骤捕获的变量名，例如:
    - playwright-cli 方案: 无（session 名称 = caseId，直接引用，无需额外捕获变量）
    - SETUP_TMPDIR（bash: rm -rf 需要此路径精确删除 Setup 创建的目录）
    - 无依赖时填写 "无">
  工具调用: <精确清理 Setup 所创建资源的工具调用，例如:
    - bash: playwright-cli -s=<caseId> close（精确关闭本 Runner 的 session，不影响其他 Runner 的 session）
    - bash: rm -rf "<SETUP_TMPDIR 的值>"（精确删除 Setup 创建的临时目录）
    - 无需清理时填写 "无"
    ⚠️ 禁止写 playwright-cli close-all 等影响其他 Runner 的模糊指令>
  等待/交互: <等待清理完成 | 无>
  断言目标: <清理完成的可观测标志（可选，失败仅记录警告）>

<若需要多个 Teardown 步骤，按 teardown-2、teardown-3 继续追加>
=== 指令包结束 ===
```

---

## 步骤展开原则（主模型必须遵守）

Gherkin 步骤通常是高层抽象，主模型在展开时需要考虑以下细节：

### 并发隔离原则（通过 Setup/Teardown 实现）

每个 MixedCase 必须通过 `[环境 Setup]` 和 `[环境 Teardown]` 声明隔离边界，确保并发 Runner 互不干扰：

| 执行器 | Setup 注入内容 | 捕获输出 | Teardown 注入内容 |
|---|---|---|---|
| `playwright-cli` | `playwright-cli -s=<caseId> open [url]` | **无**（session 名称 = caseId，已知） | `playwright-cli -s=<caseId> close`（精确关闭本 Runner session） |
| `bash-curl` | 无（`curl` 天然无状态） | 无 | 无 |
| 自定义 CLI（如 `vitest`） | `mktemp -d /tmp/scenario-${caseId}-XXXXXX` | `SETUP_TMPDIR` ← mktemp 输出路径 | `rm -rf "<SETUP_TMPDIR>"`（精确删除，不影响其他目录） |

> **关键约束**：Teardown 禁止写 `playwright-cli close-all`、"清理 /tmp" 等影响其他 Runner 的模糊指令。`playwright-cli` 即使 `concurrency = 1` 也必须注入 Setup/Teardown。

### playwright-cli 步骤展开要点

`playwright-cli` 通过 bash 命令调用，所有命令带 `-s=<caseId>` 参数操作当前 Runner 的独立 session：

| Gherkin 动词场景 | 展开后需包含 |
|---|---|
| 导航到某页面 | `playwright-cli -s=<caseId> goto <url>` |
| 检查页面现状（交互前必做） | `playwright-cli -s=<caseId> snapshot`（获取元素列表和 ref） |
| 点击某按钮/链接 | 先 `snapshot` 获取 ref → `playwright-cli -s=<caseId> click <ref>` |
| 输入文字 | 先 `snapshot` 获取输入框 ref → `playwright-cli -s=<caseId> fill <ref> "<text>"` |
| 等待某元素出现 | 重试 `snapshot`，检查输出中目标 ref 是否出现（最多 N 次，间隔 1s） |
| 验证页面文字/元素 | `snapshot` 并断言输出文字包含期望内容 |
| 加载 SSO 登录态 | `playwright-cli -s=<caseId> open --config=<storage-state-path>.json` 或 `state-load` |

### bash 步骤展开要点

| Gherkin 动词场景 | 展开后需包含 |
|---|---|
| 调用某接口 | 完整 curl 命令（包含 -X method、-H headers 含 auth、-d body） |
| 验证响应字段 | 用 `jq` 解析响应 JSON + 断言字段值 |
| 运行测试套件 | 完整 CLI 命令 + 期望的 exit code |

---

## 填充示例

```
=== MixedCase 指令包 ===

[基本信息]
caseId: case-7f3a2c
scenarioTitle: 搜索存在的商品

[执行环境]
executor: playwright-cli
baseUrl: https://platform-boe.example.com
storageStatePath: .cursor/skills/sso-auth/playwright-storage-state.json

[环境 Setup]
说明: 启动独立 session（-s=case-7f3a2c），确保本 Runner 与其他并发 Runner 完全进程隔离，各自拥有独立浏览器进程和 cookie/storage。

setup-1:
  工具调用: bash: playwright-cli -s=case-7f3a2c open https://platform-boe.example.com
  等待/交互: 等待 playwright-cli 命令退出（exit code 0）
  断言目标: 命令成功退出，session case-7f3a2c 已创建并打开了目标页面
  捕获输出: 无（session 名称 = caseId "case-7f3a2c"，已知，无需捕获）

[执行步骤]

步骤 1:
  工具调用: bash: playwright-cli -s=case-7f3a2c snapshot（获取当前页面快照，确认导航成功并取得元素 ref）
  等待/交互: 若快照中未出现导航栏，等待 1s 后重试 snapshot 一次
  断言目标: 快照输出中包含平台导航栏文字或页面标题，URL 为 platform-boe.example.com

步骤 2:
  工具调用: bash: playwright-cli -s=case-7f3a2c snapshot（确认搜索框的 ref，例如 e23）→ bash: playwright-cli -s=case-7f3a2c fill e23 "耳机" → bash: playwright-cli -s=case-7f3a2c press Enter
  等待/交互: 按下 Enter 后等待约 2s，再执行 snapshot 确认搜索结果加载
  断言目标: snapshot 输出中包含 "耳机" 相关商品名称文字

步骤 3:
  工具调用: bash: playwright-cli -s=case-7f3a2c snapshot（获取搜索结果列表快照）
  等待/交互: 若结果列表为空，等待 1s 后重试 snapshot 一次
  断言目标: 快照输出中包含商品条目，数量 >= 1

[环境 Teardown]
说明: 无论测试是否通过，关闭 session case-7f3a2c，释放浏览器进程资源，避免进程积累影响后续运行。

teardown-1:
  依赖捕获: 无（session 名称 = caseId "case-7f3a2c"，直接引用）
  工具调用: bash: playwright-cli -s=case-7f3a2c close
  等待/交互: 无
  断言目标: playwright-cli 命令退出码为 0，session 已关闭（失败仅记录警告）
=== 指令包结束 ===
```
