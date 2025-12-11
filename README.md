# BVM (Bun Version Manager)

> **⚡️ The native version manager for Bun, driven by Bun. Cross-platform, shell-agnostic, and zero-dependency.**

`bvm` is a fast, efficient, and seamless version manager **built entirely with Bun, for the Bun JavaScript runtime**. It leverages Bun's native performance and ecosystem to provide a superior experience for managing multiple Bun installations on your system without external dependencies.

## ✨ Features

*   **⚡️ Bun-Native Performance**: Built and compiled to a single native binary **using Bun**, ensuring blazing-fast execution and a minimal footprint.
*   **📦 Zero-Dependency**: Distributed as a single executable file with no runtime dependencies.
*   **🛠 Comprehensive Commands**: Manage your Bun versions with `install`, `use`, `ls`, `ls-remote`, `alias`, `run`, `exec`, `which`, `cache`, `deactivate`, and `setup`.
*   **💻 Cross-Platform**: Full support for macOS (Apple Silicon & Intel), Linux (x64 & ARM64), and Windows (x64).
*   **🌐 Optimized Network**: Automatically prioritizes fast npm mirrors for version lookup in regions like China, and guides users on configuring GitHub download acceleration.
*   **🛡 Conflict Management**: Intelligently detects and offers interactive uninstallation of conflicting official Bun installations.
*   **⚙️ Smart Configuration**: Automatically configures your shell's PATH variable across various shells (`bash`, `zsh`, `fish`, PowerShell).

## 🚀 Installation

### Option 1: One-Line Install Script (Recommended)

The easiest way to install `bvm` is by running our convenient install script.

```bash
curl -fsSL https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash
# Or using wget:
# wget -qO- https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash
```

### Option 2: Download Binary (For CI/Advanced Users)

Download the pre-compiled binary for your system from the [GitHub Releases](https://github.com/bvm-cli/bvm/releases) page.

After downloading:

1.  **Grant execute permissions** (Unix/Linux/macOS only):
    ```bash
    chmod +x /path/to/your/bvm # e.g., chmod +x ~/Downloads/bvm
    ```
2.  **Move to your PATH**:
    ```bash
    sudo mv /path/to/your/bvm /usr/local/bin/ # On Unix/Linux/macOS
    # On Windows, move bvm.exe to a directory in your system PATH.
    ```

### Option 3: Build From Source

If you have Bun already installed:

```bash
git clone https://github.com/bvm-cli/bvm.git
cd bvm
bun install
bun build src/index.ts --compile --outfile bvm
./bvm help
```

## ⚙️ Configuration

`bvm` automatically attempts to configure your shell's PATH variable upon its first `install` command or when you run `bvm setup`.

To ensure `bvm` functions correctly, make sure `~/.bvm/bin` is in your system's `PATH`. The `bvm setup` command will append the necessary lines to your shell's configuration file (e.g., `.bashrc`, `.zshrc`, `config.fish`, or PowerShell `$PROFILE`).

**After installation or running `bvm setup`, please restart your terminal or source your shell configuration file (e.g., `source ~/.zshrc`) to apply changes.**

### GitHub Download Acceleration

If you experience slow download speeds for GitHub Release assets, you can set the `BVM_GITHUB_MIRROR` environment variable:

```bash
export BVM_GITHUB_MIRROR="https://mirror.ghproxy.com/" # Replace with your preferred mirror
```

Add this line to your shell's configuration file for a persistent effect.

## 💡 Usage

```bash
# 开发阶段：默认使用真实 HOME
npm run bvm -- ls

# 隔离测试：使用仓库本地的 .sandbox-home
npm run bvm:sandbox -- install 1.0.0

# Display all available commands and options
npm run bvm -- --help

# Install a specific Bun version
npm run bvm -- install 1.0.0
npm run bvm -- install latest             # Install the latest stable version
npm run bvm -- install                    # Installs the version specified in a local .bvmrc file

# Switch to a specific Bun version (globally for new shell sessions)
npm run bvm -- use 1.0.0
npm run bvm -- use                        # Switches to the version specified in a local .bvmrc file

# List locally installed Bun versions and configured aliases
bvm ls
bvm list                       # Alias for ls

```

# Display the installation path for a specific Bun version
bvm which 1.0.0
bvm which latest
bvm which current

# Run a command with a specific Bun version (without changing the global active version)
bvm run 1.0.0 --version        # Runs `bun --version` using Bun 1.0.0
bvm exec latest bun run my-script.ts # Executes `bun run my-script.ts` in the environment of the latest Bun

# Uninstall a specific Bun version
bvm uninstall 1.0.0

# Create an alias for a Bun version
bvm alias default 1.0.0        # Sets 1.0.0 as the default version
bvm alias node-lts latest      # Aliases can point to dynamic versions or specific installed versions

# Delete an existing alias
bvm unalias default

# Manage bvm's cache
bvm cache dir                  # Display the cache directory path
bvm cache clear                # Clear the download cache

# Deactivate the currently active bvm-managed Bun version
bvm deactivate

## ⚠️ Troubleshooting

*   **"Error: Unsupported OS" during install script**: Ensure your `uname -s` output is correctly handled. Update `install.sh` if necessary.
*   **"Permission denied" / 403 on push**: Verify your SSH key is added to GitHub and your remote URL is correctly configured (`git@github.com:...`).
*   **"Command not found: bun" after install**: Ensure `~/.bvm/bin` is correctly added to your `PATH` environment variable and your terminal is restarted or shell config sourced.
*   **Conflicts with other Bun installations**: If `bvm` detects conflicts, it will provide interactive guidance during `bvm setup`.

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 🗑️ Uninstallation

To completely remove `bvm` from your system:

1.  **Remove `bvm` paths from your shell configuration**:
    *   Edit your shell's configuration file (e.g., `~/.bashrc`, `~/.zshrc`, `~/.profile`, `~/.config/fish/config.fish` or PowerShell `$PROFILE`).
    *   Remove all lines related to `BVM_DIR` and `PATH` modifications for `bvm` (typically added by `bvm setup`).

2.  **Delete the `bvm` installation directory**:
    ```bash
    rm -rf "$BVM_DIR" # Or rm -rf ~/.bvm
    ```
    If you manually moved the `bvm` binary elsewhere (e.g., `/usr/local/bin/bvm`), remember to remove it as well:
    ```bash
    sudo rm -f /usr/local/bin/bvm # If installed globally
    ```

3.  **Restart your terminal** or run `source` on your shell configuration file to apply changes.

## 📄 License

This project is licensed under the MIT License.
