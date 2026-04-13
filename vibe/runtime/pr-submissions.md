# PR 提交状态 — agent-add README 推广

记录向上游 AI 资产仓库提交的 PR，每个 PR 都是在其 README 中加入 `agent-add` 一键安装说明。

执行任务：[`vibe/tasks/submit-pr-to-mcp-repos.md`](../tasks/submit-pr-to-mcp-repos.md)

## 已提交 PR（5 个，覆盖全部 5 种资产类型）

提交日期：2026-04-08

| # | Upstream | 资产类型 | PR | 状态 |
|---|----------|----------|----|------|
| 1 | microsoft/playwright-mcp | MCP | [#1532](https://github.com/microsoft/playwright-mcp/pull/1532) | ⚠ **需签 CLA** |
| 2 | mcollina/skills | Skill | [#29](https://github.com/mcollina/skills/pull/29) | 🟢 Open，无评论 |
| 3 | sanity-io/agent-toolkit | MCP + Skill | [#43](https://github.com/sanity-io/agent-toolkit/pull/43) | 🟢 Open，无评论 |
| 4 | PatrickJS/awesome-cursorrules | Prompt | [#240](https://github.com/PatrickJS/awesome-cursorrules/pull/240) | ⚠ **CodeRabbit 提了 2 处修改建议** |
| 5 | msitarzewski/agency-agents | Sub-agent | [#411](https://github.com/msitarzewski/agency-agents/pull/411) | 🟢 Open，无评论 |

所有 PR 标题均以 `docs: ...` 开头，描述简洁（500B-1KB），署名披露「I am the author of agent-add」。

## 待处理事项

### PR #1532 (microsoft/playwright-mcp) — 签署 CLA

`microsoft-github-policy-service` bot 评论要求签署 Microsoft Contributor License Agreement。处理方式：

在 PR 评论里回复：
```
@microsoft-github-policy-service agree
```

（如果不代表公司贡献，省略 `[company="..."]`。）签完后 CLA check 会自动转绿，PR 即可进入 review。

### PR #240 (PatrickJS/awesome-cursorrules) — CodeRabbit 评审

CodeRabbit bot 自动评审了 2 处问题（`#discussion_r3051530004` 和 `#discussion_r3051530014`）：

1. **🟡 Update the Table of Contents to match the renamed/added methods**
   - 改动新增 Method Two、把原 Method Two 改名为 Method Three，但 README `## Contents` 里的 TOC 没同步
   - 修复：在 `## Contents` 章节加上 Method Two / Three 的 anchor 链接

2. **🟡 New markdown link does not follow the repository's relative-link rule**
   - 仓库 contributing 规则要求 README 内所有链接为相对路径
   - 我们加的 `[agent-add](https://github.com/pea3nut/agent-get)` 是绝对外链
   - 修复方案：要么把 agent-add 链接改成脚注（footnote）形式声明为外部例外；要么在 PR 评论中说明 "agent-add 是外部仓库，必须用绝对链接"，请维护者确认

处理时一并 push 到 `pea3nut/awesome-cursorrules:add-agent-add-install` 分支即可（PR 会自动更新）。

## 已处理（2026-04-08 二次操作）

- ✅ **PR #1532**: 已在 PR 评论里回复 `@microsoft-github-policy-service agree`，CLA bot 应自动转绿
- ✅ **PR #240 (TOC)**: 推送了第二个 commit `a735bf8` —— 在 `## Contents` 里加上 `Method Two (cross-host via agent-add)` 和 `Method Three` 锚点；并在 CodeRabbit 的 TOC 评论线程下回复确认
- ✅ **PR #240 (链接规则)**: 在 CodeRabbit 的 link 评论线程下回复，说明 agent-add 是外部仓库链接，与 README 现有 `cursor.sh` / `marketplace.visualstudio.com` 等绝对外链一致；提议如维护者更倾向 footnote 风格也可调整

### PR #29 / #43 / #411 — 等待维护者 review

无 bot 评论、无 CI 失败，纯等待人工审核。一般 docs PR 周转 2-7 天，超过 2 周可考虑 ping。

## 第二轮巡检（2026-04-08 晚）

| PR | 关键发现 |
|----|---------|
| #1532 playwright-mcp | ✅ `license/cla — All CLA requirements met`；可干净合并；但首次贡献者 CI workflow 需维护者批准 |
| #240 awesome-cursorrules | ✅ CodeRabbit 复审通过「No actionable comments 🎉」；Pre-merge checks ✅ 3；3 commit，merge-ready |
| #29 mcollina/skills | 🟢 无冲突，无活动，纯等 review |
| #43 sanity-io/agent-toolkit | 🟢 Socket Security ✅ Success；显示 **1 workflow awaiting approval**，需 write-access reviewer 批准 |
| #411 msitarzewski/agency-agents | 🟢 2 commit，无冲突，无活动，纯等 review |

**共性瓶颈**：3 个仓库的 CI 卡在首次贡献者 workflow approval 安全策略，只能等维护者批准。所有 bot 交互、CLA、CodeRabbit 修复均已完结，无待处理人工操作。

## 已放弃目标

| Upstream | 原因 | 处理 |
|----------|------|------|
| wshobson/commands | 不适合（用户判断） | fork `pea3nut/wshobson-commands` 已通过 GitHub settings 删除 |

## 第三轮提交（2026-04-10，5 个 PR — 已作废）

提交日期：2026-04-10 | **状态：全部作废**

| # | Upstream | 资产类型 | PR | 状态 |
|---|----------|----------|----|------|
| 6 | antonbabenko/terraform-skill | Skill | [#10](https://github.com/antonbabenko/terraform-skill/pull/10) | ❌ 已关闭（emoji 乱码） |
| 7 | stickerdaniel/linkedin-mcp-server | MCP | [#340](https://github.com/stickerdaniel/linkedin-mcp-server/pull/340) | ❌ 已关闭（emoji 乱码） |
| 8 | chongdashu/unreal-mcp | MCP | [#49](https://github.com/chongdashu/unreal-mcp/pull/49) | ❌ 已关闭（emoji 乱码） |
| 9 | doobidoo/mcp-memory-service | MCP | [#674](https://github.com/doobidoo/mcp-memory-service/pull/674) | ❌ 已关闭（emoji 乱码） |
| 10 | atilaahmettaner/tradingview-mcp | MCP | [#19](https://github.com/atilaahmettaner/tradingview-mcp/pull/19) | ❌ 已关闭（emoji 乱码） |

**作废原因**：`atob()` 无法处理多字节 UTF-8 emoji，导致 README 中所有 emoji 变为乱码。且 PR 未经用户审核就被自动提交。详见踩坑 #15、#16。

## 第四轮提交（2026-04-10，4 个 PR 已提交）

提交日期：2026-04-10

| # | Upstream | 资产类型 | PR | 融入策略 | 状态 |
|---|----------|----------|----|---------|------|
| 6' | antonbabenko/terraform-skill | Skill | [#11](https://github.com/antonbabenko/terraform-skill/pull/11) | 并列新增 `### Any AI Host` 安装选项 | 🟢 Open |
| 7' | stickerdaniel/linkedin-mcp-server | MCP | [#343](https://github.com/stickerdaniel/linkedin-mcp-server/pull/343) | agent-add 作为首选，JSON 退为 "Manual Configuration" | 🟢 Open |
| 8' | chongdashu/unreal-mcp | MCP | [#50](https://github.com/chongdashu/unreal-mcp/pull/50) | 替换 MCP Configuration Locations 表格 | 🟢 Open |
| 9' | doobidoo/mcp-memory-service | MCP | [#679](https://github.com/doobidoo/mcp-memory-service/pull/679) | agent-add 作为首选，per-client details 退为 "Or configure manually" | 🟢 Open |

未提交：
| # | Upstream | 资产类型 | 状态 |
|---|----------|----------|------|
| 10' | atilaahmettaner/tradingview-mcp | MCP | ⏸ 用户未提交，PR 创建页仍在浏览器中 |

技术改进（相比第三轮）：
- 使用 `TextDecoder` + `Uint8Array.from(atob(b64), c => c.charCodeAt(0))` 替代 `atob()` 解码，修复 emoji 乱码
- 生成脚本中加入 emoji 数量校验（原文 vs 修改后）
- PR body 去掉了 "I am the author" 作者声明
- **深度融入现有文档**而非无脑新增章节 — 每个 repo 的修改策略根据其 README 结构定制
- 非 Node.js 项目加上 "Requires Node.js 18+" 提示
- JS template literal 中反斜杠被转义吃掉的问题：改用 `String.fromCharCode(92)` 或数组拼接避免
- **绝不点击 "Create pull request"**，停留在页面等待用户审核

## 第四轮修复（2026-04-10，URL + bot 回复）

**修复内容**：
- 4 个 PR 全部推送 `fix: correct repo URL (agent-get -> agent-add)` commit，修正仓库链接
- linkedin #343 额外修复 `### uvx Setup Help` 前缺少空行
- 本地 `package.json` 同步修正 `pea3nut/agent-get` → `pea3nut/agent-add`

**bot 评审回复**：
- ✅ linkedin #343 Greptile bot：回复确认两处问题已修复（URL + 空行）
- ✅ memory #679 Gemini Code Assist：回复解释单引号是 agent-add 标准写法，兼容 Unix/PowerShell/Git Bash

## 巡检记录

### 2026-04-10 巡检

| PR | mergeable | 评论 | 状态 |
|---|-----------|------|------|
| #11 terraform-skill | clean | 0 | 等待 review |
| #343 linkedin | clean | ✅ 已回复修复 | 等待 review |
| #50 unreal-mcp | unknown | 0 | 等待 review |
| #679 memory | unstable | ✅ 已回复修复 | CI 待通过 |
| #1532 playwright-mcp | unstable | CLA 已签 | 等维护者批准 CI |
| #29 skills | clean | 0 | 等 review（2天） |
| #43 agent-toolkit | unstable | 0 | 等 review（2天） |
| #240 cursorrules | clean | CodeRabbit 已通过 | 等 merge |
| #411 agency-agents | clean | 0 | 等 review（2天） |

### 2026-04-11 巡检

| PR | 状态 | 变化 |
|---|------|------|
| #11 terraform-skill | 🟢 Open, clean | 无活动 |
| #343 linkedin | 🟢 Open, clean | 无新活动 |
| #50 unreal-mcp | 🟢 Open, clean | 无活动 |
| #679 memory | 🟢 Open, unstable | 维护者 doobidoo 回复，要求按 Option B 重构 + 提供端到端测试报告，已回复确认 |
| #1532 playwright-mcp | ❌ **Closed** | 维护者无评论直接关闭，未 merge |
| #29 skills | 🟢 Open, clean | 无活动（3天） |
| #43 agent-toolkit | 🟢 Open, unstable | 无活动（3天） |
| #240 cursorrules | 🟢 Open, clean | 无活动（3天） |
| #411 agency-agents | 🟢 Open | 维护者 msitarzewski 回复：要求改为 additive Option 4 而非替换 Option 3 |

**待处理**：
- #679 memory：需按 Option B 重构 PR + 提供 agent-add × mcp-memory-service 端到端测试报告
- #411 agency-agents：需改为新增 Option 4，保留原有 Option 3

### 2026-04-12 修复

- ✅ #411 agency-agents：按维护者要求改为 additive Option 4

## 状态追踪

**待观察**：每个 PR 的 review / merge 结果。后续若被 merge，`agent-add` README 可以考虑加入 "Used by" / "As seen in" 章节引用这些上游仓库。

## 相关产物

- 任务文档：`vibe/tasks/submit-pr-to-mcp-repos.md`（末尾 10 条踩坑记录）
- 候选目标清单：`vibe/runtime/pr-targets.md`
- 浏览器会话：`playwright-cli -s=pr-task`（本次执行所用）
- 临时脚本 / README / PR body 文件：`.playwright-cli/` 目录下（`readme*.md`、`pr*.md`、`fill*.js`、`fb*.js`、`gen-script2.js`、`gen-fill-body.js`）
