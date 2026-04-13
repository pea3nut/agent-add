# PRD: 扩展宿主覆盖至 ~98%

**状态**: Draft
**日期**: 2026-04-09

---

## 背景

当前 agent-add 支持 18 个宿主，根据市场数据估算覆盖约 95% 的 AI 编码工具用户。对标 npx skills 的 45+ 宿主支持，我们的目标不是全覆盖，而是**官方支持热门工具，总流量覆盖 80%-98%**。

---

## 当前覆盖率分析

### 已支持宿主（按市场份额排序）

| 排名 | 宿主 | ID | 市场份额（估算） | 累计 |
|------|------|-----|---------------|------|
| 1 | GitHub Copilot | `github-copilot` | ~42% | 42% |
| 2 | Claude Code | `claude-code` | ~25% | 67% |
| 3 | Cursor | `cursor` | ~18% | 85% |
| 4 | Gemini CLI | `gemini` | ~5% | 90% |
| 5 | Windsurf | `windsurf` | ~3% | 93% |
| 6 | Roo Code | `roo-code` | ~1% | 94% |
| 7 | Trae | `trae` | ~1% | 95% |
| 8-18 | 其余 11 个 | - | 各 <0.5% | ~96% |

### 缺失但值得关注的宿主

| 宿主 | 热度指标 | 优先级 | 备注 |
|------|---------|--------|------|
| **Cline** | VS Code 5M+ 安装，最热门免费 agentic 扩展 | **P0** | VS Code 扩展，配置路径需调研（可能基于 `.cline/` 目录） |
| **Continue** | 1.6M VS Code 安装，32K GitHub stars，领先开源 AI 代码助手 | **P0** | 开源项目，配置路径需调研 |
| **Amp** (Sourcegraph) | 企业级 agentic coding，快速增长 | **P1** | 较新，需评估用户量和配置方式 |
| **Goose** (Block) | 开源 CLI agent，Apache 2.0 | **P2** | 社区驱动，用户量相对小 |
| **Droid** (Factory) | 企业终端 agent，Terminal-Bench 高分 | **P2** | 企业场景，公开文档不足 |

### 不建议支持的宿主

| 宿主 | 原因 |
|------|------|
| Replit Agent | 封闭平台，22.5M 用户但无文件系统配置接口 |
| BLACKBOXAI | 4.2M 安装但争议较多，配置方式不明 |
| Antigravity (Google) | 已被 Gemini CLI 覆盖，配置路径兼容 |

---

## 建议

### 第一批（P0）— 达到 ~98% 覆盖

1. **Cline** — 补齐 VS Code agentic 扩展的最大缺口
2. **Continue** — 开源社区最活跃的 AI 代码助手

### 第二批（P1）— 按需补充

3. **Amp** — 视企业用户反馈决定

### 实施方式

按照现有贡献指南（`src/hosts/README.md` 底部的 "How to Add a New Host"）：

1. 调研宿主官方文档，确认各资产类型的配置路径和格式
2. 在 `src/hosts/README.md` 添加能力矩阵行和详情表
3. 创建 `src/hosts/<id>.ts` 实现 HostAdapter
4. 注册到 `src/hosts/index.ts`
5. 添加 `tests/unit/hosts/<id>.test.ts`

---

## 非目标

- 不追求覆盖所有 45+ 宿主
- 不支持封闭平台（无文件系统配置接口的工具）
- 不支持用户量极小或文档不全的宿主
