import chalk from 'chalk';
import { join } from 'path';
import { BVM_ALIAS_DIR, BVM_VERSIONS_DIR } from '../constants';
import { ensureDir, pathExists, normalizeVersion, writeTextFile } from '../utils';
import { resolveLocalVersion } from './version';
import { withSpinner } from '../command-runner';

/**
 * Creates an alias for a Bun version.
 * @param aliasName The name of the alias (e.g., "default", "lts").
 * @param targetVersion The Bun version to alias (e.g., "1.0.0", "latest").
 */
export async function createAlias(aliasName: string, targetVersion: string): Promise<void> {
  await withSpinner(
    `Creating alias '${aliasName}' for Bun ${targetVersion}...`,
    async (spinner) => {
      // Resolve the target version to a concrete installed version
      const resolvedVersion = await resolveLocalVersion(targetVersion);
      
      if (!resolvedVersion) {
        console.log(chalk.blue(`Please install Bun ${targetVersion} first using: bvm install ${targetVersion}`));
        throw new Error(`Bun version '${targetVersion}' is not installed. Cannot create alias.`);
      }

      const versionPath = join(BVM_VERSIONS_DIR, resolvedVersion);

      // 1. Check if the target version is installed (redundant after resolveLocalVersion, but harmless)
      if (!(await pathExists(versionPath))) {
        // This case should ideally not be hit if resolveLocalVersion works correctly.
        throw new Error(`Internal Error: Resolved Bun version ${resolvedVersion} not found.`);
      }

      // 2. Ensure alias directory exists
      await ensureDir(BVM_ALIAS_DIR);

    // 3. Write the alias file
    const aliasFilePath = join(BVM_ALIAS_DIR, aliasName);
    await writeTextFile(aliasFilePath, `${resolvedVersion}\n`);

      spinner.succeed(chalk.green(`Alias '${aliasName}' created for Bun ${resolvedVersion}.`));
    },
    { failMessage: `Failed to create alias '${aliasName}'` },
  );
}
