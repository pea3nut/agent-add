# PR Targets — agent-add 安装命令推广

向以下项目发 PR，在其文档中添加 `agent-add` 一键安装命令。按 AI 资产类型分类，按推荐指数降序排列。

> 数据采集时间：2026-04-04，star 数为近似值，推荐指数已根据各项目 README 实际安装方式校准
>
> ⚠ = 项目有自定义安装器，agent-add 无法完全平替，推荐指数已降低

---

## MCP — MCP 服务器

| # | 项目名称 | Stars | 类别 | 一句话介绍 | GitHub 链接 | 推荐指数 | 安装方式备注 |
|---|---------|-------|------|-----------|------------|---------|------------|
| 1 | Playwright MCP | ~30k | 浏览器自动化 | 微软官方 Playwright 浏览器自动化 MCP 服务器 | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | ★★★★★ | npx JSON 配置 |
| 2 | GitHub MCP Server | ~28k | 开发工具 | GitHub 官方 MCP 服务器，AI 直接操作 Repo/Issue/PR | [github/github-mcp-server](https://github.com/github/github-mcp-server) | ★★★★★ | 远程 URL 或 Docker JSON 配置 |
| 3 | Figma Context MCP | ~14k | 设计 | 让 AI 编码助手直接读取 Figma 设计稿数据 | [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) | ★★★★★ | npx JSON 配置 |
| 4 | Git MCP | ~7.8k | 开发工具 | 连接任意 GitHub 仓库文档的通用远程 MCP 服务器 | [idosal/git-mcp](https://github.com/idosal/git-mcp) | ★★★★★ | 远程 URL JSON 配置 |
| 5 | mcp-playwright | ~5.3k | 浏览器自动化 | 基于 Playwright 的浏览器自动化与网页抓取 | [executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright) | ★★★★★ | npx JSON 配置 |
| 6 | Cloudflare MCP | ~3.6k | 云平台 | 管理 Cloudflare Workers/KV/R2/D1 等服务 | [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare) | ★★★★★ | 远程 URL JSON 配置 |
| 7 | Excel MCP Server | ~3.6k | 办公工具 | Excel 工作簿创建、数据操作、格式化与图表 | [haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server) | ★★★★★ | uvx JSON 配置 |
| 8 | Supabase MCP | ~2.6k | 数据库 | 官方 Supabase MCP 服务器，连接 AI 与 Postgres | [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp) | ★★★★★ | 远程 HTTP URL 配置（OAuth） |
| 9 | Notion MCP | ~2.5k | 生产力 | AI 驱动的 Notion 数据读写与知识库管理 | [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) | ★★★★★ | npx JSON 配置 |
| 10 | Sentry MCP | ~1.6k | 监控 | 生产环境错误追踪 MCP 服务器 | [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp) | ★★★★★ | npx JSON 配置 |
| 11 | Stripe Agent Toolkit | ~1.4k | 支付 | Stripe 支付 API 的 MCP 服务器与 Agent 工具包 | [stripe/agent-toolkit](https://github.com/stripe/agent-toolkit) | ★★★★★ | 远程 URL 或 npx JSON 配置 |
| 12 | DuckDuckGo MCP | ~3.1k | 搜索 | 免 API Key 的网页搜索 MCP 服务器 | [nickclyde/duckduckgo-mcp-server](https://github.com/nickclyde/duckduckgo-mcp-server) | ★★★★ | uvx JSON 配置 |
| 13 | Godot MCP | ~2.6k | 游戏引擎 | 与 Godot 游戏引擎交互，编辑/运行/调试项目 | [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp) | ★★★★ | npx JSON 配置 |
| 14 | Firecrawl MCP | ~2.5k | 网页抓取 | 强大的网页抓取，处理 JS 渲染与反爬 | [firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server) | ★★★★ | npx JSON 配置 |
| 15 | Linear MCP | ~1.8k | 项目管理 | Sprint 规划与 Issue 追踪 MCP 服务器 | [jerhadf/linear-mcp-server](https://github.com/jerhadf/linear-mcp-server) | ★★★★ | npx JSON 配置 |
| 16 | MySQL MCP | ~1.4k | 数据库 | MySQL 数据库集成与配置化访问控制 | [benborla/mcp-server-mysql](https://github.com/benborla/mcp-server-mysql) | ★★★★ | npx JSON 配置 |
| 17 | Google Calendar MCP | ~1.1k | 生产力 | 日程管理与事件创建 MCP 服务器 | [nspady/google-calendar-mcp](https://github.com/nspady/google-calendar-mcp) | ★★★★ | npx JSON 配置（OAuth 运行时处理） |
| 18 | Browserbase MCP | ~824 | 浏览器自动化 | 云端浏览器自动化，网页导航与数据提取 | [browserbase/mcp-server-browserbase](https://github.com/browserbase/mcp-server-browserbase) | ★★★★ | 远程 URL 或 npx JSON 配置 |
| 19 | DesktopCommanderMCP | ~5.8k | 系统工具 | 给 AI 提供终端控制、文件搜索和 diff 编辑能力 | [wonderwhy-er/DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP) | ★★★ | ⚠ 推荐 `npx setup` 命令做额外配置，但也支持手动 JSON 配置 |
| 20 | Blender MCP | ~16k | 3D/设计 | 通过 MCP 让 AI 控制 Blender 进行 3D 建模 | [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) | ★★★ | ⚠ 需手动安装 Blender 插件（addon.py）+ uv，JSON 配置仅最后一步 |
| 21 | JetBrains MCP | ~950 | IDE | 连接 AI 助手到 JetBrains IDE | [JetBrains/mcp-jetbrains](https://github.com/JetBrains/mcp-jetbrains) | ★★★ | ⚠ JSON 配置标准，但还需从 JetBrains 市场额外安装 IDE 插件 |
| 22 | Neo4j MCP | ~920 | 数据库 | Neo4j 图数据库查询与知识图谱管理 | [neo4j-contrib/mcp-neo4j](https://github.com/neo4j-contrib/mcp-neo4j) | ★★★ | ⚠ uvx 配置标准，但需 Neo4j APOC 插件预装 |
| 23 | Neon Postgres MCP | ~700 | 数据库 | Neon Serverless Postgres 数据库创建与管理 | [neondatabase/mcp-server-neon](https://github.com/neondatabase/mcp-server-neon) | ★★★ | ⚠ 推荐 `neonctl init` 做 OAuth + 自动配置，但有手动 JSON 路径 |
| 24 | Redis MCP | ~460 | 数据库 | Redis 官方 MCP 服务器，管理与搜索 Redis 数据 | [redis/mcp-redis](https://github.com/redis/mcp-redis) | ★★★ | ⚠ 需先 pip/uvx 安装，再写 JSON 配置 |
| 25 | BioMCP | ~470 | 生物医学 | 接入 PubMed/ClinicalTrials 的生物医学研究 MCP | [genomoncology/biomcp](https://github.com/genomoncology/biomcp) | ★★★ | ⚠ 需先安装 biomcp-cli（pip/curl），再写 JSON 配置 |
| 26 | MetaMCP | ~2.2k | 基础设施 | 统一中间件 MCP 服务器，GUI 管理多连接 | [metatool-ai/metamcp](https://github.com/metatool-ai/metamcp) | ★★ | ⚠ 需 Docker Compose 部署后端 + PostgreSQL，非标准 MCP 安装 |
| 27 | Docker MCP | ~1.1k | DevOps | 通过自然语言管理容器和 Compose 编排 | [docker/docker-mcp](https://github.com/docker/docker-mcp) | ★★ | ⚠ 需编译 Go 二进制 + 安装 CLI 插件 + catalog/profile 管理系统 |
| 28 | MCP Gateway | ~550 | 基础设施 | 微软开源的 MCP 反向代理与管理层 | [microsoft/mcp-gateway](https://github.com/microsoft/mcp-gateway) | ★★ | ⚠ 需 .NET 8 SDK + Docker/K8s 部署，非标准 MCP 服务器 |
| 29 | Lunar (MCPX) | ~410 | 基础设施 | 生产级网关，规模化管理 MCP 服务器 | [TheLunarCompany/lunar](https://github.com/TheLunarCompany/lunar) | ★★ | ⚠ Docker 基础设施部署，非标准 MCP 安装 |

---

## Skill — AI Agent 技能包

| # | 项目名称 | Stars | 类别 | 一句话介绍 | GitHub 链接 | 推荐指数 | 安装方式备注 |
|---|---------|-------|------|-----------|------------|---------|------------|
| 1 | Anthropic Official Skills | ~3k | 官方 | Anthropic 官方技能仓库（创意/技术/企业工作流） | [anthropics/skills](https://github.com/anthropics/skills) | ★★★★★ | 标准 SKILL.md 文件夹复制 |
| 2 | Vercel Agent Skills | ~2k | 前端 | Vercel 官方 React/Next.js 最佳实践技能集 | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | ★★★★★ | npx skills 仅做文件复制，agent-add 可替代 |
| 3 | HashiCorp Agent Skills | ~800 | DevOps | HashiCorp Terraform/Vault 等产品的 Agent 技能集 | [hashicorp/agent-skills](https://github.com/hashicorp/agent-skills) | ★★★★★ | 标准 SKILL.md 文件夹，npx skills 仅文件复制 |
| 4 | mcollina Skills | ~450 | Node.js | Matteo Collina 的 Node.js/Fastify/TypeScript 11 项技能 | [mcollina/skills](https://github.com/mcollina/skills) | ★★★★ | 标准 SKILL.md 文件夹复制，无安装脚本 |
| 5 | Sanity Agent Toolkit | ~600 | CMS | Sanity CMS 最佳实践与内容建模技能 | [sanity-io/agent-toolkit](https://github.com/sanity-io/agent-toolkit) | ★★★★ | Skill 部分是标准文件夹；MCP 有 `sanity mcp configure` 自动检测 |
| 6 | ComposioHQ Skills | ~350 | 集成 | 连接 AI Agent 到 1000+ 外部应用的技能集 | [ComposioHQ/skills](https://github.com/ComposioHQ/skills) | ★★★★ | 标准 SKILL.md 文件夹，npx skills 仅文件复制 |
| 7 | Cybersecurity Skills | ~400 | 安全 | 753 网络安全技能覆盖 38 领域（MITRE ATT&CK 映射） | [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) | ★★★★ | SKILL.md 文件夹复制 |
| 8 | Superpowers | ~100k | 开发方法论 | Agent 技能框架与子代理驱动的软件开发方法论 | [obra/superpowers](https://github.com/obra/superpowers) | ★★★ | ⚠ 依赖 plugin marketplace 注册机制，底层是 SKILL.md 可复制 |
| 9 | Agents (wshobson) | ~31k | 综合框架 | 112 Agent + 146 技能 + 79 工具的多代理编排系统 | [wshobson/agents](https://github.com/wshobson/agents) | ★★★ | ⚠ 依赖 plugin marketplace 分发 |
| 10 | HuggingFace Upskill | ~700 | AI/ML | HuggingFace 官方技能生成与评估工具 | [huggingface/upskill](https://github.com/huggingface/upskill) | ★★★ | 标准 SKILL.md，但生态较新 |
| 11 | Remotion Skills | ~500 | 视频 | Remotion 官方 React 编程视频创作技能 | [remotion-dev/skills](https://github.com/remotion-dev/skills) | ★★★ | ⚠ 内部包无公开安装文档，结构上是标准 SKILL.md |
| 12 | Expo Skills | ~250 | 移动开发 | Expo React Native 移动应用开发技能 | (via VoltAgent 合集) | ★★★ | 标准 SKILL.md 文件夹 |
| 13 | ClickHouse Skills | ~200 | 数据库 | ClickHouse 最佳实践与查询优化技能 | (via VoltAgent 合集) | ★★★ | 标准 SKILL.md 文件夹 |
| 14 | Replicate Skills | ~200 | AI/ML | Replicate API 模型发现、比较与运行技能 | (via VoltAgent 合集) | ★★★ | 标准 SKILL.md 文件夹 |
| 15 | Neon Skills | ~180 | 数据库 | Neon Serverless Postgres 开发最佳实践 | (via VoltAgent 合集) | ★★★ | 标准 SKILL.md 文件夹 |
| 16 | VoltAgent Skills 目录 | ~9.5k | 技能目录 | 1000+ 官方团队技能索引（非可安装仓库） | [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | ★★ | ⚠ 策展目录/索引，本身不可安装，需链接到各独立 skill 仓库 |
| 17 | Everything Claude Code | ~128k | 综合框架 | 136 技能 + 60 命令 + 30 Agent 的全能套件 | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) | ★★ | ⚠ 自定义 install.sh/npx ecc-install 做语言过滤/profile 选择等 |
| 18 | Claude Skills (alireza) | ~5.2k | 技能合集 | 220+ 跨 11 种 AI 工具的生产级技能包 | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | ★★ | ⚠ 自定义 convert.sh/install.sh 做跨工具格式适配 |
| 19 | Vercel Skills CLI | ~1.5k | 生态工具 | 开放 Agent 技能生态工具 `npx skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills) | ★★ | ⚠ 它本身就是安装器 CLI（agent-add 直接竞品），非技能资产 |
| 20 | Antigravity Skills | ~150 | 技能合集 | 1,340+ Agent 技能的可安装 GitHub 库 | [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | ★★ | ⚠ 有自己的 installer CLI |

---

## Prompt — 提示词 / 规则文件

| # | 项目名称 | Stars | 类别 | 一句话介绍 | GitHub 链接 | 推荐指数 | 安装方式备注 |
|---|---------|-------|------|-----------|------------|---------|------------|
| 1 | Awesome Cursor Rules | ~15k | Cursor 规则 | 最全的 .cursorrules 配置文件合集 | [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | ★★★★★ | 纯文件复制到项目根目录 |
| 2 | Cursor Rules MDC | ~1.8k | Cursor 规则 | 新版 .mdc 格式的 Cursor Rules 精选列表 | [sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc) | ★★★★ | 生成的 .mdc 文件复制到 .cursor/rules/ |
| 3 | Awesome Cursor Rules (blefnk) | ~1.5k | Cursor 规则 | 面向 Next.js/React/Tailwind 优化的 AI IDE 规则 | [blefnk/awesome-cursor-rules](https://github.com/blefnk/awesome-cursor-rules) | ★★★★ | 纯文件复制 |
| 4 | Cursor Rules (survivorforge) | ~1.2k | Cursor 规则 | 39+ 生产级 .cursorrules 一键下载 | [survivorforge/cursor-rules](https://github.com/survivorforge/cursor-rules) | ★★★★ | 纯文件复制 |
| 5 | Awesome AI System Prompts | ~3k | 系统提示词 | ChatGPT/Claude/Manus/v0 等顶级 AI 系统提示词 | [dontriskit/awesome-ai-system-prompts](https://github.com/dontriskit/awesome-ai-system-prompts) | ★★★★ | 参考/复制用 |
| 6 | Awesome System Prompts | ~2.5k | 系统提示词 | AI 编码 Agent 系统提示词与工具定义合集 | [EliFuzz/awesome-system-prompts](https://github.com/EliFuzz/awesome-system-prompts) | ★★★★ | 参考/复制用 |
| 7 | Awesome Prompts | ~2k | GPT 提示词 | GPTs Store 高评分提示词精选 + 提示词攻防 | [ai-boost/awesome-prompts](https://github.com/ai-boost/awesome-prompts) | ★★★★ | 参考/复制用 |
| 8 | Claude MD Templates | ~1k | CLAUDE.md 模板 | CLAUDE.md 最佳实践与模板集 | [abhishekray07/claude-md-templates](https://github.com/abhishekray07/claude-md-templates) | ★★★ | 纯文件复制 |
| 9 | Claude Code Ultimate Guide | ~900 | 教程/模板 | 从入门到精通的 Claude Code 指南与模板 | [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) | ★★★ | 参考/复制用 |
| 10 | Claude Howto | ~800 | 教程/模板 | 可视化 Claude Code 指南，含复制即用模板 | [luongnv89/claude-howto](https://github.com/luongnv89/claude-howto) | ★★★ | 参考/复制用 |
| 11 | Claude Code Best Practice | ~600 | 最佳实践 | Claude Code 最佳实践规则与配置指南 | [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | ★★★ | 纯文件复制 |
| 12 | Claude Code Settings | ~500 | 配置/规则 | Claude Code 配置、技能与 Agent 的精选合集 | [feiskyer/claude-code-settings](https://github.com/feiskyer/claude-code-settings) | ★★★ | 纯文件复制 |
| 13 | Awesome Claude Code | ~450 | 综合目录 | Claude Code 技能/钩子/命令/插件精选列表 | [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | ★★★ | 目录/索引 |
| 14 | Claude Code Projects Index | ~350 | 模板合集 | 75+ Agent 工作区模板按用例分类 | [danielrosehill/Claude-Code-Projects-Index](https://github.com/danielrosehill/Claude-Code-Projects-Index) | ★★★ | 纯文件复制 |
| 15 | Awesome ChatGPT Prompts | ~143k | 通用提示词 | 全球最大开源提示词库 | [f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) | ★★ | ⚠ 已进化为完整平台（npx 自托管 + MCP + 认证系统），非简单提示词 |
| 16 | AI System Prompts | ~134k | 系统提示词 | 28+ AI 编码工具的完整系统提示词收集 | [x1xhlol/system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | ★★ | ⚠ 仅供参考的提取/逆向工程资料，非用户可安装资产 |
| 17 | Prompt Engineering Guide | ~66k | 教程/模板 | 提示词工程完整知识体系 | [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) | ★★ | ⚠ 教学文档网站，非可安装提示词资产 |
| 18 | Claude Code System Prompts | ~8k | 系统提示词 | Claude Code 全部系统提示词，每版本更新 | [Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts) | ★★ | ⚠ 参考/逆向工程资料，修改需 tweakcc 补丁工具 |
| 19 | Claude Code Toolkit | ~4k | 综合工具集 | 135 Agent + 15 规则 + 7 模板的工具箱 | [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | ★★ | ⚠ 有 curl \| bash 安装脚本 + plugin 注册 |
| 20 | Awesome Claude Skills List | ~5k | 目录 | Claude Skills 精选列表与资源汇总 | [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | ★★ | ⚠ 策展目录，非可安装资产 |

---

## Command — 自定义命令 / Slash Commands

| # | 项目名称 | Stars | 类别 | 一句话介绍 | GitHub 链接 | 推荐指数 | 安装方式备注 |
|---|---------|-------|------|-----------|------------|---------|------------|
| 1 | wshobson/commands | ~5k | 命令合集 | 生产级 slash 命令集，支持多 Agent 编排工作流 | [wshobson/commands](https://github.com/wshobson/commands) | ★★★★★ | 纯文件复制 .md 到 ~/.claude/commands/ |
| 2 | Claude-Command-Suite | ~2k | 命令合集 | 216+ 命令覆盖代码审查/安全审计/架构分析 | [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite) | ★★★★ | install.sh 仅做批量 cp，本质是纯文件复制 |
| 3 | My-Claude-Code | ~1k | 个人精选 | 日常使用的命令/技能/工作流精选合集 | [vincenthopf/My-Claude-Code](https://github.com/vincenthopf/My-Claude-Code) | ★★★★ | 纯文件复制 |
| 4 | Claude Code Settings | ~500 | 配置 | 含 codex-skill/autonomous-skill 等可安装命令 | [feiskyer/claude-code-settings](https://github.com/feiskyer/claude-code-settings) | ★★★ | 纯文件复制 |
| 5 | Claude Code Best Practice | ~600 | 最佳实践 | 含命令 vs Agent vs 技能选择指南 | [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | ★★★ | 纯文件复制 |
| 6 | agnix | ~350 | Lint/验证 | Claude Code Agent 文件综合 Linter（156 规则） | [agent-sh/agnix](https://github.com/agent-sh/agnix) | ★★★ | 纯文件复制 |
| 7 | zpaper-com/ClaudeKit | ~1.2k | 市场 | 官方市场平台含 12 Agent + 7 工作流命令 | [zpaper-com/ClaudeKit](https://github.com/zpaper-com/ClaudeKit) | ★★★ | ⚠ 推荐 plugin marketplace 方式，但有手动 cp 回退路径 |
| 8 | Everything Claude Code | ~128k | 综合框架 | 60 个 slash 命令覆盖安全审计/测试/文档 | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) | ★★ | ⚠ 自定义 install.sh 做语言过滤/profile 选择 |
| 9 | Claude-Code-Workflow | ~3k | 工作流 | 22 Agent 的 JSON 驱动多代理开发框架 | [catlog22/Claude-Code-Workflow](https://github.com/catlog22/Claude-Code-Workflow) | ★★ | ⚠ 需 `npm i -g` + `ccw install` 自定义 CLI |
| 10 | ClaudeKit (carlrannaberg) | ~1.5k | 工具集 | git 检查点 + 代码质量钩子 + 规格生成命令 | [carlrannaberg/claudekit](https://github.com/carlrannaberg/claudekit) | ★★ | ⚠ 需 `npm i -g claudekit` + `claudekit setup` 交互式向导 |
| 11 | Superpowers | ~100k | 开发方法论 | 自动触发的编排命令驱动子代理开发流程 | [obra/superpowers](https://github.com/obra/superpowers) | ★★ | ⚠ 依赖 plugin marketplace 注册机制 |
| 12 | Agents (wshobson) | ~31k | 综合编排 | 含 tools/ 和 workflows/ 两类命令 | [wshobson/agents](https://github.com/wshobson/agents) | ★★ | ⚠ 依赖 plugin marketplace 分发 |
| 13 | Claude Code Toolkit | ~4k | 综合 | 42 命令 + 钩子 + 规则的一站式工具箱 | [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | ★★ | ⚠ curl \| bash 安装脚本 + plugin 注册 |

> 注：Command 类型中高推荐（★★★★+）项目较少——多数命令合集项目已演化为自带安装器的综合框架。纯文件复制的命令仓库是 agent-add 的最佳目标。

---

## Sub-agent — 子代理定义

| # | 项目名称 | Stars | 类别 | 一句话介绍 | GitHub 链接 | 推荐指数 | 安装方式备注 |
|---|---------|-------|------|-----------|------------|---------|------------|
| 1 | Awesome Claude Agents | ~1.2k | 目录 | 最全 Claude Code Agent 仓库/指南/资源目录 | [rahulvrane/awesome-claude-agents](https://github.com/rahulvrane/awesome-claude-agents) | ★★★★ | 核心是 .md 文件复制到 .claude/agents/ |
| 2 | Supatest Sub-agents | ~800 | 测试 | 含语言专家/框架专家/架构/测试 Agent | [supatest-ai/awesome-claude-code-sub-agents](https://github.com/supatest-ai/awesome-claude-code-sub-agents) | ★★★★ | 纯文件复制 cp *.md ~/.config/claude-code/agents/ |
| 3 | VoltAgent Codex Subagents | ~3k | 子代理合集 | 130+ Codex 专用子代理 | [VoltAgent/awesome-codex-subagents](https://github.com/VoltAgent/awesome-codex-subagents) | ★★★★ | 纯 TOML 文件复制到 .codex/agents/ |
| 4 | Agency Agents | ~200 | 组织模拟 | 147 个 Agent 跨 12 部门的完整 AI 代理公司 | [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | ★★★★ | Claude Code 路径为纯 cp 文件复制；有跨工具转换脚本 |
| 5 | lst97 Sub-agents | ~404 | 全栈开发 | 33 个全栈开发专用 Claude Code 子代理 | [lst97/claude-code-sub-agents](https://github.com/lst97/claude-code-sub-agents) | ★★★ | 纯 .md 文件复制到 ~/.claude/agents/ |
| 6 | Claude Sub-agent System | ~350 | 工作流 | AI 驱动开发工作流（spec/architect/developer） | [zhsama/claude-sub-agent](https://github.com/zhsama/claude-sub-agent) | ★★★ | 纯 .md 文件复制到 .claude/agents/ |
| 7 | VoltAgent Claude Subagents | ~5k | 子代理合集 | 100+ 专用 Claude Code 子代理，10 大分类 | [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | ★★★ | ⚠ 有交互式 install-agents.sh 和 meta installer agent |
| 8 | Claude Code Settings | ~500 | 配置 | 含特性开发/代码分析/GitHub 集成专用 Agent | [feiskyer/claude-code-settings](https://github.com/feiskyer/claude-code-settings) | ★★★ | 纯文件复制 |
| 9 | Claude-Command-Suite | ~2k | 开发工具 | 55 专用 AI Agent 覆盖代码审查/安全/架构 | [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite) | ★★★ | install.sh 仅批量 cp |
| 10 | Claude Code Toolkit | ~4k | 综合 | 135 Agent 的一站式工具箱 | [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | ★★ | ⚠ curl \| bash 安装脚本 |
| 11 | Everything Claude Code | ~128k | 综合框架 | 30 个专用 Agent 覆盖安全/审查/测试/研究/文档 | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) | ★★ | ⚠ 自定义 install.sh 做 profile 选择 |
| 12 | Superpowers | ~100k | 开发方法论 | 子代理驱动开发，Agent 可自主工作数小时 | [obra/superpowers](https://github.com/obra/superpowers) | ★★ | ⚠ 依赖 plugin marketplace |
| 13 | Agents (wshobson) | ~31k | 综合编排 | 112 专用 AI Agent + 16 多代理工作流编排器 | [wshobson/agents](https://github.com/wshobson/agents) | ★★ | ⚠ 依赖 plugin marketplace |
| 14 | Sub-Agent Collective | ~1.8k | 研究 | 上下文工程研究，Hub-and-Spoke 协调模式 | [vanzan01/claude-code-sub-agent-collective](https://github.com/vanzan01/claude-code-sub-agent-collective) | ★★ | ⚠ `npx claude-code-collective init` 做目录生成/hooks/settings 配置 |
| 15 | Sub-agents Manager | ~300 | CLI 工具 | Claude 子代理管理 CLI 含钩子与自定义命令 | [webdevtodayjason/sub-agents](https://github.com/webdevtodayjason/sub-agents) | ★★ | ⚠ `npm i -g` + `claude-agents init` 做项目检测/CLAUDE.md 注入 |
| 16 | ClaudeKit (carlrannaberg) | ~1.5k | 工具集 | 20+ 专用子代理含 oracle/code-reviewer 等 | [carlrannaberg/claudekit](https://github.com/carlrannaberg/claudekit) | ★★ | ⚠ 需 claudekit setup 交互式向导 |
| 17 | Claude-Code-Workflow | ~3k | 工作流 | 22 专用 Agent 的 JSON 驱动多代理框架 | [catlog22/Claude-Code-Workflow](https://github.com/catlog22/Claude-Code-Workflow) | ★★ | ⚠ 需 `ccw install` 自定义 CLI |
| 18 | ClaudeKit Market | ~1.2k | 市场 | 12 专用 AI Agent 的市场平台 | [zpaper-com/ClaudeKit](https://github.com/zpaper-com/ClaudeKit) | ★★ | ⚠ 推荐 plugin marketplace 方式 |

---

## 推荐指数说明

- ★★★★★ = **强烈推荐**：安装方式为纯 JSON 配置或纯文件复制，agent-add 可完全替代，项目活跃且文档规范
- ★★★★ = **推荐**：安装主流程适合 agent-add，可能有小的额外步骤（如 API Key 配置）
- ★★★ = **可尝试**：agent-add 能处理核心安装，但项目有额外前置条件或备选安装路径
- ★★ = **低优先**：项目有自定义安装器做了额外工作（⚠ 标记），或本身是目录/教程非可安装资产

## PR 策略建议

1. **MCP 是主战场**：前 11 个 ★★★★★ MCP 项目全部是纯 JSON 配置，PR 最简单（README 加一行 `agent-add --mcp` 命令），合入概率最高
2. **Skill 找官方团队**：Anthropic/Vercel/HashiCorp 的 skill 仓库是标准 SKILL.md 结构，这些企业对开源贡献友好
3. **Prompt 重点打 Cursor Rules**：PatrickJS/awesome-cursorrules（15k stars）是最佳目标，纯文件复制完美匹配
4. **Command/Sub-agent 选纯文件仓库**：wshobson/commands、supatest-ai、lst97 等纯 .md 文件复制的仓库是好目标
5. **避开 ★★ 项目**：它们要么有自定义安装器（agent-add 无法平替），要么是目录/教程类项目
