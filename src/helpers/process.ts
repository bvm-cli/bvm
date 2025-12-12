import chalk from 'chalk';

type StdioOption = 'inherit' | 'pipe' | 'ignore';

export interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  prependPath?: string;
  stdin?: StdioOption;
  stdout?: StdioOption;
  stderr?: StdioOption;
}

export async function runCommand(
  cmd: string[],
  options: SpawnOptions = {},
): Promise<number> {
  const {
    cwd,
    env: extraEnv,
    prependPath,
    stdin = 'inherit',
    stdout = 'inherit',
    stderr = 'inherit',
  } = options;

  const env: Record<string, string> = { ...process.env, ...extraEnv };
  if (prependPath) {
    const currentPath = env.PATH || '';
    env.PATH = `${prependPath}:${currentPath}`;
  }

  const subprocess = Bun.spawn({
    cmd,
    cwd,
    env,
    stdin,
    stdout,
    stderr,
  });

  const exitCode = await subprocess.exited;
  if ((exitCode ?? 0) !== 0) {
    throw new Error(`${chalk.red('Command failed')}: ${cmd.join(' ')} (code ${exitCode})`);
  }

  return exitCode ?? 0;
}
