# 安全说明与发布来源验证

[English](./security.md) | **中文**

本文说明 agent-add 工具本身的行为和发布流程，不评估被安装的 MCP、Skill 等内容的安全性。

## 工具会访问什么

| 访问类型 | 用途 |
| --- | --- |
| 读取本地文件 | 读取你提供的来源和 Pack 清单，检查已知宿主路径以检测宿主，读取已有目标文件以合并或比较内容。 |
| 写入本地文件 | 修改选定宿主的项目文件，或通过 `--global` 修改用户配置；创建下载临时文件、安装暂存和备份文件。 |
| 网络访问 | 下载命令参数或 Pack 清单指定的 HTTP(S) 来源，获取指定 Git 仓库。HTTP 下载可能跟随重定向。 |
| 子进程 | 调用本机 `git` 初始化、获取并检出来源仓库。MCP 命令被写入宿主配置；agent-add 不启动这些服务，也不执行资产内容里的安装命令。 |

工具未内置遥测、统计、更新检查或上传本地配置的功能。来源服务器仍会收到正常的连接和请求元数据。npm/npx 下载 agent-add 时也会访问包仓库，这与工具本身的请求是两个环节。

CLI 以当前用户权限运行。Git 使用已有的 Git/SSH 配置，可能调用配置的凭据助手或过滤器。工具不提供沙箱隔离；如需强制限制访问，应使用限制文件、凭据和网络权限的一次性环境。

可核查代码：[来源解析](../src/source/index.ts)、[HTTP 下载](../src/source/http-file.ts)、[Git 操作](../src/source/git.ts)、[宿主检测](../src/hosts/detect.ts)、[安装流程](../src/installer.ts)。

## 验证 npm 版本的发布来源

[发布工作流](../.github/workflows/publish.yml)使用 npm Trusted Publishing，通过 GitHub Actions OIDC 发布。它检查版本 Tag 与 `package.json` 一致、对应提交已合入 `master`，构建并测试 tarball，然后发布同一份产物并生成 provenance 来源证明。发布任务使用 `npm-publish` GitHub Environment，审批规则由仓库设置控制。

验证你准备安装的具体版本：

1. 打开 [agent-add 的 npm 页面](https://www.npmjs.com/package/agent-add)，选择目标版本。
2. 点击版本旁的 provenance 勾选标记，再点击 **View more details**。
3. 查看 **Source Commit**、**Build Summary**、**Build File**，核对源码提交、Actions 运行和工作流是否指向 `pea3nut/agent-add` 及对应版本。

来源证明按版本记录。**1.3.0** 发布于此工作流接入之前，截至 **2026-11-09** 未包含 provenance 证明。配置可信发布不会为已发布版本补上证明；工作流状态徽章也不能单独证明某个 tarball 的来源。

详见 npm 官方的[查看与验证 provenance 说明](https://docs.npmjs.com/viewing-package-provenance/)。来源证明用于核实发布来源；判断代码行为仍需审查源码和构建流程。

## 已记录的检查

| 检查 | 范围与结果 | 证据 |
| --- | --- | --- |
| npm 依赖审计，2026-11-09 UTC | 提交 [`ad8cd77`](https://github.com/pea3nut/agent-add/commit/ad8cd77a12f5b0743c04c2d07a5857ce261b8bba) 的仓库 lockfile，包含开发和构建依赖；npm 11.9.0 报告 **0 个已知漏洞**。 | [完整 JSON 报告、命令、提交和 lockfile 哈希](./security/reports/npm-audit-2026-11-09.json) |

这项检查由 Codex 调用 npm registry 的漏洞数据运行，是自动化依赖检查，不是对工具行为的独立安全审计。结果是当日快照，后续新增的漏洞公告可能改变结果。可在仓库检出目录复查：

```bash
npm audit --package-lock-only --include=dev --json --registry=https://registry.npmjs.org
```

[构建过程会将库打包进 CLI](../tsup.config.ts)。运行时依赖列表为空，不代表没有第三方代码；只检查使用者项目的 npm 依赖树，可能漏掉已打包的库，需要同时考虑源码 lockfile 和实际发布产物。

## 建议补充的第三方报告

建议按以下顺序接入。目前本文未声明已取得 Socket、CodeQL 或 Scorecard 的扫描报告。

| 优先级 | 服务 | 应检查的内容 |
| --- | --- | --- |
| 优先 | [Socket](https://docs.socket.dev/docs/faq) | npm 具体版本及其实际发布文件中的可疑行为、安装脚本、网络与文件访问能力，以及已打包代码。安装工具正常功能也可能触发能力提示，应逐项查看发现和扫描覆盖范围。 |
| 优先 | [GitHub CodeQL](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning) | JavaScript/TypeScript 源码漏洞。启用 Code scanning、审查发现，再提供确切的 Actions 记录，以及读者可访问的报告或审查摘要。 |
| 可选 | [OpenSSF Scorecard](https://scorecard.dev/) | 工作流权限、依赖固定、代码审查等仓库和供应链实践。评分反映这些实践，不代表“代码无恶意”认证。 |

Socket 的[仓库集成通过读取清单和 lockfile 分析依赖](https://socket.dev/security)。仅接入仓库，不代表 agent-add 自身发布的 bundle 已经过审查；还需单独获取具体包版本的报告并确认覆盖范围。

每份报告应附上公开链接或原始输出、包版本或提交、UTC 日期、工具版本、扫描范围和规则、发现及尚未解决的局限。确认读者无需维护者权限即可打开；徽章应链接到这些证据，代码变化后也要更新报告。

## ChatGPT 等 AI 辅助审查

共享对话或截图可以作为补充。请标明 **AI 辅助代码审查**，注明模型或工具、审查日期、源码提交、包版本，以及检查范围、发现和剩余疑点。截图之外，优先附上完整共享对话或导出的原始报告，让读者可以查看上下文。

不要把 AI 回复描述为独立安全认证。“未发现可疑代码”的结论只适用于实际审查的代码和范围，不能保证所有版本都没有问题。
