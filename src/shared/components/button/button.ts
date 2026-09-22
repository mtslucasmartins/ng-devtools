import { Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'minify';

@Component({
  selector: 'button[appButton]',
  host: {
    class: 'btn run-button',
    '[class.btn-primary]': "variant() === 'primary'",
    '[class.btn-minify]': "variant() === 'minify'",
  },
  template: `<i [class]="iconClass()" aria-hidden="true"></i><ng-content />
    @if (shortcut()) {
      <kbd>{{ shortcut() }}</kbd>
    }`,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly icon = input.required<string>();
  readonly shortcut = input('');
  // Swaps the icon for a spinner while work is in progress.
  readonly busy = input(false);
  readonly iconClass = computed(
    () => `fa-solid ${this.busy() ? 'fa-spinner fa-spin' : 'fa-' + this.icon()}`,
  );
}
