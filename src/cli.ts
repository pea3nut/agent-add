import { Command } from 'commander';
import select from '@inquirer/select';
import { getHost, getValidHostIds } from './hosts/index.js';
import { detectHosts, isHostDetected } from './utils/detect-hosts.js';
import { runInstaller } from './installer.js';
import { printSummary } from './utils/summary.js';
import type { CliInput } from './installer.js';

import pkgJson from '../package.json';
const pkg = pkgJson as { version: string };

export function createProgram(): Command {
  const program = new Command();

  program
    .name('agent-add')
    .description('Cross-host AI Agent Pack installer — install MCP, Skill, Prompt, Command, Sub-agent in one command')
    .version(pkg.version, '-V, --version')
    .addHelpText('after', `
Rules:
  All flags can be combined freely. The same flag can be repeated to install multiple assets.
  If --host is not specified, an interactive selection will be shown (TTY only).
  In non-interactive environments (CI, pipes), --host is required.

Examples:
  # Install MCP from JSON config file
  agent-add --mcp ./mcps/playwright.json --host cursor
  agent-add --mcp https://github.com/org/mcps.git#playwright/playwright.json --host cursor

  # Install Skill from directory (must contain SKILL.md)
  agent-add --skill ./skills/e2e-guide --host claude-code
  agent-add --skill https://github.com/demo/skills.git#e2e-guide --host claude-code

  # Install Prompt and Command from Markdown files
  agent-add --prompt ./prompts/dev-practices.md --host cursor
  agent-add --command ./commands/init.md --host cursor

  # Install Sub-agent
  agent-add --sub-agent ./agents/code-reviewer.md --host cursor

  # Install full Agent Pack from Manifest JSON
  agent-add --pack ./agent-pack.json --host cursor
  agent-add --pack https://github.com/org/packs.git#frontend/agent-pack.json

  # Combine pack with extra assets
  agent-add --pack ./agent-pack.json --mcp ./extra.json --host claude-code`)
    .option('--pack <source>', 'Install all assets from an Agent Pack Manifest JSON', collect, [])
    .option('--mcp <source>', 'Install an MCP server', collect, [])
    .option('--skill <source>', 'Install a Skill', collect, [])
    .option('--prompt <source>', 'Install a Prompt (appends to host\'s base rules file)', collect, [])
    .option('--command <source>', 'Install a Command', collect, [])
    .option('--sub-agent <source>', 'Install a Sub-agent', collect, [])
    .option('--host <host>', 'Target host ID (cursor | claude-code | claude-desktop)')
    .action(async (options: {
      pack: string[];
      mcp: string[];
      skill: string[];
      prompt: string[];
      command: string[];
      subAgent: string[];
      host?: string;
    }) => {
      const cliInput: CliInput = {
        mcp: options.mcp,
        skill: options.skill,
        prompt: options.prompt,
        command: options.command,
        subAgent: options.subAgent,
        pack: options.pack,
        host: options.host,
      };

      const hasAssetFlags =
        cliInput.pack.length > 0 ||
        cliInput.mcp.length > 0 ||
        cliInput.skill.length > 0 ||
        cliInput.prompt.length > 0 ||
        cliInput.command.length > 0 ||
        cliInput.subAgent.length > 0;

      if (!hasAssetFlags) {
        process.stderr.write(
          'agent-add error: No asset flags provided. Use --pack, --mcp, --skill, --prompt, --command, or --sub-agent.\n',
        );
        process.exit(2);
      }

      let hostId: string;

      if (cliInput.host) {
        hostId = cliInput.host;
      } else if (!process.stdout.isTTY) {
        const validIds = getValidHostIds().join(', ');
        process.stderr.write(
          `agent-add error: Non-interactive environment detected. Please specify a host with --host <host>.\n`,
        );
        process.stderr.write(`  Valid hosts: ${validIds}\n`);
        process.exit(2);
      } else {
        const cwd = process.cwd();
        const detectedHosts = detectHosts(cwd);
        const choices = detectedHosts.map((h) => ({
          name: isHostDetected(h, cwd) ? `${h.displayName} (detected)` : h.displayName,
          value: h.id,
        }));

        hostId = await select({
          message: 'Select target host:',
          choices,
        });
      }

      const host = getHost(hostId);
      if (!host) {
        const validIds = getValidHostIds().join(', ');
        process.stderr.write(
          `agent-add error: Unknown host '${hostId}'. Valid hosts: ${validIds}\n`,
        );
        process.exit(2);
      }

      const cwd = process.cwd();
      const summary = await runInstaller(cliInput, host, cwd);
      printSummary(summary);

      const hasConflicts = summary.results.some((r) => r.status === 'conflict');
      const hasErrors = summary.results.some((r) => r.status === 'error');

      if (hasErrors || hasConflicts) {
        process.exit(1);
      }
    });

  return program;
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

