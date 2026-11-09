# npm 可信发布操作说明

发布工作流是 `.github/workflows/publish.yml`，在 Actions 中名为
**Publish to npm**。通过 npm OIDC 可信发布，把版本与 GitHub 仓库、tag、
提交和工作流关联起来，不需要配置 `NPM_TOKEN`。

**首次使用前，维护者必须完成下面的网页设置。** PR 只能添加工作流，
不能替代 npm 账号授权或 GitHub Environment 的审批配置。
**1.3.0 是人工发布版本，没有 npm provenance 来源证明**；新流程从未来
首次成功使用该工作流的版本开始生效，不会给 1.3.0 补发来源证明。

## 一次性设置：按顺序操作

1. 合并可信发布 PR 到 `master`。
2. 打开 **GitHub → pea3nut/agent-add → Settings → Environments**，创建
   **`npm-publish`**：
   - 添加 Required reviewers（必需审批人）。
   - 如果只有你一个审批人，并由你推送 tag，先不要打开 Prevent self-review；
     否则需要另一位审批人才能发布。
   - Deployment branches and tags 选择 **Selected branches and tags**，
     添加类型为 **Tag**、匹配 **`[0-9]*`** 的规则，不添加分支规则。
   - 确保仓库/组织允许此工作流和 OIDC 权限。不添加 npm Token secret。
3. 打开 [npm 的 agent-add 页面](https://www.npmjs.com/package/agent-add)，进入
   **Settings → Trusted Publisher → GitHub Actions**，填写：

   | 字段 | 填写值 |
   | --- | --- |
   | Organization or user | `pea3nut` |
   | Repository | `agent-add` |
   | Workflow filename | `publish.yml`，只填文件名 |
   | Environment name | `npm-publish` |
   | Allowed actions（如果出现） | 允许直接 `npm publish`；不需要额外的 dist-tag 管理权限 |

4. 开启 npm 账号 2FA，撤销旧的发包 Token，清理不再使用的
   `NPM_TOKEN`/`NODE_AUTH_TOKEN` secrets。添加可信发布者不会自动禁止其他
   发包途径，也不会自动撤销旧 Token。
5. 建议保护 `master`，限制版本 tag 的更新和删除，并要求发布工作流的改动经过审查。

Actions 均固定到完整提交 SHA。发布环境固定 Node 24.22.2 和 npm 11.9.0，
满足可信发布要求；用户运行 CLI 仍支持 Node 18。只有 publish job 获得
`id-token: write`；环境审批规则必须在 GitHub 网页设置。

## 以后怎么发包

1. 在 PR 中更新 `package.json` 和 `package-lock.json` 的新正式版本号，合并到
   `master`。已经发布的版本号不要复用。
2. 对已经合并的准确提交打版本 tag。现有命名是 **`1.3.1`**，不带 `v`。
   例如，新版本 PR 合并后：

   ```bash
   git fetch origin master
   git tag -a 1.3.1 origin/master -m 'Release agent-add 1.3.1'
   git push origin refs/tags/1.3.1
   ```

   将示例版本替换成实际版本。工作流检查 tag 与包版本、包名/仓库、
   checkout SHA，以及提交是否已在 `master` 历史中。未合并分支、分支上的手动
   运行和预发布版本都会被拒绝。
3. 打开 **Actions → Publish to npm**，查看构建和实际安装包测试结果，
   再批准 `npm-publish` 环境部署。
4. 等待 **Verify npm archive and attestations** 成功，再按平时流程写 GitHub
   Release。工作流本身不会公开发布 GitHub Release。

流程：校验 tag → 构建并打包一次 → Node 18～24 测试同一包 → 环境审批
→ OIDC 发布同一包 → 从 npm 下载回验。

具有发布权限的 job 不 checkout、不运行仓库脚本；它再次核对包身份和 SHA-512，
使用 `npm publish <tarball> --ignore-scripts --provenance` 发布已测试文件，不重新构建。
最后一个只读 job 比较 npm 实际包的 SHA-512，核对来源证明中的包摘要、仓库、工作流、
tag 和完整提交，再禁用生命周期脚本
安装该包，运行 `npm audit signatures` 验证签名与证明。该步骤不会启动 agent-add。

## 用户可以看什么证据

- 公开 Actions 运行记录：源码提交和 npm 来源证明链接。
- `npm-release` 附件：被测试的 `.tgz`、`release.json`，包含版本、完整提交、
  仓库和 SHA-512，保留 30 天。
- `npm-release-verification` 附件：发布物回验记录、来源证明元数据和签名核验输出，
  保留 90 天。下载 Actions 附件可能需要 GitHub 登录；需要长期保留的证据可放到 Release。
- npm 页面里的 provenance 链接：核对仓库是 `pea3nut/agent-add`，提交为该版本
  提交，工作流为 `.github/workflows/publish.yml`。

来源证明说明包来自哪份源码和构建流程；独立可复现构建及工具行为审计属于另外的工作，
不能把这个证明写成“无恶意认证”。

## 出错和本地验证

- npm 授权/OIDC 配置错误：完成配置后重跑同一 tag 的失败任务，不回退到长期 Token。
- npm 已发布而最后核验失败：版本已公开。调查后只重跑失败的核验 job，不移动 tag，
  不复用版本号。最后核验失败不会自动撤销 npm 上的发布。
- 手动 Run workflow 必须使用 tag ref；也可用
  `gh workflow run publish.yml --ref 1.3.1`。从 `master` 运行会被拒绝。
- `npm run test:release` 运行 Git/tag、包篡改、仓库/版本错配和证明缺失等测试，
  不执行真实发布。普通 PR CI 也会运行。

官方说明：[可信发布](https://docs.npmjs.com/trusted-publishers/)、
[来源证明](https://docs.npmjs.com/generating-provenance-statements/)。
