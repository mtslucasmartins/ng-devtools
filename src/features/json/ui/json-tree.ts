import { Component, computed, input } from '@angular/core';
import type { JsonValue } from '../domain/json';
@Component({
  selector: 'app-json-tree',
  template: `
    @if (isContainer()) {
      <details open>
        <summary>
          <span class="tree-key">{{ label() }}</span
          ><span class="tree-summary"
            >{{ isArray() ? 'Array' : 'Object' }} · {{ entries().length }}
            {{ isArray() ? 'items' : 'keys' }}</span
          >
        </summary>
        <div class="tree-children">
          @for (entry of entries(); track entry[0]) {
            <app-json-tree [label]="entry[0]" [value]="entry[1]" />
          }
        </div>
      </details>
    } @else {
      <div class="tree-leaf">
        <span class="tree-key">{{ label() }}</span
        ><span [class]="'token-' + valueType()">{{ display() }}</span>
      </div>
    }
  `,
})
export class JsonTree {
  readonly value = input.required<JsonValue>();
  readonly label = input('root');
  readonly isContainer = computed(() => this.value() !== null && typeof this.value() === 'object');
  readonly isArray = computed(() => Array.isArray(this.value()));
  readonly entries = computed(() =>
    this.isContainer() ? Object.entries(this.value() as Record<string, JsonValue>) : [],
  );
  readonly valueType = computed(() => (this.value() === null ? 'null' : typeof this.value()));
  readonly display = computed(() => JSON.stringify(this.value()));
}
