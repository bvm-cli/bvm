const commandList = [
  'install',
  'uninstall',
  'use',
  'ls',
  'ls-remote',
  'current',
  'alias',
  'unalias',
  'run',
  'exec',
  'which',
  'cache',
  'setup',
  'upgrade',
  'doctor',
  'completion',
  'help',
];

const scripts: Record<string, string> = {
  bash: `#!/usr/bin/env bash
_bvm_completions() {
  COMPREPLY=( $(compgen -W "${commandList.join(' ')}" -- "\${COMP_WORDS[COMP_CWORD]}") )
}
complete -F _bvm_completions bvm
`,
  zsh: `#compdef bvm
_bvm() {
  local -a commands
  commands=( ${commandList.join(' ')} )
  _describe 'command' commands
}
compdef _bvm bvm
`,
  fish: `complete -c bvm -f -a "${commandList.join(' ')}"
`,
};

export function printCompletion(shell: string): void {
  const script = scripts[shell as keyof typeof scripts];
  if (!script) {
    throw new Error(`Unsupported shell '${shell}'. Supported shells: ${Object.keys(scripts).join(', ')}`);
  }
  console.log(script);
}
