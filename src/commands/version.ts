import { join } from 'path';
import { BVM_ALIAS_DIR, BVM_VERSIONS_DIR, BVM_CURRENT_BUN_PATH } from '../constants';
import { getInstalledVersions, normalizeVersion, pathExists, readTextFile } from '../utils';
import { readlink } from 'fs/promises';
import semver from 'semver';
import chalk from 'chalk';
import { withSpinner } from '../command-runner';

/**
 * Resolves a version-ish string to an installed version.
 * Supports:
 * - "current" -> currently active version
 * - "default" (or any alias) -> resolved alias
 * - "1.1" -> highest installed satisfying 1.1
 * - "1.1.38" -> exact match
 */
export async function resolveLocalVersion(spec: string): Promise<string | null> {
  // 1. Handle "current"
  if (spec === 'current') {
    if (await pathExists(BVM_CURRENT_BUN_PATH)) {
      try {
        const link = await readlink(BVM_CURRENT_BUN_PATH);
        const parts = link.split('/');
        return normalizeVersion(parts[parts.length - 2]);
      } catch { return null; }
    }
    return null;
  }

  // 2. Handle Alias or 'latest'
  if (spec === 'latest') {
      const installed = await getInstalledVersions();
      if (installed.length > 0) {
          // getInstalledVersions returns sorted list (descending)
          return installed[0];
      }
      return null;
  }

  const aliasPath = join(BVM_ALIAS_DIR, spec);
  if (await pathExists(aliasPath)) {
    try {
      const aliasTarget = (await readTextFile(aliasPath)).trim();
      return normalizeVersion(aliasTarget);
    } catch { return null; }
  }


  // 3. Handle Semver / Exact
  const normalizedSpec = normalizeVersion(spec);
  const installed = await getInstalledVersions(); // Returns normalized vX.Y.Z

  // Exact match
  if (installed.includes(normalizedSpec)) {
    return normalizedSpec;
  }

  // Range match (find highest installed satisfying spec)
  // Remove 'v' for semver.satisfies check if needed, but installed has 'v'.
  // semver.maxSatisfying works best.
  const cleanInstalled = installed.map(v => v); 
  // Note: installed versions from getInstalledVersions are usually sorted, but let's trust maxSatisfying
  
  const found = semver.maxSatisfying(cleanInstalled, spec);
  if (found) return found;
  
  // Try matching against 'v' prefix explicitly if spec didn't have it
  const foundV = semver.maxSatisfying(cleanInstalled, normalizedSpec);
  if (foundV) return foundV;

  return null;
}

export async function displayVersion(spec: string): Promise<void> {
  await withSpinner(
    `Resolving version '${spec}'...`,
    async () => {
      const version = await resolveLocalVersion(spec);
      if (version) {
        console.log(version);
      } else {
        throw new Error('N/A');
      }
    },
    { failMessage: `Failed to resolve version '${spec}'` },
  );
}
