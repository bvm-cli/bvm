#!/usr/bin/env bun

const passthrough = (cmd: string, args: string[]) => {
  const result = Bun.spawnSync({ cmd: [cmd, ...args], stdout: 'inherit', stderr: 'inherit' });
  if (result.exitCode !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
};

function ensureCleanGit() {
  const status = Bun.spawnSync({ cmd: ['git', 'status', '--porcelain'], stdout: 'pipe' });
  if (status.exitCode !== 0) {
    throw new Error('Unable to read git status.');
  }
  if (status.stdout.toString().trim().length !== 0) {
    throw new Error('Git working tree is dirty. Please commit or stash changes before releasing.');
  }
}

(async function main() {
  try {
    console.log('Checking git status...');
    ensureCleanGit();

    console.log('\nRunning test suite with Bun...');
    passthrough('bun', ['test', 'test/*.ts']);

    const pkg = JSON.parse(await Bun.file('package.json').text());
    console.log(`\nCurrent version: ${pkg.version}`);

    console.log('\nNext steps:');
    console.log(' 1. Update version via `npm version <patch|minor|major>` (or edit package.json)');
    console.log(' 2. Push commits & tags: `git push && git push --tags`');
    console.log(' 3. Create GitHub Release attaching binaries/build artifacts');
    console.log(' 4. Publish release notes & announce to the community');

    console.log('\nRelease pre-check complete ✅');
  } catch (error) {
    console.error('\nRelease script failed:', (error as Error).message);
    process.exit(1);
  }
})();
