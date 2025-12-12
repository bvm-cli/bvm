import { cac } from 'cac';
import { installBunVersion } from './commands/install';
import { useBunVersion } from './commands/use';
import { listRemoteVersions } from './commands/ls-remote';
import { listLocalVersions } from './commands/ls';
import { displayCurrentVersion } from './commands/current';
import { uninstallBunVersion } from './commands/uninstall';
import { createAlias } from './commands/alias';
import { removeAlias } from './commands/unalias';
import { runWithBunVersion } from './commands/run';
import { execWithBunVersion } from './commands/exec';
import { whichBunVersion } from './commands/which';
import { deactivate } from './commands/deactivate';
import { displayVersion } from './commands/version';
import { cacheCommand } from './commands/cache';
import { configureShell } from './commands/setup';
import { upgradeBvm } from './commands/upgrade';
import { doctor } from './commands/doctor';
import { printCompletion } from './commands/completion';
import chalk from 'chalk';
import ora from 'ora';
import packageJson from '../package.json';

const cli = cac('bvm');
const registeredCommandNames = new Set<string>();

type CommandHelpEntry = {
  usage: string;
  description: string;
};

const helpEntries: CommandHelpEntry[] = [];

function addHelpEntry(usage: string, description: string): void {
  helpEntries.push({ usage, description });
}

function registerCommand(
  raw: string,
  description: string,
  options: { aliases?: string[] } = {},
) {
  const command = cli.command(raw, description);
  const primaryName = raw.split(' ')[0];
  registeredCommandNames.add(primaryName);
  addHelpEntry(`bvm ${raw}`, description);

  if (options.aliases) {
    for (const alias of options.aliases) {
      command.alias(alias);
      registeredCommandNames.add(alias);
      addHelpEntry(`bvm ${alias}`, `${description} (alias for ${primaryName})`);
    }
  }

  return command;
}

function buildHelpMessage(): string {
  const usageLines = [
    '  bvm --help                                Show this message',
    '  npx bun run src/index.ts <command>        Run bvm using Bun (current HOME)',
    '  HOME="<dir>" npx bun run src/index.ts <command>  Run bvm in custom HOME (sandbox)',
    '  bvm --version                             Print out the installed version of bvm',
    '  bvm doctor                                Show diagnostics for Bun/BVM setup',
    '  bvm completion <shell>                    Output shell completion script (bash|zsh|fish)',
  ];

  const commandsBlock = helpEntries
    .map((entry) => {
      const padded = entry.usage.padEnd(40, ' ');
      return `  ${padded}${entry.description}`;
    })
    .join('\n');

  const examples = [
    '  bvm install 1.0.0                         Install a specific version number',
    '  bvm use 1.0.0                             Use the specific version',
    '  bvm run 1.0.0 index.ts                    Run index.ts using bun 1.0.0',
    '  bvm exec 1.0.0 bun index.ts               Run `bun index.ts` with Bun 1.0.0 in PATH',
    '  bvm alias default 1.0.0                   Set default bun version',
    '  bvm upgrade                               Upgrade bvm to the latest version',
  ];

  return [
    'Bun Version Manager (bvm)',
    'Built with Bun · Runs with Bun · Tested on Bun',
    '',
    'Usage:',
    ...usageLines,
    '',
    'Commands:',
    commandsBlock,
    '',
    'Examples:',
    ...examples,
    '',
    'Note:',
    '  To remove, delete, or uninstall bvm - just remove the `$BVM_DIR` folder (usually `~/.bvm`)',
  ].join('\n');
}

// Placeholder for commands
registerCommand('install [version]', 'Install a Bun version')
  .action(async (version?: string) => {
    try {
      await installBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('ls', 'List installed Bun versions', { aliases: ['list'] })
  .action(async () => {
    try {
      await listLocalVersions();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('ls-remote', 'List all available remote Bun versions')
  .action(async () => {
    try {
      await listRemoteVersions();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('use [version]', 'Switch to a specific Bun version')
  .action(async (version?: string) => {
    try {
      await useBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('current', 'Display the currently active Bun version')
  .action(async (version?: string) => {
    try {
      await displayCurrentVersion();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('uninstall <version>', 'Uninstall a Bun version')
  .action(async (version: string) => {
    try {
      await uninstallBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('alias <name> <version>', 'Create an alias for a Bun version')
  .action(async (name: string, version: string) => {
    try {
      await createAlias(name, version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('unalias <name>', 'Remove an existing alias')
  .action(async (name: string) => {
    try {
      await removeAlias(name);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('run <version> [...args]', 'Run a command with a specific Bun version')
  .action(async (version: string) => {
    try {
      // Manually extract args to preserve flags like --version
      const runIndex = process.argv.indexOf('run');
      
      let rawArgs: string[] = [];
      if (runIndex !== -1 && process.argv.length > runIndex + 2) {
          rawArgs = process.argv.slice(runIndex + 2);
      }
      
      await runWithBunVersion(version, rawArgs);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('exec <version> <cmd> [...args]', 'Execute a command with a specific Bun version\'s environment')
  .action(async (version: string, cmd: string) => {
    try {
      // Manually extract args
      const execIndex = process.argv.indexOf('exec');
      
      let rawArgs: string[] = [];
      if (execIndex !== -1 && process.argv.length > execIndex + 3) {
          rawArgs = process.argv.slice(execIndex + 3);
      }

      await execWithBunVersion(version, cmd, rawArgs);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('which [version]', 'Display path to installed bun version')
  .action(async (version?: string) => {
    try {
      await whichBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('deactivate', 'Undo effects of bvm on current shell')
  .action(async () => {
    try {
      await deactivate();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('version <spec>', 'Resolve the given description to a single local version')
  .action(async (spec: string) => {
    try {
      await displayVersion(spec);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('cache <action>', 'Manage bvm cache')
  .action(async (action: string) => {
    try {
      await cacheCommand(action);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });
addHelpEntry('bvm cache dir', 'Display path to the cache directory for bvm');
addHelpEntry('bvm cache clear', 'Empty cache directory for bvm');

registerCommand('setup', 'Configure shell environment automatically')
  .action(async () => {
    try {
      await configureShell();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('upgrade', 'Upgrade bvm to the latest version', { aliases: ['self-update'] })
  .action(async () => {
    try {
      await upgradeBvm();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('doctor', 'Show diagnostics for Bun/BVM setup')
  .action(async () => {
    try {
      await doctor();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('completion <shell>', 'Generate shell completion script (bash|zsh|fish)')
  .action(async (shell: string) => {
    try {
      printCompletion(shell);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

registerCommand('help', 'Show help message')
  .action(() => {
    console.log(buildHelpMessage());
  });

// Add CAC's built-in help and version handling
cli.version(packageJson.version);
cli.help(() => [{ body: buildHelpMessage() }]); // Provide custom help sections for --help/-h

// Remove this manual check
// if (process.argv.includes('--help') || process.argv.includes('-h')) {
//   console.log(helpMessage);
//   process.exit(0);
// }

// Explicitly handle unknown commands before parsing or if no command is provided
const args = process.argv.slice(2); // Get arguments after "bun run src/index.ts"
const commandName = args.find((arg) => arg !== '--'); // Skip the npm/bun "--" separator if present

// Check if it's a global help/version flag
const isGlobalFlag = args.includes('--help') || args.includes('-h') || args.includes('--version') || args.includes('-v');

// If no command is provided, or an unrecognized command is provided
// and it's not a global help/version flag, then display help.
const helpText = buildHelpMessage();

if (!commandName && !isGlobalFlag) {
  // No command provided, just print help
  console.log(helpText);
  process.exit(1);
} else if (commandName && !registeredCommandNames.has(commandName) && !isGlobalFlag) {
  // Unrecognized command: print friendly notice + help, but exit success to avoid extra noisy error
  console.log(chalk.yellow(`\nUnknown command '${commandName}'`));
  console.log(helpText);
  process.exit(0);
}

// If it's a known command, or a global flag handled by cac, proceed with parsing.
try {
  cli.parse();
} catch (error: any) {
  // This catch block might still be useful for other parsing errors (e.g., missing required args for a known command)
  console.error(chalk.red(`\nError: ${error.message}`));
  console.log(helpText);
  process.exit(1);
}
