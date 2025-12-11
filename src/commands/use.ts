import { join } from 'path';
import { BVM_BIN_DIR, BVM_VERSIONS_DIR, EXECUTABLE_NAME } from '../constants';
import { createSymlink, ensureDir, pathExists, normalizeVersion, resolveVersion, getInstalledVersions } from '../utils';
import chalk from 'chalk';
import semver from 'semver';
import { getRcVersion } from '../rc';
import { resolveLocalVersion } from './version';
import { withSpinner } from '../command-runner';

/**
 * Switches to a specific Bun version.
 * @param targetVersion The version to use (e.g., "1.0.0"). Optional if .bvmrc exists.
 */
export async function useBunVersion(targetVersion?: string): Promise<void> {
  let versionToUse = targetVersion;

  if (!versionToUse) {
    versionToUse = await getRcVersion() || undefined;
    if (versionToUse) {
        console.log(chalk.blue(`Found '.bvmrc' with version <${versionToUse}>`));
    }
  }

  if (!versionToUse) {
    console.error(chalk.red('No version specified and no .bvmrc found. Usage: bvm use <version>'));
    throw new Error('No version specified and no .bvmrc found.');
  }

  await withSpinner(
    `Attempting to use Bun ${versionToUse}...`,
    async (spinner) => {
      let finalResolvedVersion: string | null = null;

    // First, try resolving using resolveLocalVersion (handles aliases, 'current', 'latest' from installed)
    const resolvedFromLocal = await resolveLocalVersion(versionToUse);
    if (resolvedFromLocal) {
        finalResolvedVersion = resolvedFromLocal;
    } else {
        // If not resolved by resolveLocalVersion, then try fuzzy matching against installed versions
        const installedVersions = (await getInstalledVersions()).map(v => normalizeVersion(v));
        finalResolvedVersion = resolveVersion(versionToUse, installedVersions);
    }

    if (!finalResolvedVersion) {
      const installed = (await getInstalledVersions()).map(v => normalizeVersion(v));
      console.log(chalk.blue(`Available installed versions: ${installed.length > 0 ? installed.join(', ') : 'None'}`));
      throw new Error(`Bun version '${versionToUse}' is not installed or cannot be resolved.`);
    }

    // Use the final resolved version from now on
    const normalizedFinalResolvedVersion = normalizeVersion(finalResolvedVersion); // Normalize the resolved version

    // 1. Check if the version is installed locally
    const installPath = join(BVM_VERSIONS_DIR, normalizedFinalResolvedVersion);
    const bunExecutablePath = join(installPath, EXECUTABLE_NAME);

    // This check should ideally not fail if the version was resolved from installed versions
    if (!(await pathExists(bunExecutablePath))) {
      spinner.fail(chalk.red(`Internal Error: Bun ${finalResolvedVersion} was resolved but not found.`));
      throw new Error(`Internal Error: Bun ${finalResolvedVersion} was resolved but not found.`);
    }

    // 2. Create/update the symlink
    await ensureDir(BVM_BIN_DIR); // Ensure the bin directory exists
    await createSymlink(bunExecutablePath, join(BVM_BIN_DIR, EXECUTABLE_NAME));

    spinner.succeed(chalk.green(`Bun ${finalResolvedVersion} is now active.`));
    console.log(chalk.yellow(`Remember to add ${BVM_BIN_DIR} to your PATH environment variable to use bvm.`));
    },
    { failMessage: () => `Failed to use Bun ${versionToUse}` },
  );
}
