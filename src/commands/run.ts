import chalk from 'chalk';
import { join } from 'path';
import { BVM_VERSIONS_DIR, EXECUTABLE_NAME } from '../constants';
import { pathExists, normalizeVersion } from '../utils';
import { spawn } from 'child_process';
import { resolveLocalVersion } from './version';
import { withSpinner } from '../command-runner';

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
    spinner.stop(); // Stop spinner as output will go to console

    // 2. Construct a temporary PATH
    const env = { ...process.env };
    const bunBinPath = installPath; // The directory containing the bun executable
    env.PATH = `${bunBinPath}:${process.env.PATH}`;

    // 3. Execute the bun command
    const child = spawn(bunExecutablePath, args, {
      cwd: process.cwd(),
      env: env,
      stdio: 'inherit', // Inherit stdin/stdout/stderr
    });

      child.on('close', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`Command failed with exit code ${code}`));
      }
      process.exit(code || 0); // Exit with the child process's exit code
    });

      child.on('error', (err) => {
      console.error(chalk.red(`Failed to start Bun command: ${err.message}`));
      process.exit(1);
    });
    },
    { failMessage: `Failed to run command with Bun ${targetVersion}` },
  );
}
