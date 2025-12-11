import { join } from 'path';
import { BVM_VERSIONS_DIR, BVM_CURRENT_BUN_PATH, EXECUTABLE_NAME } from '../constants';
import { pathExists, normalizeVersion } from '../utils';
import { getRcVersion } from '../rc';
import { readlink } from 'fs/promises';
import chalk from 'chalk';
import { withSpinner } from '../command-runner';

/**
 * Displays the path to the executable for a specific Bun version.
 * @param version The version to look up. If omitted, uses .bvmrc or current.
 */
export async function whichBunVersion(version?: string): Promise<void> {
  let targetVersion = version;

  // 1. If no version provided, try .bvmrc
  if (!targetVersion) {
    targetVersion = await getRcVersion() || undefined;
  }

  await withSpinner(
    `Resolving Bun path for ${targetVersion || 'current'}...`,
    async () => {
      if (!targetVersion || targetVersion === 'current') {
        if (await pathExists(BVM_CURRENT_BUN_PATH)) {
          try {
            const realPath = await readlink(BVM_CURRENT_BUN_PATH);
            console.log(realPath);
          } catch {
            throw new Error('Unable to read current Bun symlink.');
          }
        } else {
          throw new Error('No active Bun version found (system version is not managed by bvm).');
        }
        return;
      }

      const normalized = normalizeVersion(targetVersion);
      const binPath = join(BVM_VERSIONS_DIR, normalized, EXECUTABLE_NAME);

      if (await pathExists(binPath)) {
        console.log(binPath);
      } else {
        throw new Error(`Bun ${targetVersion} (${normalized}) is not installed.`);
      }
    },
    { failMessage: 'Failed to resolve Bun path' },
  );
}
