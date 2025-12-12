import { homedir } from 'os';
import { join } from 'path';

// Platform detection
export const OS_PLATFORM = process.platform;
export const CPU_ARCH = process.arch;
export const IS_TEST_MODE = process.env.BVM_TEST_MODE === 'true';
export const TEST_REMOTE_VERSIONS = ['v1.3.4', 'v1.2.23', 'v1.0.0', 'bun-v1.4.0-canary'];

// BVM Home Directory (~/.bvm)
// Prefer process.env.HOME to avoid potential issues with os.homedir() in compiled binaries
const HOME = process.env.HOME || homedir();
export const BVM_DIR = join(HOME, '.bvm');
// Directory for installed Bun versions (~/.bvm/versions)
export const BVM_VERSIONS_DIR = join(BVM_DIR, 'versions');
// Directory for symlinks to active Bun version (~/.bvm/bin)
export const BVM_BIN_DIR = join(BVM_DIR, 'bin');
// Directory for aliases (~/.bvm/alias)
export const BVM_ALIAS_DIR = join(BVM_DIR, 'alias');
// Directory for cache (~/.bvm/cache)
export const BVM_CACHE_DIR = join(BVM_DIR, 'cache');
// Executable name (bun or bun.exe)
export const EXECUTABLE_NAME = OS_PLATFORM === 'win32' ? 'bun.exe' : 'bun';
// Path to the active bun executable symlink (~/.bvm/bin/bun)
export const BVM_CURRENT_BUN_PATH = join(BVM_BIN_DIR, EXECUTABLE_NAME);

// GitHub API for Bun releases
export const BUN_GITHUB_RELEASES_API = 'https://api.github.com/repos/oven-sh/bun/releases';

// Repository for BVM CLI
export const REPO_FOR_BVM_CLI = 'bvm-cli/bvm';
// Asset name for BVM CLI releases
export const ASSET_NAME_FOR_BVM = OS_PLATFORM === 'win32' ? 'bvm.exe' : 'bvm';

// User Agent for GitHub API requests
export const USER_AGENT = 'bvm (Bun Version Manager)';

// Mapping Bun release asset names to a more generic format for download
// Bun release assets follow the naming convention: bun-<platform>-<arch>.zip
export function getBunAssetName(version: string): string {
  let platform: string;
  let arch: string;

  switch (OS_PLATFORM) {
    case 'darwin':
      platform = 'darwin';
      break;
    case 'linux':
      platform = 'linux';
      break;
    case 'win32':
      platform = 'windows';
      break;
    default:
      throw new Error(`Unsupported OS platform: ${OS_PLATFORM}`);
  }

  switch (CPU_ARCH) {
    case 'arm64':
      // Bun uses 'aarch64' for Apple Silicon and ARM64 Linux
      arch = 'aarch64';
      break;
    case 'x64':
      arch = 'x64';
      break;
    default:
      throw new Error(`Unsupported CPU architecture: ${CPU_ARCH}`);
  }

  // Bun officially distributes .zip files for all platforms (darwin, linux, windows)
  // Example: bun-darwin-aarch64.zip, bun-linux-x64.zip
  return `bun-${platform}-${arch}.zip`;
}
