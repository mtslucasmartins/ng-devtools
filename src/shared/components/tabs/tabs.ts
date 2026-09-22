import { Component, input } from '@angular/core';

@Component({
  selector: 'div[appTabs]',
  host: { class: 'tool-tabs' },
  template: '<ng-content />',
})
export class Tabs {}

@Component({
  selector: 'button[appTab]',
  host: { '[class.selected]': 'selected()' },
  template: `<i [class]="'fa-solid fa-' + icon()" aria-hidden="true"></i><ng-content />`,
})
export class Tab {
  readonly icon = input.required<string>();
  readonly selected = input(false);
}
