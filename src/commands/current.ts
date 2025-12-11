import chalk from 'chalk';
import { BVM_CURRENT_BUN_PATH } from '../constants';
import { readlink } from 'fs/promises';
import { normalizeVersion } from '../utils';
import { withSpinner } from '../command-runner';

/**
 * Displays the currently active Bun version.
 */
export async function displayCurrentVersion(): Promise<void> {
  await withSpinner(
    'Checking current Bun version...',
    async (spinner) => {
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
    },
    { failMessage: 'Failed to determine current Bun version' },
  );
}
