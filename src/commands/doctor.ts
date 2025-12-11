import chalk from 'chalk';
import { readlink } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import {
  BVM_DIR,
  BVM_VERSIONS_DIR,
  BVM_BIN_DIR,
  BVM_ALIAS_DIR,
  BVM_CURRENT_BUN_PATH,
} from '../constants';
import {
  getInstalledVersions,
  normalizeVersion,
  pathExists,
  readDir,
} from '../utils';
import { withSpinner } from '../command-runner';

interface DoctorReport {
  currentVersion: string | null;
  installedVersions: string[];
  aliases: Array<{ name: string; target: string }>
  env: Record<string, string | undefined>;
}

export async function doctor(): Promise<void> {
  await withSpinner('Gathering BVM diagnostics...', async () => {
    const report: DoctorReport = {
      currentVersion: await detectCurrentVersion(),
      installedVersions: await getInstalledVersions(),
      aliases: await readAliases(),
      env: {
        BVM_DIR,
        BVM_BIN_DIR,
        BVM_VERSIONS_DIR,
        BVM_TEST_MODE: process.env.BVM_TEST_MODE,
        HOME: process.env.HOME || homedir(),
      },
    };

    printReport(report);
  });
}

async function detectCurrentVersion(): Promise<string | null> {
  if (!(await pathExists(BVM_CURRENT_BUN_PATH))) {
    return null;
  }
  try {
    const target = await readlink(BVM_CURRENT_BUN_PATH);
    const parts = target.split('/');
    return normalizeVersion(parts[parts.length - 2]);
  } catch {
    return null;
  }
}

async function readAliases(): Promise<Array<{ name: string; target: string }>> {
  if (!(await pathExists(BVM_ALIAS_DIR))) {
    return [];
  }
  const files = await readDir(BVM_ALIAS_DIR);
  const entries: Array<{ name: string; target: string }> = [];
  for (const alias of files) {
    const targetPath = join(BVM_ALIAS_DIR, alias);
    if (await pathExists(targetPath)) {
      const file = await Bun.file(targetPath).text();
      entries.push({ name: alias, target: normalizeVersion(file.trim()) });
    }
  }
  return entries;
}

function printReport(report: DoctorReport): void {
  console.log(chalk.bold('\nDirectories'));
  console.log(`  BVM_DIR: ${chalk.cyan(report.env.BVM_DIR || '')}`);
  console.log(`  BIN_DIR: ${chalk.cyan(BVM_BIN_DIR)}`);
  console.log(`  VERSIONS_DIR: ${chalk.cyan(BVM_VERSIONS_DIR)}`);

  console.log(chalk.bold('\nEnvironment'));
  console.log(`  HOME: ${report.env.HOME || 'n/a'}`);
  console.log(`  BVM_TEST_MODE: ${report.env.BVM_TEST_MODE || 'false'}`);

  console.log(chalk.bold('\nInstalled Versions'));
  if (report.installedVersions.length === 0) {
    console.log('  (none installed)');
  } else {
    report.installedVersions.forEach((version) => {
      const marker = version === report.currentVersion ? chalk.green(' (current)') : '';
      console.log(`  ${version}${marker}`);
    });
  }

  console.log(chalk.bold('\nAliases'));
  if (report.aliases.length === 0) {
    console.log('  (no aliases configured)');
  } else {
    report.aliases.forEach((alias) => {
      console.log(`  ${alias.name} -> ${alias.target}`);
    });
  }

  console.log('\n' + chalk.green('Diagnostics complete.'));
}
