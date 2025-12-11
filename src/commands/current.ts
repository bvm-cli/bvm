import ora from 'ora';
import chalk from 'chalk';
import { BVM_CURRENT_BUN_PATH } from '../constants';
import { readlink } from 'fs/promises';
import { normalizeVersion } from '../utils';

/**
 * Displays the currently active Bun version.
 */
export async function displayCurrentVersion(): Promise<void> {
  const spinner = ora('Checking current Bun version...').start();
  try {
    let currentVersion: string | null = null;

    try {
      const symlinkTarget = await readlink(BVM_CURRENT_BUN_PATH);
      // The symlink target is typically ~/.bvm/versions/vX.Y.Z/bun
      // We need to extract vX.Y.Z from it.
      const parts = symlinkTarget.split('/');
      currentVersion = parts[parts.length - 2]; // Get the version part
      if (currentVersion) {
        currentVersion = normalizeVersion(currentVersion); // Ensure it's in vX.Y.Z format
      }
    } catch (error: any) {
      if (error.code === 'ENOENT' || error.code === 'EINVAL') {
        // Symlink doesn't exist or is invalid, no current version
        currentVersion = null;
      } else {
        throw error;
      }
    }

    if (currentVersion) {
      spinner.succeed(chalk.green(`Current Bun version: ${currentVersion}`));
    } else {
      spinner.info(chalk.blue('No Bun version is currently active.'));
      console.log(chalk.yellow(`Use 'bvm install <version>' to install a version and 'bvm use <version>' to activate it.`));
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to determine current Bun version: ${error.message}`));
    console.error(error);
    throw error;
  }
}
