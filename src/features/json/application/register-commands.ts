import type { Command, CommandRegistry } from '../../commands/application/command-registry';
import { JSON_TOOLS } from './tools';
export function registerJsonCommands(registry: CommandRegistry) {
  registry.register(
    JSON_TOOLS.flatMap<Command>((tool) => [
      {
        id: `json.${tool.id}`,
        title: tool.action,
        keywords: [tool.title, 'json', tool.group],
        category: 'Action',
        tool: ['minify', 'validate'].includes(tool.id)
          ? 'format'
          : tool.id === 'schemaGenerate'
            ? 'schemaValidate'
            : tool.id,
        execute: (context) => context.run(tool.id),
      },
      {
        id: `navigate.${tool.id}`,
        title: `Open JSON ${tool.title}`,
        keywords: [tool.title, 'navigate', 'tool'],
        category: 'Navigation',
        execute: (context) => context.navigate(tool.id),
      },
    ]).filter(
      (command) =>
        !['navigate.validate', 'navigate.minify', 'navigate.schemaGenerate'].includes(command.id),
    ),
  );
  registry.register([
    {
      id: 'json.sort',
      title: 'Sort JSON keys',
      keywords: ['alphabetical', 'order'],
      category: 'Action',
      tool: 'format',
      execute: (context) => context.run('sort'),
    },
    {
      id: 'json.stringify',
      title: 'Stringify JSON',
      keywords: ['escape', 'string', 'serialize'],
      category: 'Action',
      tool: 'format',
      execute: (context) => context.run('stringify'),
    },
  ]);
}
