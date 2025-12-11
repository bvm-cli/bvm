import { unlink } from 'fs/promises';
import { BVM_CURRENT_BUN_PATH } from '../constants';
import { pathExists } from '../utils';
import chalk from 'chalk';
import { withSpinner } from '../command-runner';

export async function deactivate(): Promise<void> {
  await withSpinner(
    'Deactivating current Bun version...',
    async (spinner) => {
      if (await pathExists(BVM_CURRENT_BUN_PATH)) {
        await unlink(BVM_CURRENT_BUN_PATH);
        spinner.succeed(chalk.green('Current Bun version deactivated.'));
        console.log(chalk.gray(`Path ${BVM_CURRENT_BUN_PATH} has been removed.`));
      } else {
        spinner.info('No Bun version is currently active via bvm.');
      }
    },
    { failMessage: 'Failed to deactivate' },
  );
}
