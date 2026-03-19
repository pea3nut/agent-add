---
name: scenario-test-case
description: 管理 Gherkin 测试用例资产。触发场景：添加新测试用例、更新已有用例、列出/过滤用例、读取用例内容、去重校验、查询 Gherkin 写法规范。所有用例以 .feature 文件形式存储，AI 直接读写文件系统。
user-invocable: false
---

# Skill: scenario-test-case

以 Gherkin `.feature` 文件管理测试用例资产。所有操作均直接操作文件系统，无代码依赖。

## 目录约定

**测试目录（`testDir`）推断规则**（按优先级）：
1. 检查用户项目根目录的 `scenario-run-config.md` 中是否有 `testDir` 字段
2. 嗅探项目根目录下的 `tests/`、`e2e/`、`test/` 目录（按此顺序，取第一个存在的）
3. 以上均不存在则兜底使用 `tests/`

**用例存储路径**：`{testDir}/features/`（兜底：`tests/features/`）

**推荐目录结构**：
```
{testDir}/features/
└── <domain>/
    ├── ui/          # UI 场景（由 Playwright MCP 执行）
    ├── api/         # API 场景（由 Bash curl 执行）
    └── *.feature    # 混合或通用场景
```

## 能力说明

### add_case — 添加测试用例

**触发**：用户提供 Gherkin 文本，要求添加到用例库。

**执行步骤**：
1. 确定目标路径：
   - 若用户指定了路径（`path` 参数），使用该路径（相对于 `{testDir}/features/`）
   - 若未指定，根据用例内容推断：UI 相关放 `ui/`，API 相关放 `api/`，混合放根目录
   - 文件名用 kebab-case，如 `search-product.feature`
2. **去重检查**：扫描 `{testDir}/features/` 下所有 `.feature` 文件，检查是否已存在同路径同 Scenario 名称的用例（强去重）
   - 若已存在：提示用户，询问是否覆盖更新，若是则执行 update_case
   - 若不存在：直接创建文件
3. 写入 `.feature` 文件，确保：
   - 文件以 `Feature:` 开头
   - 每个 Scenario 有清晰的 Given/When/Then 步骤
   - 合理添加 tags（至少 `@P0` 或 `@P1` 优先级 tag）
4. 告知用户文件写入路径

**示例（T706）**：
```gherkin
Feature: 商品搜索

  @P0 @web
  Scenario: 搜索存在的商品
    Given 用户已登录商品平台
    When 用户在搜索框输入 "耳机"
    Then 搜索结果列表中显示至少 1 条商品记录

  @P0 @api
  Scenario: 搜索接口返回商品列表
    Given 商品搜索接口 GET /api/products/search 可访问
    When 请求参数包含 keyword="耳机"
    Then 响应状态码为 200
    And 响应体的 data.list 数组长度大于 0
```

---

### update_case — 更新测试用例

**触发**：用户要求修改已有用例内容。

**执行步骤**：
1. 定位目标文件：
   - 若用户提供了路径，直接定位
   - 若提供了 Scenario 名称，在 `{testDir}/features/` 下递归搜索匹配的 Scenario
2. 读取原文件内容
3. 在文件中找到目标 Scenario（按名称匹配），用新内容替换该 Scenario 块
   - 若目标是整个 Feature 文件，则替换整个文件
   - 若只更新某个 Scenario，保留文件中其他 Scenario 不变
4. 写回文件
5. 报告变更内容（diff 形式）

**去重规则（更新时）**：
- 同一路径、同一 Scenario 名称：覆盖更新（不创建副本）
- 不同路径、相同 Scenario 名称：视为独立用例，不自动合并（提示用户注意潜在重复）

**弱去重策略（T905）**：

当强去重（路径+名称完全匹配）未命中时，执行弱去重检测，以避免语义重复的用例：

1. **Canonical Hash 计算**：对每个 Scenario 计算规范化哈希
   - 步骤：去除多余空白 → 将步骤关键字（Given/When/Then/And/But）统一转为小写 → 对 Scenario 标题和每个步骤文本分别 trim → 拼接后取哈希前 8 位
   - 示例：`"搜索存在的商品"` + `"given 用户已登录商品平台"` + `"when 用户在搜索框输入"` + `"then 搜索结果显示"` → 哈希 `a3f9d2b1`

2. **弱重复检测**：若 canonical hash 与已有用例相同，但路径或名称不同：
   - 提示用户检测到疑似重复用例，展示两者的差异
   - 询问用户：覆盖原有用例 / 保留为新用例 / 生成冲突文件
   - 若用户选择生成冲突文件：将新用例保存为 `<原文件名>.conflict.feature`，不修改原文件

---

### list_cases — 列出测试用例

**触发**：用户要求查看、搜索、过滤用例。

**执行步骤**：
1. 递归扫描 `{testDir}/features/` 下所有 `.feature` 文件
2. **识别和提取 Scenario tags（T704）**：
   - 每个 `.feature` 文件中，tags 行紧接在 `Scenario:` 关键字的前一行，以 `@` 开头，多个 tag 用空格分隔
   - 示例：`  @P0 @web @smoke` → tags 为 `["@P0", "@web", "@smoke"]`
   - Feature 级别的 tags（在 `Feature:` 前）会被所有 Scenario 继承
   - 提取时注意缩进，tags 行通常有 2 空格缩进
3. 按过滤条件筛选：
   - **按目录**：只返回指定子目录下的用例
   - **按 tags**：支持 `@P0`、`@P0 and @web`、`@P0 or @api`、`not @skip` 等语法
   - **按关键字**：在 Feature 名称和 Scenario 名称中搜索关键字
4. 以表格或列表形式输出结果：
   - 文件路径、Feature 名称、Scenario 名称、tags、最后修改时间

**tags 过滤语法**：
- `@P0`：仅含此 tag
- `@P0 and @web`：同时含两个 tag（AND）
- `@P0 or @api`：含其中任一 tag（OR）
- `not @skip`：不含此 tag（NOT）
- 组合：`@P0 and (@web or @api)`

---

### get_case — 读取单个用例

**触发**：用户要求查看某个用例的完整内容。

**执行步骤**：
1. 定位文件：
   - 若提供路径，直接读取
   - 若提供 Scenario 名称，在 `{testDir}/features/` 下递归搜索
2. 以代码块形式展示 `.feature` 文件内容
3. 同时展示：文件路径、tags、步骤数量

---

### explain_how_to_write — 用例编写规范说明

**触发**：用户不熟悉 Gherkin、询问用例写法、需要示例。

**输出以下内容**：

#### Gherkin 基础语法

遵循 [Cucumber Gherkin 官方规范](https://cucumber.io/docs/gherkin/)。

**文件结构**：
```gherkin
Feature: 功能模块名称（简短描述）

  Background:                     # 可选：每个 Scenario 的公共前置条件
    Given 用户已登录系统

  @P0 @web                        # Tags：优先级 + 分类
  Scenario: 场景描述（描述行为，不写实现细节）
    Given 前置条件（系统当前状态）
    When 用户执行的操作（单一动作）
    Then 期望的可观测结果（断言）
    And 附加结果（可选，继续 Then 的逻辑）
    But 例外情况（可选，表示 NOT）
```

**编写原则**：
- **一个 Scenario 只测一件事**，步骤数建议 3-7 步
- **Given**：描述系统初始状态，不是用户操作
- **When**：描述用户触发的单一行为
- **Then**：描述可观测的断言结果（UI 变化、API 响应等）
- **步骤描述要具体**，例如用 `"耳机"` 而非 `有效关键词`

**Tags 约定**：
- 优先级：`@P0`（必测）、`@P1`（高频）、`@P2`（扩展）
- 类型：`@web`（UI）、`@api`（接口）、`@smoke`（冒烟）
- 状态：`@skip`（暂跳过）、`@flaky`（不稳定）

**完整示例**：
```gherkin
Feature: 用户登录

  @P0 @web @smoke
  Scenario: 正确账号密码登录成功
    Given 用户在登录页面
    When 用户输入正确的账号 "test@example.com" 和密码 "password123"
    And 用户点击登录按钮
    Then 页面跳转到首页
    And 顶部导航栏显示用户头像

  @P0 @web
  Scenario: 错误密码登录失败提示
    Given 用户在登录页面
    When 用户输入账号 "test@example.com" 和错误密码 "wrong"
    And 用户点击登录按钮
    Then 页面显示错误提示 "密码错误"
    And 页面停留在登录页

  @P1 @api
  Scenario: 登录接口返回正确 Token
    Given 登录接口 POST /api/auth/login 可访问
    When 请求体包含正确的 username 和 password
    Then 响应状态码为 200
    And 响应体包含 token 字段
```

**官方文档**：https://cucumber.io/docs/gherkin/
