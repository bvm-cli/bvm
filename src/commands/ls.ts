import ora from 'ora';
import chalk from 'chalk';
import { getInstalledVersions, getSymlinkTarget, normalizeVersion, readDir, pathExists } from '../utils';
import { BVM_CURRENT_BUN_PATH, BVM_ALIAS_DIR, BVM_VERSIONS_DIR } from '../constants';
import { readlink, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Lists all locally installed Bun versions and configured aliases.
 */
export async function listLocalVersions(): Promise<void> {
  const spinner = ora('Fetching locally installed Bun versions...').start();
  try {
    const installedVersions = await getInstalledVersions(); // Returns normalized 'vX.Y.Z'
    let currentVersion: string | null = null; // Normalized 'vX.Y.Z'

    // Determine the currently active version by reading the symlink target
    try {
      const symlinkTarget = await readlink(BVM_CURRENT_BUN_PATH);
      const parts = symlinkTarget.split('/');
      currentVersion = normalizeVersion(parts[parts.length - 2]); 
    } catch (error: any) {
      if (error.code !== 'ENOENT' && error.code !== 'EINVAL') {
        throw error;
      }
    }

    spinner.succeed(chalk.green('Locally installed Bun versions:'));

    // Display installed versions
    if (installedVersions.length === 0) {
      console.log('  (No versions installed yet)');
    } else {
      installedVersions.forEach(version => {
        const displayVersion = version; // Already normalized
        if (displayVersion === currentVersion) {
          console.log(`* ${chalk.green(displayVersion)} (current)`);
        } else {
          console.log(`  ${displayVersion}`);
        }
      });
    }

    // Display aliases
    const aliasDirExists = await pathExists(BVM_ALIAS_DIR);
    if (aliasDirExists) {
        const aliasFiles = await readDir(BVM_ALIAS_DIR);
        if (aliasFiles.length > 0) {
            console.log(chalk.green('\nAliases:'));
            for (const aliasName of aliasFiles) {
                const aliasTargetVersion = (await readFile(join(BVM_ALIAS_DIR, aliasName), 'utf8')).trim();
                const normalizedAliasTarget = normalizeVersion(aliasTargetVersion);
                const isInstalled = installedVersions.includes(normalizedAliasTarget);
                
                let aliasStatus = `-> ${normalizedAliasTarget}`;
                if (!isInstalled) {
                    aliasStatus = `-> ${normalizedAliasTarget} (N/A - not installed)`;
                }
                if (normalizedAliasTarget === currentVersion) {
                    aliasStatus += ' (current)';
                }
                console.log(`  ${aliasName} ${chalk.cyan(aliasStatus)}`);
            }
        }
    }

  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to list local Bun versions: ${error.message}`));
    console.error(error);
    throw error;
  }
}
