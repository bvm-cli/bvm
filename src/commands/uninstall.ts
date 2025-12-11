import chalk from 'chalk';
import { join } from 'path';
import { BVM_VERSIONS_DIR, BVM_CURRENT_BUN_PATH, EXECUTABLE_NAME } from '../constants';
import { pathExists, removeDir, normalizeVersion } from '../utils';
import { readlink } from 'fs/promises';
import { withSpinner } from '../command-runner';

/**
 * Uninstalls a specific Bun version.
 * @param targetVersion The version to uninstall (e.g., "1.0.0").
 */
export async function uninstallBunVersion(targetVersion: string): Promise<void> {
  await withSpinner(
    `Attempting to uninstall Bun ${targetVersion}...`,
    async (spinner) => {
      const normalizedTargetVersion = normalizeVersion(targetVersion);
      const installPath = join(BVM_VERSIONS_DIR, normalizedTargetVersion);
      const bunExecutablePath = join(installPath, EXECUTABLE_NAME);

      // 1. Check if the version is installed locally
      if (!(await pathExists(bunExecutablePath))) {
        throw new Error(`Bun ${targetVersion} is not installed.`);
      }

    // 2. Check if the version is currently active
    let currentVersionPath: string | null = null;
    try {
      currentVersionPath = await readlink(BVM_CURRENT_BUN_PATH);
    } catch (error: any) {
      if (error.code !== 'ENOENT' && error.code !== 'EINVAL') {
        throw error;
      }
    }

    if (currentVersionPath && currentVersionPath.startsWith(installPath)) {
      throw new Error(`Bun ${targetVersion} is currently active. Please use 'bvm use <another-version>' or 'bvm deactivate' before uninstalling.`);
    }

    // 3. Remove the version directory
    await removeDir(installPath);
      spinner.succeed(chalk.green(`Bun ${normalizedTargetVersion} uninstalled successfully.`));
    },
    { failMessage: `Failed to uninstall Bun ${targetVersion}` },
  );
}
