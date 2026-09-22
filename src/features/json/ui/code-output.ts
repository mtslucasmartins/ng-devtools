import { Component, computed, input } from '@angular/core';
export function tokenize(text: string): { value: string; kind: string }[] {
  return (
    text.match(
      /"(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[^"\w\d-]+|./g,
    ) ?? []
  ).map((value) => ({
    value,
    kind: /^".*:\s*$/.test(value)
      ? 'key'
      : value.startsWith('"')
        ? 'string'
        : /^(true|false)$/.test(value)
          ? 'boolean'
          : value === 'null'
            ? 'null'
            : /^-?\d/.test(value)
              ? 'number'
              : 'plain',
  }));
}
@Component({
  selector: 'app-code-output',
  template: `@for (line of lines(); track $index) {
    <div class="code-line">
      <span class="line-number" aria-hidden="true">{{ $index + 1 }}</span
      ><code>
        @for (token of line; track $index) {
          <span [class]="'token-' + token.kind">{{ token.value }}</span>
        }
      </code>
    </div>
  }`,
})
export class CodeOutput {
  readonly value = input.required<string>();
  readonly language = input('json');
  readonly lines = computed(() =>
    this.value()
      .split('\n')
      .map((line) =>
        this.language() === 'json' ? tokenize(line) : [{ value: line, kind: 'plain' }],
      ),
  );
}
