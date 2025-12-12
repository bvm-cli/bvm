import chalk from 'chalk';
import { join } from 'path';
import { BVM_VERSIONS_DIR, EXECUTABLE_NAME } from '../constants';
import { pathExists, normalizeVersion } from '../utils';
import { resolveLocalVersion } from './version';
import { withSpinner } from '../command-runner';

/**
 * Executes an arbitrary command using a specific Bun version's environment.
 * This sets up the PATH to prioritize the specified Bun version.
 * @param targetVersion The Bun version whose environment to use.
 * @param command The command to execute (e.g., 'bun', 'node', 'npm', 'yarn', 'ls').
 * @param args Additional arguments for the command.
 */
export async function execWithBunVersion(targetVersion: string, command: string, args: string[]): Promise<void> {
  await withSpinner(
    `Preparing environment for Bun ${targetVersion} to execute '${command}'...`,
    async (spinner) => {
    // Resolve alias or 'latest' or 'current'
    let resolvedVersion = await resolveLocalVersion(targetVersion);
    if (!resolvedVersion) {
        resolvedVersion = normalizeVersion(targetVersion);
    }

    const installPath = join(BVM_VERSIONS_DIR, resolvedVersion);
    const bunExecutablePath = join(installPath, EXECUTABLE_NAME); // Path to the bun executable itself

    // 1. Check if the specified Bun version is installed locally
      if (!(await pathExists(bunExecutablePath))) {
        spinner.fail(chalk.red(`Bun ${targetVersion} (resolved: ${resolvedVersion}) is not installed.`));
      console.log(chalk.blue(`You can install it using: bvm install ${targetVersion}`));
      return;
    }

    spinner.text = chalk.blue(`Executing '${command} ${args.join(' ')}' with Bun ${resolvedVersion}'s environment...`);
    spinner.stop();

    try {
      await runCommand([command, ...args], {
        cwd: process.cwd(),
        prependPath: installPath,
      });
      process.exit(0);
    } catch (error: any) {
      console.error(error.message);
      process.exit(1);
    }
    },
    { failMessage: `Failed to execute command with Bun ${targetVersion}'s environment` },
  );
}
