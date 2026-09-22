import { Component, input, output } from '@angular/core';

@Component({
  selector: 'header[appTopbar]',
  host: { class: 'topbar' },
  template: `<div class="breadcrumb">
      <button class="icon-button mobile-menu" aria-label="Open navigation" (click)="menu.emit()">
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
      </button>
      @for (crumb of trail(); track $index) {
        <span>{{ crumb }}</span
        ><span class="breadcrumb-slash">/</span>
      }
      <span class="breadcrumb-current"
        ><i [class]="'fa-solid fa-' + currentIcon()" aria-hidden="true"></i> {{ current() }}</span
      >
    </div>
    <div class="topbar-right">
      <span class="private-badge"><span></span>100% on your device</span
      ><span class="topbar-divider"></span
      ><button
        class="icon-button"
        aria-label="Open commands and keyboard shortcuts"
        (click)="shortcuts.emit()"
      >
        <i class="fa-regular fa-keyboard fa-solid" aria-hidden="true"></i>
      </button>
    </div>`,
})
export class Topbar {
  readonly trail = input<string[]>(['Workspace']);
  readonly current = input.required<string>();
  readonly currentIcon = input('code');
  readonly menu = output();
  readonly shortcuts = output();
}
