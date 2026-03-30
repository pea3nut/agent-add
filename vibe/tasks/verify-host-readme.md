# Task: Verify and Update src/hosts/README.md

## 目标

逐一访问 `src/hosts/README.md` 中每个宿主的官方文档链接，验证以下内容是否仍然准确，并修复所有过时或错误的信息。

## 需要验证的文件

- `src/hosts/README.md` — 唯一信源，本次任务的主要修改目标
- `src/hosts/<id>.ts` — 每个宿主的适配器文件，`docs` 字段需与 README 同步

## 验证步骤

### 1. 读取 README

读取 `src/hosts/README.md`，提取每个宿主的：
- 官方文档链接（`**Docs**` 字段）
- MCP 配置文件路径和 key 名称
- Prompt 安装路径和策略
- 其他资产配置（Skill、Command、Sub-agent）

### 2. 逐一访问官方文档

对每个宿主，访问其 `**Docs**` 链接，重点确认：

| 检查项 | 说明 |
|--------|------|
| 链接是否可达 | 404 / 重定向均需更新 |
| MCP 配置文件路径 | 各平台（macOS/Linux/Windows）的实际路径 |
| MCP 配置 key 名称 | 如 `mcpServers`、`servers`、`mcp` 等 |
| Prompt 路径/策略 | 单文件（`append-with-marker`）还是目录（`create-file-in-dir`） |
| 配置格式 | JSON 还是 TOML |

### 3. 比对并记录差异

将官方文档中读到的信息与 README 中的记录逐项对比，记录所有差异：
- 链接失效（404 或永久重定向）
- 配置路径变更
- key 名称变更
- 策略变更（如从单文件改为目录）

### 4. 更新 README 文件

对每处差异：

**更新 `src/hosts/README.md`**：
- 修正 `**Docs**` 链接
- 修正 MCP 配置路径、key 名称
- 修正 Prompt / Skill 路径和策略

## 注意事项

- 并行访问多个官网以节省时间
- 部分文档页面需要跟随重定向后再次访问
- 若官方文档未明确说明某配置细节（如具体文件路径），保留现有记录不变，不要猜测
- README 是唯一信源，adapter 实现必须与 README 完全一致
- 更改 adapter 后不需要运行测试（测试会被 CI 触发），但需提醒用户单元测试可能需要同步更新
