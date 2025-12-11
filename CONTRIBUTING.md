# Contributing to BVM

感谢你愿意为 BVM（Bun Version Manager）贡献力量！本文介绍本地开发、测试、提交流程与发布步骤，所有脚本都基于 Bun。

## 开发环境

- Bun >= 1.3
- Git, curl/wget 等基础工具
- macOS/Linux/Fish/Bash/Zsh 均已验证；Windows 建议使用 WSL

```bash
bun install
```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run bvm -- <cmd>` | 在真实 HOME 下运行 CLI（等同于最终用户） |
| `npm run bvm:sandbox -- <cmd>` | 将 HOME 指向 `./.sandbox-home`，便于反复测试/清理 |
| `BVM_TEST_MODE=true ...` | 让 CLI 使用内置版本列表、跳过网络操作，适用于集成测试 |

## 测试

```bash
npx bun test test/*.ts
```

集成测试会在沙箱 HOME 中运行多个 CLI 子进程，因此建议在 `BVM_TEST_MODE=true` 环境下执行，或使用 `npm run bvm:sandbox -- ...` 预先拉取需要的版本。

## 发布流程

1. 确保仓库干净、依赖同步：`bun install`
2. 运行自动检查：`npm run release`
   - 该脚本会检查 git 状态并执行 `bun test`
3. 使用 `npm version <patch|minor|major>` 或手动编辑 `package.json`
4. 推送代码并创建 GitHub Release（附二进制/脚本）

## 提交规范

- Commit Message 采用 `type: subject`（如 `feat: add doctor command`）
- 每个功能需包含必要的单元/集成测试
- 如果命令输出或文档发生变更，请同步更新 `README.md`

欢迎在 Discussion 或 Issue 中提出想法，我们期待你的贡献！
