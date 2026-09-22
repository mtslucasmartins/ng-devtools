import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommandRegistry, type Command, type ToolContext } from '../application/command-registry';
@Component({
  selector: 'app-command-palette',
  imports: [FormsModule],
  template: ` <dialog
    #dialog
    aria-label="Search tools and actions"
    class="command-dialog"
    (click)="backdrop($event)"
    (keydown)="onKey($event)"
  >
    <div class="palette-search">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i
      ><input
        #search
        aria-label="Search tools and actions"
        placeholder="What would you like to do?"
        [ngModel]="query()"
        (ngModelChange)="query.set($event); selected.set(0)"
        autocomplete="off"
      /><button class="keycap" (click)="close()" aria-label="Close command palette">esc</button>
    </div>
    <div class="palette-label">TOOLS & ACTIONS <span>Current tool actions first</span></div>
    <div class="palette-results">
      @for (command of matches(); track command.id; let index = $index) {
        <button
          class="command-result"
          [class.selected]="index === selected()"
          (click)="execute(command)"
          (mouseenter)="selected.set(index)"
        >
          <span class="command-symbol"
            ><i
              class="fa-solid"
              [class.fa-bolt]="command.category === 'Action'"
              [class.fa-arrow-right]="command.category === 'Navigation'"
              aria-hidden="true"
            ></i></span
          ><span>{{ command.title }}</span
          ><small>{{ command.category }}</small>
        </button>
      } @empty {
        <div class="empty-search">No matching commands. Try “format” or “YAML”.</div>
      }
    </div>
    <div class="palette-footer">
      <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span><span><kbd>↵</kbd> to run</span
      ><span class="ms-auto">Made for your flow.</span>
    </div>
  </dialog>`,
})
export class CommandPalette {
  readonly registry = inject(CommandRegistry);
  readonly context = input.required<ToolContext>();
  readonly executed = output<void>();
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly search = viewChild.required<ElementRef<HTMLInputElement>>('search');
  readonly query = signal('');
  readonly selected = signal(0);
  readonly matches = computed(() => this.registry.search(this.query(), this.context().tool));
  open() {
    this.query.set('');
    this.selected.set(0);
    this.dialog().nativeElement.showModal();
    this.search().nativeElement.focus();
  }
  close() {
    this.dialog().nativeElement.close();
  }
  backdrop(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) {
      const bounds = this.dialog().nativeElement.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        this.close();
    }
  }
  execute(command: Command) {
    this.close();
    command.execute(this.context());
    this.executed.emit();
  }
  onKey(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const length = this.matches().length;
      if (length)
        this.selected.update(
          (index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + length) % length,
        );
      this.dialog()
        .nativeElement.querySelectorAll('.command-result')
        [this.selected()]?.scrollIntoView({ block: 'nearest' });
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.matches()[this.selected()];
      if (command) this.execute(command);
    }
  }
}
