import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdSection } from '../../../shared/components/ad-section/ad-section';
import { Button } from '../../../shared/components/button/button';
import { Tab, Tabs } from '../../../shared/components/tabs/tabs';
import { ToolSidebar } from '../../../shared/components/tool-sidebar/tool-sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { ToolGuide, type ToolGuideContent } from '../../../shared/components/tool-guide/tool-guide';
import { Seo } from '../../../shared/seo/seo';
import { CodeOutput } from '../../json/ui/code-output';

interface FieldScript {
  id: string;
  field: string;
  code: string;
  each?: boolean;
}

const STORAGE_KEY = 'moss.data-tools.scripts';
const STARTER_SCRIPT = `async function generate() {
  return crypto.randomUUID();
}`;
const DATA_GUIDE: ToolGuideContent = {
  heading: 'About the JSON Data Generator',
  intro:
    'Build JSON from a template containing variables such as $id. Each variable gets a JavaScript generator whose returned value is inserted into every matching reference.',
  steps: [
    'Write a JSON template and use an unquoted $variable wherever a generated value belongs.',
    'Add a matching variable, open Edit, and define its generate() function.',
    'Keep Static checked to reuse one result, or clear it to generate a new value for every reference.',
    'Press Generate, then review or copy the JSON output.',
  ],
  faqs: [
    {
      question: 'Where are templates and scripts stored?',
      answer:
        'Templates stay in memory and disappear when the tab closes. Generator scripts are stored in this browser using local storage. Neither is uploaded to this site.',
    },
    {
      question: 'Can generate() be asynchronous?',
      answer:
        'Yes. It may return a promise or use fetch(), subject to the target API’s browser and CORS rules.',
    },
    {
      question: 'Can one generator call another?',
      answer:
        'No. Generators run independently and receive no registry or reference to other generators.',
    },
    {
      question: 'Which values can a generator return?',
      answer: 'Any JSON-compatible value: a string, number, boolean, null, array or object.',
    },
  ],
};

@Component({
  selector: 'app-data-workspace',
  imports: [
    AdSection,
    Button,
    CodeOutput,
    FormsModule,
    RouterLink,
    Tab,
    Tabs,
    ToolGuide,
    ToolSidebar,
    Topbar,
  ],
  template: `
    <div class="app-shell">
      @if (mobileNav()) {
        <button
          class="sidebar-backdrop"
          aria-label="Close navigation"
          (click)="mobileNav.set(false)"
        ></button>
      }
      <app-tool-sidebar
        class="sidebar"
        active="data"
        current="generator"
        [mobileOpen]="mobileNav()"
        (close)="mobileNav.set(false)"
      />
      <div class="main-shell">
        <header
          appTopbar
          current="Data Generator"
          currentIcon="database"
          (menu)="mobileNav.set(true)"
        ></header>
        <div class="content-layout">
          <main class="workspace-main">
            <div appTabs aria-label="Data tools">
              <button appTab icon="wand-magic-sparkles" [selected]="true">Generator</button>
            </div>
            <div class="tool-heading">
              <div>
                <h2>JSON Data Generator</h2>
                <p>
                  Use variables in a JSON template, then generate their values with browser-side
                  JavaScript.
                </p>
              </div>
              <button class="text-button" (click)="loadSample()">
                <i class="fa-solid fa-flask" aria-hidden="true"></i> Try a sample
              </button>
            </div>
            <section class="editor-workspace" aria-label="JSON data generator">
              <div class="editor-toolbar">
                <div class="toolbar-settings">
                  <span><i class="fa-solid fa-code" aria-hidden="true"></i> JSON template</span>
                </div>
                <button
                  appButton
                  icon="wand-magic-sparkles"
                  [busy]="busy()"
                  [disabled]="busy()"
                  (click)="run()"
                >
                  Generate
                </button>
              </div>
              <div class="editor-panes">
                <section class="editor-pane input-pane">
                  <header class="pane-header">
                    <div class="pane-title">
                      <span class="pane-indicator"></span><label for="data-template">Template</label
                      ><span class="file-type">JSON</span>
                    </div>
                  </header>
                  <div class="input-editor">
                    <div #gutter class="editor-gutter" aria-hidden="true">
                      @for (line of templateLines(); track $index) {
                        <div>{{ $index + 1 }}</div>
                      }
                    </div>
                    <textarea
                      id="data-template"
                      spellcheck="false"
                      wrap="off"
                      [ngModel]="template()"
                      (ngModelChange)="template.set($event); reset()"
                      (scroll)="syncScroll($event, gutter)"
                      placeholder='{"id": $id}'
                    ></textarea>
                  </div>
                  <footer class="pane-footer">
                    <span>{{ templateLines().length }} lines</span
                    ><span>Supports $variables · Not stored</span>
                  </footer>
                </section>
                <section class="editor-pane output-pane">
                  <header class="pane-header">
                    <div class="pane-title">
                      <span class="pane-indicator green"></span><span>Output</span
                      ><span class="file-type">JSON</span>
                    </div>
                    <button
                      class="icon-button"
                      aria-label="Copy output"
                      [disabled]="!output()"
                      (click)="copy()"
                    >
                      <i class="fa-solid fa-copy" aria-hidden="true"></i>
                    </button>
                  </header>
                  <div class="output-editor" tabindex="0">
                    <app-code-output [value]="output()" />
                  </div>
                  <footer class="pane-footer">
                    <span class="output-state"
                      ><i class="fa-solid fa-check" aria-hidden="true"></i
                      >{{ output() ? 'Output updated' : 'Preview' }}</span
                    ><span>Local only</span>
                  </footer>
                </section>
              </div>
              <div class="workspace-status" role="status">
                <span
                  ><i
                    class="fa-solid"
                    [class.fa-circle-check]="!error()"
                    [class.fa-circle-exclamation]="!!error()"
                    aria-hidden="true"
                  ></i
                  >{{ error() || message() }}</span
                ><span class="local-processing"
                  ><i class="fa-solid fa-lock" aria-hidden="true"></i> Runs in this browser</span
                >
              </div>
            </section>

            <section class="generator-scripts" aria-labelledby="variables-heading">
              <div class="scripts-heading">
                <div>
                  <h2 id="variables-heading">Variables</h2>
                  <p>
                    Each variable runs separately and must define <code>generate()</code>. Use it in
                    the template as <code>$variable</code>.
                  </p>
                </div>
                <button appButton icon="plus" (click)="addScript()">Add variable</button>
              </div>
              @for (script of scripts(); track script.id; let index = $index) {
                <article class="script-card">
                  <header>
                    <div class="variable-input">
                      <span>$</span
                      ><input
                        class="form-control"
                        [id]="'field-' + script.id"
                        aria-label="Variable name"
                        [ngModel]="script.field"
                        (ngModelChange)="updateVariable(index, $event)"
                        placeholder="id"
                      />
                    </div>
                    <label class="variable-mode">
                      <input
                        type="checkbox"
                        [ngModel]="!(script.each ?? false)"
                        (ngModelChange)="updateEach(index, !$event)"
                      />
                      Static
                    </label>
                    <button class="script-edit-button" (click)="editScript(script.id)">
                      <i class="fa-solid fa-pen" aria-hidden="true"></i> Edit
                      <small>{{ lineCount(script.code) }} lines</small>
                    </button>
                    <button
                      class="icon-button"
                      aria-label="Remove variable"
                      (click)="removeScript(index)"
                    >
                      <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                    </button>
                  </header>
                </article>
              } @empty {
                <div class="empty-scripts">Add a variable to use it in the JSON template.</div>
              }
            </section>

            <div class="privacy-strip">
              <span class="privacy-symbol"
                ><i class="fa-solid fa-shield-halved" aria-hidden="true"></i
              ></span>
              <div>
                <strong>Your template stays private.</strong>
                <p>
                  Generation runs in your browser. Scripts may contact external APIs only when you
                  explicitly write them to do so.
                </p>
              </div>
              <span class="privacy-tag">BROWSER ONLY</span>
            </div>
            <section appToolGuide class="standalone-guide" [guide]="guide"></section>
            <footer class="workspace-footer">
              <span
                >Built for the little things you do every day.<span class="footer-dot">·</span
                ><a routerLink="/privacy">Privacy</a></span
              ><span class="footer-leaf"
                ><i class="fa-solid fa-leaf" aria-hidden="true"></i> A calmer kind of devtool.</span
              >
            </footer>
          </main>
          <aside appAdSection></aside>
        </div>
      </div>
    </div>
    <dialog
      #scriptDialog
      class="script-dialog"
      aria-label="Edit field generator script"
      (click)="closeOnBackdrop($event)"
    >
      @if (editingScript(); as script) {
        <header class="script-dialog-header">
          <div>
            <span class="eyebrow">FIELD GENERATOR</span>
            <h2>&#36;{{ script.field || 'unnamed' }}</h2>
          </div>
          <button class="icon-button" aria-label="Close script editor" (click)="closeScript()">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>
        <div class="script-dialog-note">
          Define <code>generate()</code>. This script runs independently in your browser.
        </div>
        <textarea
          #scriptEditor
          class="script-dialog-editor"
          spellcheck="false"
          [attr.aria-label]="'Generator code for ' + (script.field || 'unnamed field')"
          [ngModel]="script.code"
          (ngModelChange)="updateScriptById(script.id, 'code', $event)"
        ></textarea>
        <footer class="script-dialog-footer">
          <span>{{ lineCount(script.code) }} lines · saved in this browser</span>
          <button class="btn btn-primary" (click)="closeScript()">Done</button>
        </footer>
      }
    </dialog>
  `,
})
export class DataWorkspace {
  readonly guide = DATA_GUIDE;
  readonly scripts = signal<FieldScript[]>(this.loadScripts());
  readonly template = signal(this.initialTemplate());
  readonly output = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('Ready when you are.');
  readonly mobileNav = signal(false);
  readonly editingScriptId = signal<string | null>(null);
  readonly editingScript = computed(() =>
    this.scripts().find((script) => script.id === this.editingScriptId()),
  );
  readonly templateLines = computed(() => this.template().split('\n'));
  readonly scriptDialog = viewChild.required<ElementRef<HTMLDialogElement>>('scriptDialog');
  readonly scriptEditor = viewChild<ElementRef<HTMLTextAreaElement>>('scriptEditor');

  constructor() {
    inject(Seo).set({
      title: 'JSON Data Generator',
      description: 'Generate JSON fields with custom JavaScript that runs locally in your browser.',
      path: '/tools/data/generator',
      breadcrumbs: [
        { name: 'Tools', path: '/tools' },
        { name: 'Data', path: '/tools/data/generator' },
        { name: 'Generator', path: '/tools/data/generator' },
      ],
    });
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scripts()));
      } catch {
        this.message.set('Scripts work in this tab, but browser storage is unavailable.');
      }
    });
  }

  private loadScripts(): FieldScript[] {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (Array.isArray(saved))
        return saved.filter(
          (item): item is FieldScript =>
            !!item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.field === 'string' &&
            typeof item.code === 'string' &&
            (item.each === undefined || typeof item.each === 'boolean'),
        );
    } catch {}
    return [
      { id: crypto.randomUUID(), field: 'id', code: STARTER_SCRIPT },
      {
        id: crypto.randomUUID(),
        field: 'randomName',
        code: `function generate() {\n  const names = ['Ada', 'Linus', 'Grace'];\n  return names[Math.floor(Math.random() * names.length)];\n}`,
      },
      {
        id: crypto.randomUUID(),
        field: 'currentTimestamp',
        code: `function generate() {\n  return new Date().toISOString();\n}`,
      },
    ];
  }
  private initialTemplate() {
    const variables = this.scripts().map((script) => script.field.replace(/^\$/, ''));
    if (['id', 'randomName', 'currentTimestamp'].every((variable) => variables.includes(variable)))
      return '{\n  "id": $id,\n  "name": $randomName,\n  "createdAt": $currentTimestamp\n}';
    return `{
${variables.map((variable) => `  ${JSON.stringify(variable)}: $${variable}`).join(',\n')}
}`;
  }
  addScript() {
    this.scripts.update((scripts) => [
      ...scripts,
      { id: crypto.randomUUID(), field: '', code: STARTER_SCRIPT },
    ]);
  }
  updateScript(index: number, property: 'field' | 'code', value: string) {
    this.scripts.update((scripts) =>
      scripts.map((script, position) =>
        position === index ? { ...script, [property]: value } : script,
      ),
    );
  }
  updateVariable(index: number, value: string) {
    this.updateScript(index, 'field', value.replace(/^\$/, ''));
  }
  updateEach(index: number, each: boolean) {
    this.scripts.update((scripts) =>
      scripts.map((script, position) => (position === index ? { ...script, each } : script)),
    );
  }
  updateScriptById(id: string, property: 'field' | 'code', value: string) {
    this.scripts.update((scripts) =>
      scripts.map((script) => (script.id === id ? { ...script, [property]: value } : script)),
    );
  }
  editScript(id: string) {
    this.editingScriptId.set(id);
    this.scriptDialog().nativeElement.showModal();
    requestAnimationFrame(() => this.scriptEditor()?.nativeElement.focus());
  }
  closeScript() {
    this.scriptDialog().nativeElement.close();
  }
  closeOnBackdrop(event: MouseEvent) {
    if (event.target !== this.scriptDialog().nativeElement) return;
    const bounds = this.scriptDialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      this.closeScript();
  }
  removeScript(index: number) {
    this.scripts.update((scripts) => scripts.filter((_, position) => position !== index));
  }
  reset() {
    this.output.set('');
    this.error.set('');
    this.message.set('Template changed. Ready when you are.');
  }
  lineCount(code: string) {
    return code.split('\n').length;
  }
  loadSample() {
    this.template.set(
      '{\n  "id": $id,\n  "name": $randomName,\n  "createdAt": $currentTimestamp\n}',
    );
    this.reset();
  }
  async run() {
    this.busy.set(true);
    this.error.set('');
    try {
      const marker = `__moss_variable_${crypto.randomUUID()}__`;
      const variables = new Set<string>();
      const occurrences = new Map<string, number>();
      const source = this.template().replace(
        /"(?:\\.|[^"\\])*"|\$([A-Za-z_][A-Za-z0-9_]*)/g,
        (match, variable: string | undefined) => {
          if (!variable) return match;
          variables.add(variable);
          occurrences.set(variable, (occurrences.get(variable) ?? 0) + 1);
          return JSON.stringify(marker + variable);
        },
      );
      const template: unknown = JSON.parse(source);
      const scripts = this.scripts();
      if (scripts.some((script) => !script.field.trim()))
        throw new Error('Every generator needs a variable name.');
      const namedScripts = scripts.map(
        (script) => [script.field.replace(/^\$/, ''), script] as const,
      );
      if (namedScripts.some(([name]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)))
        throw new Error('Variable names can contain letters, numbers and underscores.');
      const generators = new Map(namedScripts);
      if (generators.size !== namedScripts.length)
        throw new Error('Every variable name must be unique.');
      const missing = [...variables].filter((variable) => !generators.has(variable));
      if (missing.length) throw new Error(`Missing generator for $${missing.join(', $')}.`);
      const generated = await Promise.all(
        [...variables].map(async (variable) => {
          const script = generators.get(variable)!;
          const factory = new Function(
            `"use strict";\n${script.code}\nif (typeof generate !== "function") throw new Error("Define a generate() function.");\nreturn generate;`,
          ) as () => (context: { template: string }) => unknown;
          const generate = factory();
          return [
            variable,
            await Promise.all(
              Array.from({ length: script.each ? (occurrences.get(variable) ?? 1) : 1 }, () =>
                generate({ template: this.template() }),
              ),
            ),
          ] as const;
        }),
      );
      const values = new Map(generated);
      const resolve = (value: unknown): unknown => {
        if (typeof value === 'string' && value.startsWith(marker)) {
          const generatedValues = values.get(value.slice(marker.length))!;
          return generatedValues.length === 1 ? generatedValues[0] : generatedValues.shift();
        }
        if (Array.isArray(value)) return value.map(resolve);
        if (value && typeof value === 'object')
          return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, resolve(item)]),
          );
        return value;
      };
      const result = resolve(template);
      this.output.set(JSON.stringify(result, null, 2));
      this.message.set(
        `${generated.length} variable${generated.length === 1 ? '' : 's'} generated locally.`,
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to generate this data.');
    } finally {
      this.busy.set(false);
    }
  }
  async copy() {
    try {
      await navigator.clipboard.writeText(this.output());
      this.message.set('Output copied to clipboard.');
    } catch {
      this.error.set('Clipboard access is unavailable. Select and copy the output manually.');
    }
  }
  syncScroll(event: Event, gutter: HTMLElement) {
    gutter.scrollTop = (event.target as HTMLTextAreaElement).scrollTop;
  }
}
