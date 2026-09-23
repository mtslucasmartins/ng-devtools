import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type ToolArea = 'json' | 'yaml' | 'data' | 'regex';

@Component({
  selector: 'app-tool-sidebar',
  imports: [RouterLink],
  host: { '[class.mobile-open]': 'mobileOpen()' },
  template: `
    <a class="brand" routerLink="/tools/json/viewer" aria-label="DevTools home"
      ><span class="brand-tag">DEVTOOLS</span></a
    >
    <button class="sidebar-search" (click)="search.emit()">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>Find a tool...</span
      ><kbd>⌘ K</kbd>
    </button>

    <div class="sidebar-section">
      <a class="sidebar-category" routerLink="/tools/json/viewer" (click)="close.emit()"
        ><span><i class="fa-solid fa-code" aria-hidden="true"></i> JSON Tools</span
        ><span class="count">5</span></a
      ><button
        class="icon-button sidebar-toggle"
        [attr.aria-label]="jsonOpen() ? 'Collapse JSON Tools' : 'Expand JSON Tools'"
        [attr.aria-expanded]="jsonOpen()"
        aria-controls="json-tools-nav"
        (click)="jsonOpen.set(!jsonOpen())"
      >
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
    </div>
    <nav id="json-tools-nav" aria-label="JSON Tools" [hidden]="!jsonOpen()">
      @for (item of jsonTools; track item.path) {
        <a
          class="nav-item"
          [class.active]="active() === 'json' && current() === item.path"
          [attr.aria-current]="active() === 'json' && current() === item.path ? 'page' : null"
          [routerLink]="'/tools/json/' + item.path"
          (click)="close.emit()"
        >
          <i [class]="'fa-solid fa-' + item.icon" aria-hidden="true"></i
          ><span>{{ item.title }}</span>
          @if (active() === 'json' && current() === item.path) {
            <span class="active-dot"></span>
          }
        </a>
      }
    </nav>

    <div class="sidebar-section">
      <a class="sidebar-category" routerLink="/tools/yaml/viewer" (click)="close.emit()"
        ><span><i class="fa-solid fa-file-lines" aria-hidden="true"></i> YAML Tools</span
        ><span class="count">2</span></a
      ><button
        class="icon-button sidebar-toggle"
        [attr.aria-label]="yamlOpen() ? 'Collapse YAML Tools' : 'Expand YAML Tools'"
        [attr.aria-expanded]="yamlOpen()"
        aria-controls="yaml-tools-nav"
        (click)="yamlOpen.set(!yamlOpen())"
      >
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
    </div>
    <nav id="yaml-tools-nav" aria-label="YAML Tools" [hidden]="!yamlOpen()">
      @for (item of yamlTools; track item.path) {
        <a
          class="nav-item"
          [class.active]="active() === 'yaml' && current() === item.path"
          [attr.aria-current]="active() === 'yaml' && current() === item.path ? 'page' : null"
          [routerLink]="'/tools/yaml/' + item.path"
          (click)="close.emit()"
        >
          <i [class]="'fa-solid fa-' + item.icon" aria-hidden="true"></i
          ><span>{{ item.title }}</span>
          @if (active() === 'yaml' && current() === item.path) {
            <span class="active-dot"></span>
          }
        </a>
      }
    </nav>

    <div class="sidebar-section">
      <a class="sidebar-category" routerLink="/tools/data/generator" (click)="close.emit()"
        ><span><i class="fa-solid fa-database" aria-hidden="true"></i> Data Tools</span
        ><span class="count">1</span></a
      ><button
        class="icon-button sidebar-toggle"
        [attr.aria-label]="dataOpen() ? 'Collapse Data Tools' : 'Expand Data Tools'"
        [attr.aria-expanded]="dataOpen()"
        aria-controls="data-tools-nav"
        (click)="dataOpen.set(!dataOpen())"
      >
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
    </div>
    <nav id="data-tools-nav" aria-label="Data Tools" [hidden]="!dataOpen()">
      <a
        class="nav-item"
        [class.active]="active() === 'data'"
        [attr.aria-current]="active() === 'data' ? 'page' : null"
        routerLink="/tools/data/generator"
        (click)="close.emit()"
      >
        <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Generator</span>
        @if (active() === 'data') {
          <span class="active-dot"></span>
        }
      </a>
    </nav>

    <div class="sidebar-section">
      <a class="sidebar-category" routerLink="/tools/regex/match" (click)="close.emit()"
        ><span><i class="fa-solid fa-asterisk" aria-hidden="true"></i> Regex Tools</span
        ><span class="count">2</span></a
      ><button
        class="icon-button sidebar-toggle"
        [attr.aria-label]="regexOpen() ? 'Collapse Regex Tools' : 'Expand Regex Tools'"
        [attr.aria-expanded]="regexOpen()"
        aria-controls="regex-tools-nav"
        (click)="regexOpen.set(!regexOpen())"
      >
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
    </div>
    <nav id="regex-tools-nav" aria-label="Regex Tools" [hidden]="!regexOpen()">
      @for (item of regexTools; track item.path) {
        <a
          class="nav-item"
          [class.active]="active() === 'regex' && current() === item.path"
          [attr.aria-current]="active() === 'regex' && current() === item.path ? 'page' : null"
          [routerLink]="'/tools/regex/' + item.path"
          (click)="close.emit()"
        >
          <i [class]="'fa-solid fa-' + item.icon" aria-hidden="true"></i
          ><span>{{ item.title }}</span>
          @if (active() === 'regex' && current() === item.path) {
            <span class="active-dot"></span>
          }
        </a>
      }
    </nav>

    <div class="sidebar-bottom">
      <div class="local-note">
        <span class="local-icon"><i class="fa-solid fa-leaf" aria-hidden="true"></i></span>
        <div>
          <strong>Local by nature.</strong>
          <p>Your data stays with you.</p>
        </div>
      </div>
      <div class="sidebar-version"><span>Small tools. Less friction.</span><span>v0.1</span></div>
    </div>
  `,
})
export class ToolSidebar {
  readonly active = input<ToolArea>('json');
  readonly current = input('viewer');
  readonly mobileOpen = input(false);
  readonly search = output();
  readonly close = output();
  readonly jsonOpen = signal(false);
  readonly yamlOpen = signal(false);
  readonly dataOpen = signal(false);
  readonly regexOpen = signal(false);
  readonly jsonTools = [
    { title: 'Viewer', path: 'viewer', icon: 'code' },
    { title: 'Diff', path: 'diff', icon: 'code-compare' },
    { title: 'JSONPath', path: 'jsonpath', icon: 'magnifying-glass' },
    { title: 'Schema', path: 'schema', icon: 'shield-halved' },
    { title: 'Convert', path: 'to-yaml', icon: 'arrow-right-arrow-left' },
  ];
  readonly yamlTools = [
    { title: 'Viewer', path: 'viewer', icon: 'file-lines' },
    { title: 'Convert', path: 'convert', icon: 'arrow-right-arrow-left' },
  ];
  readonly regexTools = [
    { title: 'Match', path: 'match', icon: 'magnifying-glass' },
    { title: 'Replace', path: 'replace', icon: 'pen-to-square' },
  ];
}
