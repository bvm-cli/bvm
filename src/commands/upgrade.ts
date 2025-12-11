import chalk from 'chalk';
import semver from 'semver';
import { IS_TEST_MODE } from '../constants';
import { fetchLatestBvmReleaseInfo } from '../api';
import packageJson from '../../package.json';
import { withSpinner } from '../command-runner';

const CURRENT_VERSION = packageJson.version;

export async function upgradeBvm(): Promise<void> {
  try {
    await withSpinner(
      'Checking for BVM updates...',
      async (spinner) => {
    const latest = IS_TEST_MODE
      ? {
          tagName: process.env.BVM_TEST_LATEST_VERSION || `v${CURRENT_VERSION}`,
          downloadUrl: 'https://example.com/bvm-test',
        }
      : await fetchLatestBvmReleaseInfo();
    if (!latest) {
      throw new Error('Unable to determine the latest BVM version.');
    }

    const latestVersion = latest.tagName.startsWith('v') ? latest.tagName.slice(1) : latest.tagName;
    if (!semver.valid(latestVersion)) {
      throw new Error(`Unrecognized version received: ${latest.tagName}`);
    }

    if (!semver.gt(latestVersion, CURRENT_VERSION)) {
      spinner.succeed(chalk.green('BVM is already up to date.'));
      console.log(chalk.blue('BVM is already up to date.'));
      return;
    }

    spinner.text = `Updating BVM to v${latestVersion}...`;
    if (IS_TEST_MODE) {
      spinner.succeed(chalk.green('BVM updated successfully (test mode).'));
      return;
    }

    const installScriptUrl = 'https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh';
    const command = `curl -fsSL ${installScriptUrl} | bash`;
    const proc = Bun.spawn(['bash', '-c', command], { stdout: 'pipe', stderr: 'pipe' });

    const output = await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();
    await proc.exited;

    if (proc.exitCode !== 0) {
      spinner.fail(chalk.red('BVM upgrade failed.'));
      console.error(chalk.red(error || output));
      throw new Error(`BVM upgrade failed with exit code ${proc.exitCode}: ${error || output}`);
    }

    spinner.succeed(chalk.green('BVM updated successfully.'));
    console.log(chalk.yellow('Please restart your terminal to use the new version.'));
      },
      { failMessage: 'Failed to upgrade BVM' },
    );
  } catch (error: any) {
    throw new Error(`Failed to upgrade BVM: ${error.message}`);
  }
}
