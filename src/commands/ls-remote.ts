import ora from 'ora';
import chalk from 'chalk';
import semver from 'semver';
import { normalizeVersion } from '../utils';
import { fetchBunVersions } from '../api';

/**
 * Lists all available remote Bun versions.
 */
export async function listRemoteVersions(): Promise<void> {
  const spinner = ora('Fetching remote Bun versions...').start();
  try {
    const versions = await fetchBunVersions();
    
    // Sort versions in descending order
    // Filter for valid semver just in case
    const sortedVersions = versions
      .filter(v => semver.valid(v))
      .filter(v => !v.includes('canary'))
      .sort(semver.rcompare);

    if (sortedVersions.length === 0) {
        spinner.fail(chalk.yellow('No versions found.'));
        throw new Error('No remote Bun versions found.');
    }

    spinner.succeed(chalk.green('Available remote Bun versions:'));
    sortedVersions.forEach(version => {
      console.log(`  ${normalizeVersion(version)}`);
    });
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to fetch remote Bun versions: ${error.message}`));
    throw error;
  }
}
