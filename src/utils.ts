import { readdir, mkdir, stat, symlink, unlink, rm, readlink } from 'node:fs/promises';
import { join, dirname } from 'path';
import semver from 'semver';
import { BVM_VERSIONS_DIR } from './constants';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function pathExists(path: string): Promise<boolean> {
  const bunFile = Bun.file(path);
  if (await bunFile.exists()) {
    return true;
  }

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

export async function createSymlink(target: string, path: string): Promise<void> {
  if (await pathExists(path)) {
    await unlink(path);
  }
  await symlink(target, path, 'file');
}

export async function getSymlinkTarget(path: string): Promise<string | null> {
  try {
    return await readlink(path);
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.code === 'EINVAL') {
      return null;
    }
    throw error;
  }
}

export async function removeDir(dirPath: string): Promise<void> {
  if (await pathExists(dirPath)) {
    await rm(dirPath, { recursive: true, force: true });
  }
}

export async function readDir(dirPath: string): Promise<string[]> {
  if (!(await pathExists(dirPath))) {
    return [];
  }
  return readdir(dirPath);
}

export async function readTextFile(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${filePath}`);
  }
  return file.text();
}

export async function writeTextFile(filePath: string, data: string | Uint8Array): Promise<void> {
  await ensureDir(dirname(filePath));
  await Bun.write(filePath, data);
}

export function normalizeVersion(version: string): string {
  let normalized = version;
  if (normalized.startsWith('bun-v')) {
    normalized = normalized.substring(4);
  }
  if (!normalized.startsWith('v')) {
    normalized = `v${normalized}`;
  }
  return normalized;
}

export async function getInstalledVersions(): Promise<string[]> {
  await ensureDir(BVM_VERSIONS_DIR);
  const dirs = await readDir(BVM_VERSIONS_DIR);
  return dirs.filter(dir => semver.valid(normalizeVersion(dir))).sort(semver.rcompare);
}

export function resolveVersion(targetVersion: string, availableVersions: string[]): string | null {
  if (!targetVersion || availableVersions.length === 0) {
    return null;
  }

  const normalizedTarget = normalizeVersion(targetVersion);

  if (availableVersions.includes(normalizedTarget)) {
    return normalizedTarget;
  }

  if (targetVersion.toLowerCase() === 'latest') {
    return availableVersions[0];
  }

  const range = targetVersion.startsWith('v') ? `~${targetVersion.substring(1)}` : `~${targetVersion}`;
  const matches = availableVersions.filter(v => semver.satisfies(v, range));

  if (matches.length > 0) {
    return matches.sort(semver.rcompare)[0];
  }

  return null;
}
