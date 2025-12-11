import ora from 'ora';
import chalk from 'chalk';
import { join } from 'path';
import { BVM_ALIAS_DIR, BVM_VERSIONS_DIR } from '../constants';
import { ensureDir, pathExists, normalizeVersion } from '../utils';
import { writeFile } from 'fs/promises';
import { resolveLocalVersion } from './version';

/**
 * Creates an alias for a Bun version.
 * @param aliasName The name of the alias (e.g., "default", "lts").
 * @param targetVersion The Bun version to alias (e.g., "1.0.0", "latest").
 */
export async function createAlias(aliasName: string, targetVersion: string): Promise<void> {
  const spinner = ora(`Creating alias '${aliasName}' for Bun ${targetVersion}...`).start();
  try {
    // Resolve the target version to a concrete installed version
    const resolvedVersion = await resolveLocalVersion(targetVersion);
    
    if (!resolvedVersion) {
        spinner.fail(chalk.red(`Bun version '${targetVersion}' is not installed. Cannot create alias.`));
        console.log(chalk.blue(`Please install Bun ${targetVersion} first using: bvm install ${targetVersion}`));
        process.exit(1);
    }

    const versionPath = join(BVM_VERSIONS_DIR, resolvedVersion);

    // 1. Check if the target version is installed (redundant after resolveLocalVersion, but harmless)
    if (!(await pathExists(versionPath))) {
      // This case should ideally not be hit if resolveLocalVersion works correctly.
      spinner.fail(chalk.red(`Internal Error: Resolved Bun version ${resolvedVersion} not found.`));
      process.exit(1);
    }

    // 2. Ensure alias directory exists
    await ensureDir(BVM_ALIAS_DIR);

    // 3. Write the alias file
    const aliasFilePath = join(BVM_ALIAS_DIR, aliasName);
    await writeFile(aliasFilePath, resolvedVersion, 'utf8');

    spinner.succeed(chalk.green(`Alias '${aliasName}' created for Bun ${resolvedVersion}.`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to create alias '${aliasName}': ${error.message}`));
    console.error(error);
    process.exit(1);
  }
}
