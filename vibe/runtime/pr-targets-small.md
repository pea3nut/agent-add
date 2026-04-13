# PR Targets（小型仓库）— 100~2000 ⭐，个人维护

向以下 20 个项目发 PR，在其文档中添加 `agent-add` 一键安装命令。
筛选标准：⭐ 100–2000、个人（User）维护、README 有安装指引、agent-add 可简化流程。

> 数据采集时间：2026-04-09
>
> 「JSON 配置块」= README 中 `"mcpServers"` / `"command"` 等 JSON 配置代码块数量，越多说明 agent-add 替代价值越大

---

## MCP — MCP 服务器（15 个）

| # | 项目 | ⭐ | 领域 | 一句话介绍 | JSON 配置块 | PR 思路 |
|---|------|-----|------|-----------|------------|---------|
| 1 | [chongdashu/unreal-mcp](https://github.com/chongdashu/unreal-mcp) | 1725 | 游戏引擎 | AI 控制 Unreal Engine 编辑器（Cursor/Windsurf/Claude Desktop） | 6 | 在多宿主配置区前加 agent-add 一行命令 |
| 2 | [punitarani/fli](https://github.com/punitarani/fli) | 1694 | 出行 | Google Flights MCP + Python 库 | 6 | 在 Claude Desktop / Cursor 配置块前加 agent-add |
| 3 | [doobidoo/mcp-memory-service](https://github.com/doobidoo/mcp-memory-service) | 1630 | Agent 基础设施 | 多 Agent 管线持久化共享记忆层 | 5 | 在 Installation 区加 agent-add 快捷方式 |
| 4 | [atilaahmettaner/tradingview-mcp](https://github.com/atilaahmettaner/tradingview-mcp) | 1368 | 金融 | AI 交易分析（回测 + 情绪 + 30 技术指标） | 4 | 在 Configuration 区前插入 agent-add |
| 5 | [stickerdaniel/linkedin-mcp-server](https://github.com/stickerdaniel/linkedin-mcp-server) | 1314 | 社交 | 开源 LinkedIn MCP（搜索 / 浏览个人资料） | 6 | 多宿主配置区用 agent-add 统一 |
| 6 | [iFurySt/RedNote-MCP](https://github.com/iFurySt/RedNote-MCP) | 1035 | 社交 | 小红书内容搜索与获取 MCP 服务器 | 4 | 在配置示例前加 npx agent-add |
| 7 | [xing5/mcp-google-sheets](https://github.com/xing5/mcp-google-sheets) | 797 | 办公 | Google Drive + Sheets AI 集成 | **22** | README 配置块最多，agent-add 价值最大 |
| 8 | [samuelgursky/davinci-resolve-mcp](https://github.com/samuelgursky/davinci-resolve-mcp) | 772 | 视频 | DaVinci Resolve 视频编辑 MCP | 6 | 在宿主配置矩阵前插 agent-add |
| 9 | [cyberkaida/reverse-engineering-assistant](https://github.com/cyberkaida/reverse-engineering-assistant) | 685 | 安全 | Ghidra 逆向工程 MCP 服务器 | — | 在 Setup 区加 agent-add |
| 10 | [rusiaaman/wcgw](https://github.com/rusiaaman/wcgw) | 655 | 开发工具 | Shell + 编码 Agent（MCP 模式） | — | 在 MCP 配置示例旁加 agent-add |
| 11 | [AminForou/mcp-gsc](https://github.com/AminForou/mcp-gsc) | 643 | SEO | Google Search Console AI 洞察 | 8 | 多宿主 JSON 块可用 agent-add 替代 |
| 12 | [ihor-sokoliuk/mcp-searxng](https://github.com/ihor-sokoliuk/mcp-searxng) | 621 | 搜索 | SearXNG 隐私搜索 MCP 服务器 | **11** | 大量配置块，agent-add 简化显著 |
| 13 | [cookjohn/zotero-mcp](https://github.com/cookjohn/zotero-mcp) | 602 | 学术 | Zotero 文献管理 AI 集成 | — | 在 Installation 区加 agent-add |
| 14 | [cohnen/mcp-google-ads](https://github.com/cohnen/mcp-google-ads) | 532 | 广告 | Google Ads + Claude AI 数据分析 | **12** | 大量 JSON 配置块，agent-add 价值高 |
| 15 | [hustcc/mcp-mermaid](https://github.com/hustcc/mcp-mermaid) | 511 | 图表 | AI 动态生成 Mermaid 图表 | — | 在配置示例旁加 agent-add |

---

## Skill — Agent 技能（3 个）

| # | 项目 | ⭐ | 领域 | 一句话介绍 | PR 思路 |
|---|------|-----|------|-----------|---------|
| 16 | [antonbabenko/terraform-skill](https://github.com/antonbabenko/terraform-skill) | 1504 | DevOps | Terraform / OpenTofu Claude Agent Skill | 在 Installation 区加 `agent-add --skill` |
| 17 | [ljagiello/ctf-skills](https://github.com/ljagiello/ctf-skills) | 1240 | 安全 | CTF 挑战 Agent 技能（Web / Pwn / Crypto / RE） | 在 Setup 区加 `agent-add --skill` |
| 18 | [mbeijen/andrej-karpathy-skills-cursor-vscode](https://github.com/mbeijen/andrej-karpathy-skills-cursor-vscode) | 167 | AI/ML | Andrej Karpathy 编码风格技能 | 在 README 加 agent-add 跨宿主安装命令 |

---

## Sub-agent / Prompt（2 个）

| # | 项目 | ⭐ | 领域 | 一句话介绍 | PR 思路 |
|---|------|-----|------|-----------|---------|
| 19 | [lst97/claude-code-sub-agents](https://github.com/lst97/claude-code-sub-agents) | 1524 | 全栈开发 | 33 个全栈开发子代理（cp 安装） | 在 Install 区加 `agent-add --sub-agent` |
| 20 | [matank001/cursor-security-rules](https://github.com/matank001/cursor-security-rules) | 370 | 安全 | Cursor 安全规则（AI Agent + 代码安全） | 在 Setup 区加 `agent-add --prompt` |

---

## 优先级排序

### 第一梯队（价值最高，JSON 配置块多，agent-add 替代效果直观）
1. **xing5/mcp-google-sheets** — 22 个 JSON 配置块，agent-add 一行替代效果震撼
2. **cohnen/mcp-google-ads** — 12 个配置块
3. **ihor-sokoliuk/mcp-searxng** — 11 个配置块
4. **AminForou/mcp-gsc** — 8 个配置块

### 第二梯队（⭐ 高，影响力大）
5. **chongdashu/unreal-mcp** — 1725⭐，游戏引擎社区活跃
6. **punitarani/fli** — 1694⭐，热门出行工具
7. **doobidoo/mcp-memory-service** — 1630⭐，Agent 基础设施
8. **lst97/claude-code-sub-agents** — 1524⭐，Sub-agent 头部仓库
9. **antonbabenko/terraform-skill** — 1504⭐，DevOps 社区有影响力

### 第三梯队（领域多样化，补充覆盖面）
10-20. 其余仓库按兴趣/精力选择

## 与已有 PR 的关系

已提交的 5 个 PR（playwright-mcp #1532、awesome-cursorrules #240、mcollina/skills #29、sanity-io/agent-toolkit #43、agency-agents #411）均为大仓库（2k+ ⭐）或企业维护。本列表专注小型个人仓库，合入概率更高、沟通更灵活。
