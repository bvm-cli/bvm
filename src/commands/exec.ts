import chalk from 'chalk';
import { join } from 'path';
import { BVM_VERSIONS_DIR, EXECUTABLE_NAME } from '../constants';
import { pathExists, normalizeVersion } from '../utils';
import { spawn } from 'child_process';
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
    spinner.stop(); // Stop spinner as output will go to console

    // 2. Construct a temporary PATH
    const env = { ...process.env };
    // Prepend the bun version's install directory to PATH
    // This makes sure that 'bun', 'bunx' (and potentially other tools if bun provides them there)
    // from this specific version are found first.
    // However, if the command itself is 'bun', we explicitly use bunExecutablePath.
    env.PATH = `${installPath}:${process.env.PATH}`;

    // 3. Execute the command
    const child = spawn(command, args, {
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
      console.error(chalk.red(`Failed to start command '${command}': ${err.message}`));
      process.exit(1);
    });
    },
    { failMessage: `Failed to execute command with Bun ${targetVersion}'s environment` },
  );
}
