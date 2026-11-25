import path from 'path';
import yaml from 'yaml';
import { splitFrontmatter } from '../utils/frontmatter.js';
import { applyHostHints } from './sub-agent.js';
import { HostId, type CommandSkill } from './types.js';

export function codexCommandToSkill(content: string, assetName: string): CommandSkill {
  const name = path.basename(assetName);
  if (!name.trim() || name.length > 64 || /[\r\n]/.test(name))
    throw new Error('Codex command Skill name must be nonempty, single-line and at most 64 characters');
  const { metadata, body } = splitFrontmatter(content);
  const processed = applyHostHints(metadata, HostId.Codex);
  for (const key of Object.keys(processed))
    if (!['description', 'argument-hint'].includes(key))
      throw new Error('Codex command-to-Skill conversion cannot represent field ' + key);
  for (const key of ['description', 'argument-hint'])
    if (processed[key] !== undefined &&
        (typeof processed[key] !== 'string' || !(processed[key] as string).trim()))
      throw new Error('Codex command ' + key + ' must be a nonempty string');
  if (!body.trim()) throw new Error('Codex command instructions must be nonempty');
  const description = processed.description ??
    'Run the ' + name + ' command workflow when explicitly requested.';
  if ((description as string).length > 1024)
    throw new Error('Codex command description must be at most 1024 characters');
  const invocation = '$' + name;
  const instructions = [
    'Invoke this workflow explicitly with ' + invocation + '.',
    'Treat text following the skill invocation as the command arguments. ' +
      'If the original instructions use $ARGUMENTS or positional arguments such as $1, ' +
      'interpret them from that user-supplied text.',
    'The original /' + name + ' command syntax below refers to this skill. ' +
      'References to other slash commands refer to their corresponding skills when installed.',
    ...(processed['argument-hint'] ? ['Argument hint: ' + processed['argument-hint']] : []),
    body,
  ].join('\n\n');
  return {
    files: {
      'SKILL.md': '---\n' + yaml.stringify({ name, description }).trimEnd() + '\n---\n\n' + instructions,
      'agents/openai.yaml': yaml.stringify({ policy: { allow_implicit_invocation: false } }),
    },
    invocation,
  };
}
