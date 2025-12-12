import chalk from 'chalk';
import { join } from 'path';
import { BVM_VERSIONS_DIR, EXECUTABLE_NAME } from '../constants';
import { pathExists, normalizeVersion } from '../utils';
import { resolveLocalVersion } from './version';
import { withSpinner } from '../command-runner';
import { runCommand } from '../helpers/process';

/**
 * Runs a command using a specific Bun version.
 * @param targetVersion The Bun version to use.
 * @param args Additional arguments to pass to the bun command.
 */
export async function runWithBunVersion(targetVersion: string, args: string[]): Promise<void> {
  await withSpinner(
    `Preparing to run with Bun ${targetVersion}...`,
    async (spinner) => {
    // Resolve alias or 'latest' or 'current'
    let resolvedVersion = await resolveLocalVersion(targetVersion);
    
    // If resolveLocalVersion returns null, it might be that the version is not installed
    // OR it is a specific version string like '1.2.3' that resolveLocalVersion only matches if installed.
    // So if null, we assume the user meant a specific version and we normalize it to check existence.
    if (!resolvedVersion) {
        resolvedVersion = normalizeVersion(targetVersion);
    }

    const installPath = join(BVM_VERSIONS_DIR, resolvedVersion);
    const bunExecutablePath = join(installPath, EXECUTABLE_NAME);

    // 1. Check if the version is installed locally
      if (!(await pathExists(bunExecutablePath))) {
        spinner.fail(chalk.red(`Bun ${targetVersion} (resolved: ${resolvedVersion}) is not installed.`));
      console.log(chalk.blue(`You can install it using: bvm install ${targetVersion}`));
      return;
    }

    spinner.text = chalk.blue(`Executing 'bun ${args.join(' ')}' with Bun ${resolvedVersion}...`);
    spinner.stop();

    try {
      await runCommand([bunExecutablePath, ...args], {
        cwd: process.cwd(),
        prependPath: installPath,
      });
      process.exit(0);
    } catch (error: any) {
      console.error(error.message);
      process.exit(1);
    }
    },
    { failMessage: `Failed to run command with Bun ${targetVersion}` },
  );
}
