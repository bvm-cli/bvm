import chalk from 'chalk';
import { join } from 'path';
import { BVM_ALIAS_DIR } from '../constants';
import { pathExists } from '../utils';
import { unlink } from 'fs/promises';
import { withSpinner } from '../command-runner';

/**
 * Removes an existing alias.
 * @param aliasName The name of the alias to remove.
 */
export async function removeAlias(aliasName: string): Promise<void> {
  await withSpinner(
    `Removing alias '${aliasName}'...`,
    async (spinner) => {
      const aliasFilePath = join(BVM_ALIAS_DIR, aliasName);

      // 1. Check if the alias file exists
      if (!(await pathExists(aliasFilePath))) {
        throw new Error(`Alias '${aliasName}' does not exist.`);
      }

      // 2. Remove the alias file
      await unlink(aliasFilePath);

      spinner.succeed(chalk.green(`Alias '${aliasName}' removed successfully.`));
    },
    { failMessage: `Failed to remove alias '${aliasName}'` },
  );
}
