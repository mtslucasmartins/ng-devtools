import { Injectable, signal } from '@angular/core';
export interface ToolContext {
  tool: string;
  run(operation: string): void;
  navigate(operation: string): void;
}
export interface Command {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  tool?: string;
  execute(context: ToolContext): void;
}
export function commandScore(command: Command, query: string, current: string): number {
  const search = `${command.title} ${command.keywords.join(' ')}`.toLowerCase();
  const needle = query.trim().toLowerCase();
  let position = 0;
  for (const character of needle) {
    position = search.indexOf(character, position);
    if (position < 0) return -1;
    position++;
  }
  return (
    (command.tool === current ? 1000 : command.category === 'Action' ? 10 : 0) +
    (search.includes(needle) ? 50 : 0)
  );
}
@Injectable({ providedIn: 'root' })
export class CommandRegistry {
  readonly commands = signal<Command[]>([]);
  register(commands: Command[]) {
    this.commands.update((existing) => [
      ...new Map([...existing, ...commands].map((command) => [command.id, command])).values(),
    ]);
  }
  search(query: string, current: string): Command[] {
    return this.commands()
      .map((command) => ({ command, score: commandScore(command, query, current) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.command);
  }
}
