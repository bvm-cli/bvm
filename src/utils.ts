import { readdir, mkdir, stat, symlink, unlink, rm, readlink } from 'fs/promises';
import { join } from 'path';
import semver from 'semver';
import { BVM_VERSIONS_DIR } from './constants';

/**
 * Ensures a directory exists, creating it if it doesn't.
 * @param dirPath The path to the directory.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Checks if a path exists.
 * @param path The path to check.
 * @returns True if the path exists, false otherwise.
 */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Creates a symbolic link.
 * @param target The target path.
 * @param path The path to create the symlink at.
 */
export async function createSymlink(target: string, path: string): Promise<void> {
  // Remove existing symlink or file at path
  if (await pathExists(path)) {
    await unlink(path);
  }
  await symlink(target, path, 'file'); // 'file' type for cross-platform compatibility
}

/**
 * Reads the target of a symbolic link.
 * @param path The path to the symlink.
 * @returns The target path, or null if it's not a symlink or doesn't exist.
 */
export async function getSymlinkTarget(path: string): Promise<string | null> {
  try {
    return await readlink(path);
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.code === 'EINVAL') {
      // ENOENT: path does not exist
      // EINVAL: path is not a symlink (on some systems)
      return null;
    }
    throw error;
  }
}


/**
 * Recursively removes a directory.
 * @param dirPath The path to the directory to remove.
 */
export async function removeDir(dirPath: string): Promise<void> {
  if (await pathExists(dirPath)) {
    await rm(dirPath, { recursive: true, force: true });
  }
}

/**
 * Reads the contents of a directory.
 * @param dirPath The path to the directory.
 * @returns An array of file/directory names.
 */
export async function readDir(dirPath: string): Promise<string[]> {
  if (!(await pathExists(dirPath))) {
    return [];
  }
  return readdir(dirPath);
}

/**
 * Normalizes a version string (e.g., adds 'v' prefix if missing, removes 'bun-v' prefix).
 * @param version The version string.
 * @returns The normalized version string (e.g., 'v1.0.0').
 */
export function normalizeVersion(version: string): string {
  let normalized = version;
  if (normalized.startsWith('bun-v')) {
    normalized = normalized.substring(4); // Remove "bun-"
  }
  if (!normalized.startsWith('v')) {
    normalized = `v${normalized}`;
  }
  return normalized;
}

/**
 * Gets all locally installed Bun versions.
 * @returns An array of installed version strings, sorted by semver.
 */
export async function getInstalledVersions(): Promise<string[]> {
  await ensureDir(BVM_VERSIONS_DIR);
  const dirs = await readDir(BVM_VERSIONS_DIR);
  return dirs.filter(dir => semver.valid(normalizeVersion(dir))).sort(semver.rcompare);
}

/**
 * Resolves a target version string (e.g., "1.3", "latest") to an exact full version
 * from a list of available versions.
 * @param targetVersion The desired version string (e.g., "1.3", "v1.3.4", "latest").
 * @param availableVersions An array of full, valid semver strings (e.g., "v1.3.4").
 * @returns The resolved full version string (e.g., "v1.3.4") or null if no match.
 */
export function resolveVersion(targetVersion: string, availableVersions: string[]): string | null {
  if (!targetVersion || availableVersions.length === 0) {
    return null;
  }

  const normalizedTarget = normalizeVersion(targetVersion);

  // 1. Exact match
  if (availableVersions.includes(normalizedTarget)) {
    return normalizedTarget;
  }

  // 2. Handle "latest" keyword
  if (targetVersion.toLowerCase() === 'latest') {
    // availableVersions should already be rsorted, so the first one is latest
    return availableVersions[0];
  }

  // 3. Fuzzy match (e.g., "1.3" should resolve to "v1.3.4")
  // Create a semver range from the target version
  let range: string;
  if (!targetVersion.startsWith('v')) {
    range = `~${targetVersion}`; // e.g., "1.2" -> "~1.2"
  } else {
    range = `~${targetVersion.substring(1)}`; // e.g., "v1.2" -> "~1.2"
  }

  const matches = availableVersions.filter(v => semver.satisfies(v, range));

  if (matches.length > 0) {
    // Return the highest version that satisfies the range
    return matches.sort(semver.rcompare)[0];
  }

  return null;
}

