# BVM · Bun Version Manager

> Bun 原生的多版本管理器，跨平台、零依赖、开箱即用。

![BVM banner](https://img.shields.io/badge/bvm-bun-blue)

## 目录

1. [核心特性](#核心特性)
2. [快速上手](#快速上手)
3. [安装方式](#安装方式)
4. [常用命令速查](#常用命令速查)
5. [命令演示](#命令演示)
6. [本地开发与沙箱模式](#本地开发与沙箱模式)
7. [环境配置与网络优化](#环境配置与网络优化)
8. [故障排查](#故障排查)
9. [工具对比](#工具对比)
10. [贡献指南](#贡献指南)
11. [卸载](#卸载)

---

## 核心特性

- ⚡ **Bun 原生性能**：CLI 使用 Bun 构建与运行，指令响应极快。
- 🧪 **Bun 全链路**：开发、测试、发布脚本全部使用 Bun (`bun test`、`npx bun run src/index.ts`)，保持统一体验。
- 📦 **零运行依赖**：编译后产物为单文件二进制，适配 macOS / Linux / Windows。
- 🧠 **智能版本管理**：支持 `install / use / ls / ls-remote / alias / run / exec / which / cache` 等常用命令，并内置 `.bvmrc` 支持。
- 🔁 **冲突检测**：自动检测已存在的官方 Bun 安装或其他路径冲突，提供交互式处理。
- 🌐 **网络友好**：在中国大陆自动优先使用 npm 镜像，并提示配置 GitHub 加速镜像。
- 🧰 **可扩展脚本**：直接使用 `npx bun run src/index.ts`，或配合 `HOME=<目录>` 环境变量即可在真实/沙箱环境下调试。

---

## 快速上手

```bash
# 1. 安装最新稳定版 Bun
curl -fsSL https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash

# 2. 让当前 shell 识别 bvm
source ~/.zshrc   # 或 ~/.bashrc / ~/.config/fish/config.fish

# 3. 查看远端版本并安装
bvm ls-remote
bvm install 1.3.4
bvm use 1.3.4
```

---

## 安装方式

| 场景 | 命令 |
| --- | --- |
| 推荐：一键脚本 | `curl -fsSL https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh \| bash` |
| 备用：wget | `wget -qO- https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh \| bash` |
| 手动下载 | 前往 [GitHub Releases](https://github.com/bvm-cli/bvm/releases) 下载对应平台二进制，赋予 `chmod +x` 后放入 `PATH` |
| 本地构建 | `git clone … && bun install && bun build src/index.ts --compile --outfile bvm` |

---

## 常用命令速查

```bash
bvm --help                   # 全量帮助
bvm ls-remote                # 查看远端版本
bvm install 1.0.0            # 安装指定版本
bvm install latest           # 安装最新稳定版
bvm install                  # 根据 .bvmrc 安装

bvm use 1.0.0                # 切换到指定版本
bvm use                      # 根据 .bvmrc 切换
bvm ls                       # 查看本地版本 & alias
bvm current                  # 查看当前激活版本
bvm which 1.0.0              # 查看安装路径

bvm alias prod 1.0.0         # 创建 alias
bvm unalias prod             # 删除 alias
bvm run 1.0.0 --version      # 使用指定版本运行命令
bvm exec latest bun run app  # 在指定版本环境下执行命令

bvm cache dir                # 查看缓存目录
bvm cache clear              # 清理缓存
bvm deactivate               # 解除激活
bvm uninstall 1.0.0          # 卸载版本
bvm upgrade                  # 自升级
bvm doctor                   # 输出诊断信息（安装目录、别名、环境变量）
bvm completion zsh           # 生成指定 shell 的补全脚本
```

## 命令演示

```bash
$ npx bun run src/index.ts install 1.2
- Finding Bun 1.2 release...
✓ Bun v1.2.23 installed successfully.
✓ Bun v1.2.23 is now active.

$ npx bun run src/index.ts doctor
Directories
  BVM_DIR: /Users/you/.bvm
Environment
  BVM_TEST_MODE: false
Installed Versions
  v1.3.4 (current)
Aliases
  default -> v1.3.4
```

---

## 本地开发与沙箱模式

为了避免污染真实 `HOME`，推荐直接使用 `npx bun run src/index.ts` 并按需覆写 `HOME`：

```bash
# 使用真实 HOME（模拟最终用户）
npx bun run src/index.ts ls

# 使用 ./manual-home 作为 HOME，便于快速清理
HOME="$PWD/manual-home" npx bun run src/index.ts install 1.0.0
```

你也可以自定义：

```bash
export BVM_DEV_HOME=$PWD/.sandbox-home
alias bvm-dev='HOME=$BVM_DEV_HOME npx bun run src/index.ts'
bvm-dev install 1.2.23
```

---

## 环境配置与网络优化

1. **PATH**  
   BVM 在首次 `install` 或执行 `bvm setup` 时会尝试更新你的 shell 配置文件 (`.zshrc` / `.bashrc` / `config.fish` / PowerShell `$PROFILE`)。确保 `~/.bvm/bin` 在 `PATH` 中，并在修改后 `source` 或重启终端。

2. **npm Registry**  
   处于中国大陆时会优先访问 `npmmirror.com`，无需额外配置。

### 自动补全

```bash
# Zsh
bvm completion zsh > ~/.config/bvm.zsh && source ~/.config/bvm.zsh

# Bash
bvm completion bash >> ~/.bashrc && source ~/.bashrc

# Fish
bvm completion fish > ~/.config/fish/completions/bvm.fish
```

---

## 故障排查

| 问题 | 处理 |
| --- | --- |
| `Command not found: bun` | 检查 `~/.bvm/bin` 是否已加入 PATH，并确认终端已重启或已 `source` 配置文件。 |
| `CONFLICT DETECTED` | 按提示卸载官方 Bun 或自行调整 PATH，避免多个 bun 冲突。 |
| 下载超时 | 可临时使用代理、手动下载 release 资产或在本地缓存目录放置离线包。 |
| `.bvmrc` 无效 | 确认是在项目目录或子目录中执行 `bvm use/install`，且 `.bvmrc` 内容合法。 |
| 测试依赖网络 | 运行 `bun test` 前建议导出 `BVM_TEST_MODE=true` 或使用仓库自带的 mock 数据。 |

---

## 工具对比

|  | **bvm (Bun)** | **bum (Rust)** |
| --- | --- | --- |
| 实现语言 | Bun (TypeScript) | Rust |
| 命令覆盖 | install/use/ls/ls-remote/alias/run/exec/which/cache/doctor/completion | use/remove/list/list-remote |
| 自动安装行为 | 安装与切换分离，输出更详细提示 | `use` 会隐式安装缺失版本 |
| 别名/默认版本 | ✅ 别名、`.bvmrc`、PATH 检测 | 部分支持（`.bumrc`） |
| 运行指定版本 | `bvm run/exec` | 无 |
| 自升级 | `bvm upgrade` | 未提供 |
| 脚本/沙箱 | `npx bun run src/index.ts`、`HOME="<dir>" npx bun run src/index.ts` | 主要通过 npx + Bun |

---

## 贡献指南

1. Fork 项目并拉取最新 `main`。
2. 运行 `bun install` 同步依赖，使用 `HOME="$PWD/manual-home" npx bun run src/index.ts <cmd>` 在隔离环境验证命令。
3. 编写/更新测试：`npx bun test test/*.ts`。
4. 提交 `type: subject` 风格的 Commit（如 `feat: support foo`）。
5. 在 PR 中提供动机、关键改动、测试输出，必要时附 CLI 截图。

欢迎提交 Issue / Discussion 与 PR！完整细节请参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 卸载

```bash
rm -rf ~/.bvm
# 或者在沙箱模式下 rm -rf <sandbox>/\.bvm
```

同时删除 shell 配置文件中添加的 `BVM_DIR` 与 `PATH` 相关行，然后重启终端即可。
