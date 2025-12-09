# BVM (Bun Version Manager)

⚡️ The native version manager for Bun. Cross-platform (macOS/Linux/Windows), shell-agnostic, and zero-dependency. Supports version switching, aliases, and smart mirror selection.

## 特性

*   ⚡️ **原生速度**: 使用 Bun 编写并编译为原生二进制文件，启动极快。
*   📦 **单文件**: 只有一个二进制文件，无依赖，即插即用。
*   🛠 **功能完整**: 支持 `install`, `use`, `ls`, `ls-remote`, `alias`, `run`, `exec`, `which`, `cache`, `deactivate`, `setup` 等常用命令。
*   💻 **跨平台**: 支持 macOS (Apple Silicon & Intel), Linux (x64 & ARM64), Windows (x64)。
*   🌐 **网络优化**: 国内用户自动优先使用 npmmirror，GitHub 下载提供环境变量加速。
*   🛡 **冲突管理**: 自动检测并可交互式卸载与 bvm 冲突的官方 Bun 安装。

## 安装

### 方式一：一键安装脚本 (推荐)

```bash
curl -fsSL https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash
# 或者使用 wget
wget -qO- https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash
```

### 方式二：下载二进制文件

前往 [Releases](https://github.com/bvm-cli/bvm/releases) 页面下载对应你系统的版本。

下载后，添加执行权限并移动到 PATH 路径下：

```bash
chmod +x bvm # Windows 用户不需要此步骤
sudo mv bvm /usr/local/bin/ # 或其他 PATH 目录
```

### 方式三：从源码编译

如果你已经安装了 Bun：

```bash
git clone https://github.com/bvm-cli/bvm.git
cd bvm
bun install
bun build src/index.ts --compile --outfile bvm
./bvm help
```

## 配置

首次运行 `bvm install` 时会自动尝试配置，你也可以手动运行 `bvm setup`。
将以下内容添加到你的 Shell 配置文件 (`.bashrc`, `.zshrc`, `.profile`, `config.fish` 或 PowerShell `$PROFILE`) 中：

```bash
# BVM Configuration
export BVM_DIR="$HOME/.bvm"
export PATH="$BVM_DIR/bin:$PATH"
```
或者在 PowerShell 中：
```powershell
$env:BVM_DIR = "$HOME\.bvm"
$env:PATH = "$env:BVM_DIR\bin;$env:PATH"
```

修改后，请**重启终端**或运行 `source ~/.bashrc` (等) 使配置生效。

### GitHub 下载加速 (国内用户)

如果你在中国大陆，且下载 GitHub Releases 文件速度缓慢，可以通过设置环境变量来加速：

```bash
export BVM_GITHUB_MIRROR="https://mirror.ghproxy.com/"
# 或者你信任的任何其他 GitHub 文件加速服务
```
将此行添加到你的 Shell 配置文件中。

## 使用指南

```bash
# 查看所有命令和用法
bvm --help

# 列出所有可用的远程版本
bvm ls-remote

# 安装特定版本
bvm install 1.0.0
bvm install latest             # 安装最新稳定版
bvm install                    # 如果有 .bvmrc 文件，则安装其中指定的版本

# 切换版本
bvm use 1.0.0
bvm use                        # 如果有 .bvmrc 文件，则切换到其中指定的版本

# 列出本地已安装版本及别名
bvm ls

# 显示当前激活版本
bvm current

# 显示指定版本的安装路径
bvm which 1.0.0
bvm which latest
bvm which current

# 运行临时命令 (不切换全局版本)
bvm run 1.0.0 --version
bvm exec latest bun run my-script.ts

# 卸载版本
bvm uninstall 1.0.0

# 创建版本别名
bvm alias default 1.0.0        # 将 1.0.0 设置为默认版本
bvm alias node-lts latest      # 别名也可以指向动态版本或已安装版本

# 删除版本别名
bvm unalias default

# 管理缓存
bvm cache dir                  # 显示缓存目录
bvm cache clear                # 清理下载缓存

# 停用 bvm 管理的 Bun 版本
bvm deactivate

## 贡献

欢迎提交 PR 和 Issue！

## License

MIT
