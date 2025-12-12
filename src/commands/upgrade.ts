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
    const response = await fetch(installScriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to download install script: ${response.statusText} (${response.status})`);
    }
    const script = await response.text();

    const proc = Bun.spawn({
      cmd: ['bash'],
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    proc.stdin?.write(script);
    proc.stdin?.end();

    const [output, error] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if ((exitCode ?? 0) !== 0) {
      spinner.fail(chalk.red('BVM upgrade failed.'));
      console.error(chalk.red(error || output));
      throw new Error(`BVM upgrade failed with exit code ${exitCode}: ${error || output}`);
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
