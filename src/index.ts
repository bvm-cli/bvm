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
import { upgradeBvm } from './commands/upgrade'; // Import upgradeBvm
import chalk from 'chalk';
import ora from 'ora';

const cli = cac('bvm');

const helpMessage = `
Bun Version Manager (bvm)

Usage:
  bvm --help                                Show this message
  bvm --version                             Print out the installed version of bvm
  bvm install [version]                     Download and install a <version>. Uses .bvmrc if available
  bvm uninstall <version>                   Uninstall a version
  bvm use [version]                         Modify PATH to use <version>. Uses .bvmrc if available
  bvm deactivate                            Undo effects of \`bvm\` on current shell
  bvm setup                                 Configure shell environment (PATH) automatically
  bvm upgrade                               Upgrade bvm to the latest version
  bvm self-update                           Upgrade bvm to the latest version (alias for upgrade)
  bvm exec <version> <command>              Run <command> on <version>
  bvm run <version> <args>                  Run \`bun\` on <version> with <args> as arguments
  bvm current                               Display currently activated version of Bun
  bvm ls                                    List installed versions
  bvm list                                  List installed versions (alias for ls)
  bvm ls-remote                             List remote versions available for install
  bvm version <version>                     Resolve the given description to a single local version
  bvm alias <name> <version>                Set an alias named <name> pointing to <version>
  bvm unalias <name>                        Deletes the alias named <name>
  bvm which [version]                       Display path to installed bun version. Uses .bvmrc if available
  bvm cache dir                             Display path to the cache directory for bvm
  bvm cache clear                           Empty cache directory for bvm

Example:
  bvm install 1.0.0                     Install a specific version number
  bvm use 1.0.0                         Use the specific version
  bvm run 1.0.0 index.ts                Run index.ts using bun 1.0.0
  bvm exec 1.0.0 bun index.ts           Run \`bun index.ts\` with the PATH pointing to bun 1.0.0
  bvm alias default 1.0.0               Set default bun version
  bvm upgrade                           Upgrade bvm to the latest version

Note:
  To remove, delete, or uninstall bvm - just remove the \`$BVM_DIR\` folder (usually \`~/.bvm\`)
`;

// Placeholder for commands
cli.command('install [version]', 'Install a Bun version')
  .action(async (version?: string) => {
    try {
      await installBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('ls', 'List installed Bun versions')
  .alias('list')
  .action(async () => {
    try {
      await listLocalVersions();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('ls-remote', 'List all available remote Bun versions')
  .action(async () => {
    try {
      await listRemoteVersions();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('use [version]', 'Switch to a specific Bun version')
  .action(async (version?: string) => {
    try {
      await useBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('current', 'Display the currently active Bun version')
  .action(async (version?: string) => {
    try {
      await displayCurrentVersion();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('uninstall <version>', 'Uninstall a Bun version')
  .action(async (version: string) => {
    try {
      await uninstallBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('alias <name> <version>', 'Create an alias for a Bun version')
  .action(async (name: string, version: string) => {
    try {
      await createAlias(name, version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('unalias <name>', 'Remove an existing alias')
  .action(async (name: string) => {
    try {
      await removeAlias(name);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('run <version> [...args]', 'Run a command with a specific Bun version')
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

cli.command('exec <version> <cmd> [...args]', 'Execute a command with a specific Bun version\'s environment')
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

cli.command('which [version]', 'Display path to installed bun version')
  .action(async (version?: string) => {
    try {
      await whichBunVersion(version);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('deactivate', 'Undo effects of bvm on current shell')
  .action(async () => {
    try {
      await deactivate();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('version <spec>', 'Resolve the given description to a single local version')
  .action(async (spec: string) => {
    try {
      await displayVersion(spec);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('cache <action>', 'Manage bvm cache')
  .action(async (action: string) => {
    try {
      await cacheCommand(action);
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('setup', 'Configure shell environment automatically')
  .action(async () => {
    try {
      await configureShell();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('upgrade', 'Upgrade bvm to the latest version')
  .alias('self-update')
  .action(async () => {
    try {
      await upgradeBvm();
    } catch (error: any) {
      ora().fail(chalk.red(`${error.message}`));
      process.exit(1);
    }
  });

cli.command('help', 'Show help message')
  .action(() => {
    console.log(helpMessage);
  });

// Add CAC's built-in help and version handling
cli.version('1.0.0'); // Get this from package.json or a constant
cli.help(); // Automatically display help on --help, -h, or unknown command

// Remove this manual check
// if (process.argv.includes('--help') || process.argv.includes('-h')) {
//   console.log(helpMessage);
//   process.exit(0);
// }

// Explicitly handle unknown commands before parsing or if no command is provided
const args = process.argv.slice(2); // Get arguments after "bun run src/index.ts"
const commandName = args[0]; // First argument is usually the command name

// Get a list of all defined command names
const definedCommands = cli.commands.map(cmd => cmd.rawName.split(' ')[0]).filter(Boolean); // Filter out empty strings for root command

// Check if it's a global help/version flag
const isGlobalFlag = args.includes('--help') || args.includes('-h') || args.includes('--version') || args.includes('-v');

// If no command is provided, or an unrecognized command is provided
// and it's not a global help/version flag, then display help.
if (!commandName && !isGlobalFlag) {
  // No command provided, just print help
  console.log(helpMessage);
  process.exit(1);
} else if (commandName && !definedCommands.includes(commandName) && !isGlobalFlag) {
  // Unrecognized command
  console.error(chalk.red(`\nError: Unknown command '${commandName}'`));
  console.log(helpMessage);
  process.exit(1);
}

// If it's a known command, or a global flag handled by cac, proceed with parsing.
try {
  cli.parse();
} catch (error: any) {
  // This catch block might still be useful for other parsing errors (e.g., missing required args for a known command)
  console.error(chalk.red(`\nError: ${error.message}`));
  console.log(helpMessage);
  process.exit(1);
}

