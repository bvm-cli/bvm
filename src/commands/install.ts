import { join, basename } from 'path';
import { BVM_VERSIONS_DIR, BVM_BIN_DIR, BVM_CACHE_DIR, EXECUTABLE_NAME, IS_TEST_MODE } from '../constants';
import { ensureDir, pathExists, createSymlink, removeDir, resolveVersion, normalizeVersion } from '../utils';
import { findBunDownloadUrl, fetchBunVersions } from '../api';
import ora from 'ora';
import chalk from 'chalk';
import { chmod } from 'fs/promises';
import { createWriteStream } from 'fs';
import cliProgress from 'cli-progress';
import { configureShell } from './setup';
import { getRcVersion } from '../rc';
import { getInstalledVersions } from '../utils';
import { createAlias } from './alias';

/**
 * Installs a specific Bun version.
 * @param targetVersion The version to install (e.g., "1.0.0", "latest"). Optional if .bvmrc exists.
 */
export async function installBunVersion(targetVersion?: string): Promise<void> {
  let versionToInstall = targetVersion;

  if (!versionToInstall) {
    versionToInstall = await getRcVersion() || undefined;
    if (versionToInstall) {
        console.log(chalk.blue(`Found '.bvmrc' with version <${versionToInstall}>`));
    }
  }

  if (!versionToInstall) {
    console.error(chalk.red('No version specified and no .bvmrc found. Usage: bvm install <version>'));
    return;
  }

  const spinner = ora(`Finding Bun ${versionToInstall} release...`).start();
  try {
    // Fetch all remote versions for resolution
    const remoteVersions = await fetchBunVersions();
    // Filter out 'canary' versions as they are not stable for installation
    const filteredRemoteVersions = remoteVersions
      .filter(v => !v.includes('canary'))
      .map(v => normalizeVersion(v)); // Normalize versions before passing to resolveVersion

    // Resolve the target version using fuzzy matching against remote versions
    const resolvedVersion = resolveVersion(versionToInstall, filteredRemoteVersions);

    if (!resolvedVersion) {
        spinner.fail(chalk.red(`Could not find a Bun release for '${versionToInstall}' compatible with your system.`));
        console.log(chalk.blue(`Available remote versions: ${filteredRemoteVersions.length > 0 ? filteredRemoteVersions.join(', ') : 'None'}`));
        throw new Error(`Could not find a Bun release for '${versionToInstall}' compatible with your system.`);
    }

    // 1. Find download URL using the resolved version
    const result = await findBunDownloadUrl(resolvedVersion);
    if (!result) {
      // This case should ideally not be hit if resolvedVersion came from findBunDownloadUrl itself
      spinner.fail(chalk.red(`Could not find a Bun release for ${resolvedVersion} compatible with your system.`));
      throw new Error(`Could not find a Bun release for ${resolvedVersion} compatible with your system.`);
    }
    const { url, foundVersion } = result;

    const installDir = join(BVM_VERSIONS_DIR, foundVersion);
    const bunExecutablePath = join(installDir, EXECUTABLE_NAME);

    if (await pathExists(bunExecutablePath)) {
      spinner.info(chalk.blue(`Bun ${foundVersion} is already installed.`));
      await configureShell();
      return;
    }

    if (IS_TEST_MODE) {
      await ensureDir(installDir);
      await writeTestBunBinary(bunExecutablePath, foundVersion);
    } else {
      spinner.text = `Initiating download for Bun ${foundVersion}...`;
      await ensureDir(BVM_CACHE_DIR);
      const filename = `${foundVersion}-${basename(url)}`;
      const cachedArchivePath = join(BVM_CACHE_DIR, filename);
      let downloaded = false;

      if (await pathExists(cachedArchivePath)) {
        spinner.succeed(chalk.green(`Using cached Bun ${foundVersion} archive.`));
        downloaded = true;
      } else {
        spinner.stop();
        console.log(chalk.cyan(`Downloading Bun ${foundVersion} to cache...`));
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download Bun: ${response.statusText} (${response.status})`);
        }

        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        let progressBar: cliProgress.SingleBar | null = null;
        if (totalBytes > 0) {
          progressBar = new cliProgress.SingleBar({
            format: ` {bar} | ${chalk.green('{percentage}%')} | {value}/{total} Bytes | ETA: {eta}s | Speed: {speed} kbit`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
          }, cliProgress.Presets.shades_classic);
          progressBar.start(totalBytes, 0, { speed: "N/A" });
        } else {
          console.log(chalk.cyan(`Downloading Bun ${foundVersion} (size unknown)...`));
        }

        const fileWriter = createWriteStream(cachedArchivePath);

        if (response.body) {
          const reader = response.body.getReader();
          let loaded = 0;
          let lastLoaded = 0;
          let lastTime = Date.now();

          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              fileWriter.write(value);
              loaded += value.length;
              if (progressBar) {
                const now = Date.now();
                const diffTime = now - lastTime;
                if (diffTime >= 500) {
                  const speed = (loaded - lastLoaded) / diffTime * 1000 / 1024 * 8;
                  progressBar.update(loaded, { speed: speed.toFixed(2) });
                  lastLoaded = loaded;
                  lastTime = now;
                } else {
                  progressBar.update(loaded);
                }
              }
            }
            fileWriter.end();
          };
          await pump();
        }

        if (progressBar) {
          progressBar.stop();
          console.log('');
        }
      }

      spinner.start(`Extracting Bun ${foundVersion}...`);
      await ensureDir(installDir);

      if (cachedArchivePath.endsWith('.zip')) {
        const extractZip = await import('extract-zip');
        const extract = extractZip.default || extractZip;
        await extract(cachedArchivePath, { dir: installDir });
      } else if (cachedArchivePath.endsWith('.tar.gz')) {
        const process = Bun.spawnSync(['tar', '-xzf', cachedArchivePath, '-C', installDir]);
        if (process.exitCode !== 0) {
          throw new Error(`Failed to extract tar.gz: ${process.stderr.toString()}`);
        }
      } else {
        throw new Error('Unsupported archive format.');
      }

      let finalBunPath = '';
      const possibleBunPaths = [
        join(installDir, EXECUTABLE_NAME),
        join(installDir, 'bun-darwin-x64', EXECUTABLE_NAME),
        join(installDir, 'bun-darwin-aarch64', EXECUTABLE_NAME),
        join(installDir, 'bun-linux-x64', EXECUTABLE_NAME),
        join(installDir, 'bun-linux-aarch64', EXECUTABLE_NAME),
        join(installDir, 'bun', EXECUTABLE_NAME),
      ];

      const dirEntries = await Bun.$`ls ${installDir}`.text();
      const subDirs = dirEntries.split('\n').filter(s => s.trim().length > 0 && s.startsWith('bun-'));
      for (const subDir of subDirs) {
        possibleBunPaths.push(join(installDir, subDir, EXECUTABLE_NAME));
        possibleBunPaths.push(join(installDir, subDir, 'bin', EXECUTABLE_NAME));
      }

      for (const p of possibleBunPaths) {
        if (await pathExists(p)) {
          finalBunPath = p;
          break;
        }
      }

      if (!finalBunPath) {
        throw new Error(`Could not find bun executable in ${installDir}`);
      }

      if (finalBunPath !== bunExecutablePath) {
        await Bun.$`mv ${finalBunPath} ${bunExecutablePath}`;
        const parentDir = join(finalBunPath, '..');
        if (parentDir !== installDir && parentDir.startsWith(installDir)) {
          await removeDir(parentDir);
        }
      }

      await chmod(bunExecutablePath, 0o755);
    }

    // Note: We DO NOT delete cachedArchivePath here. That's the point of caching.

    spinner.succeed(chalk.green(`Bun ${foundVersion} installed successfully.`));

    spinner.text = `Activating Bun ${foundVersion}...`;
    await ensureDir(BVM_BIN_DIR);
    await createSymlink(bunExecutablePath, join(BVM_BIN_DIR, 'bun'));
    spinner.succeed(chalk.green(`Bun ${foundVersion} is now active.`));
    
    // Auto-set as default if this is the first installed version
    const currentlyInstalledVersions = await getInstalledVersions();
    // After install, the newly installed version will be in the list, so if size is 1, it's the first.
    if (currentlyInstalledVersions.length === 1 && currentlyInstalledVersions[0] === foundVersion) {
        console.log(chalk.blue(`This is the first Bun version installed. Setting 'default' alias to ${foundVersion}.`));
        // Use the alias creation logic
        await createAlias('default', foundVersion); 
    }
    
    await configureShell();

  } catch (error: any) {
    if (spinner.isSpinning) spinner.stop();
    throw new Error(`\nFailed to install Bun: ${error.message}`);
  }
}

async function writeTestBunBinary(targetPath: string, version: string): Promise<void> {
  const plainVersion = version.replace(/^v/, '');
  const script = `#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 0 ]]; then
  if [[ "$1" == "--version" ]]; then
    echo "${plainVersion}"
    exit 0
  fi
fi

echo "Bun ${plainVersion} stub invoked with: $@"
exit 0
`;
  await Bun.write(targetPath, script);
  await chmod(targetPath, 0o755);
}
