import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Workspace } from '../../../shared/workspace/workspace';
import {
  CSV_SAMPLE,
  DIFF_SAMPLE,
  JSON_ROWS_SAMPLE,
  SAMPLE,
  YAML_SAMPLE,
} from '../../../shared/samples/json-samples';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { Tab, Tabs } from '../../../shared/components/tabs/tabs';
import { Button } from '../../../shared/components/button/button';
import { AdSection } from '../../../shared/components/ad-section/ad-section';
import { Seo } from '../../../shared/seo/seo';
import { JSON_BASE_PATH, JSON_TOOLS } from '../application/tools';
import { JSON_PROCESSOR, type Operation } from '../ports/json-processor';
import { CommandRegistry, type ToolContext } from '../../commands/application/command-registry';
import { registerJsonCommands } from '../application/register-commands';
import { CommandPalette } from '../../commands/ui/command-palette';
import { CodeOutput } from './code-output';
import { JsonTree } from './json-tree';
import { JsonDiff } from './json-diff';
@Component({
  selector: 'app-json-workspace',
  imports: [
    FormsModule,
    CommandPalette,
    CodeOutput,
    JsonTree,
    JsonDiff,
    Topbar,
    Tabs,
    Tab,
    Button,
    AdSection,
  ],
  templateUrl: './json-workspace.html',
})
export class JsonWorkspace {
  readonly shortcutModifier = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
  readonly workspace = inject(Workspace);
  readonly processor = inject(JSON_PROCESSOR);
  readonly registry = inject(CommandRegistry);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  /** Tool path from the URL (/tools/json/:slug), bound by the router. */
  readonly slug = input<string>();
  readonly palette = viewChild.required(CommandPalette);
  readonly diffEditor = viewChild(JsonDiff);
  readonly diffRight = signal('');
  readonly tools = JSON_TOOLS;
  readonly conversionTools = JSON_TOOLS.filter((tool) => tool.group === 'CONVERT');
  readonly sidebarTools = JSON_TOOLS.filter((tool) => tool.group === 'TRANSFORM');
  readonly groups = [...new Set(this.sidebarTools.map((tool) => tool.group))];
  readonly active = signal<Operation>('format');
  readonly tool = computed(() => this.tools.find((tool) => tool.id === this.active())!);
  /** The tool the URL points at; differs from `active` for pages like /tools/json/minify. */
  readonly page = signal<Operation>('format');
  readonly pageTool = computed(() => this.tools.find((tool) => tool.id === this.page())!);
  readonly schemaWorkspace = computed(() => this.active() === 'schemaValidate');
  readonly schemaView = signal<'schema' | 'result'>('schema');
  readonly schemaResult = signal<string | null>(null);
  readonly schemaValid = computed(() =>
    this.schemaResult() === null ? null : (JSON.parse(this.schemaResult()!).valid as boolean),
  );
  readonly singleEditor = computed(() => this.active() === 'format');
  readonly undoInput = signal<string | null>(null);
  readonly jsonWarning = computed(() => {
    if (
      ['fromYaml', 'fromCsv', 'escape', 'diff'].includes(this.active()) ||
      !this.workspace.input().trim()
    )
      return '';
    try {
      JSON.parse(this.workspace.input());
      return '';
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid JSON.';
    }
  });
  readonly mobileNav = signal(false);
  readonly secondary = signal('{\n  "type": "object",\n  "required": ["name"]\n}');
  readonly query = signal('$.favorites[*]');
  readonly indent = signal(2);
  readonly busy = signal(false);
  readonly message = signal('Ready when you are.');
  readonly error = signal('');
  readonly view = signal<'code' | 'tree'>('code');
  readonly wrap = signal(false);
  readonly hasRun = signal(false);
  readonly inputLines = computed(() => this.workspace.input().split('\n'));
  readonly bytes = computed(() => new TextEncoder().encode(this.workspace.input()).length);
  readonly parsed = computed(() => {
    try {
      return {
        valid: true,
        value: JSON.parse(this.singleEditor() ? this.workspace.input() : this.workspace.output()),
      };
    } catch {
      return { valid: false, value: null };
    }
  });
  readonly context = computed<ToolContext>(() => ({
    tool: this.active(),
    run: (operation) => {
      if (this.isOperation(operation)) this.commandRun(operation);
    },
    navigate: (operation) => {
      if (this.tools.some((tool) => tool.id === operation)) this.navigate(operation as Operation);
    },
  }));
  private revision = 0;
  private lastShift = 0;
  constructor() {
    registerJsonCommands(this.registry);
    effect(() => {
      const tool = this.tools.find((item) => item.path === this.slug());
      if (tool) untracked(() => tool.id !== this.page() && this.select(tool.id));
    });
    effect(() => {
      const tool = this.pageTool();
      this.seo.set({
        title: tool.seo.title,
        description: tool.seo.description,
        path: `${JSON_BASE_PATH}/${tool.path}`,
        breadcrumbs: [
          { name: 'Tools', path: '/tools' },
          { name: 'JSON', path: JSON_BASE_PATH },
          { name: tool.title, path: `${JSON_BASE_PATH}/${tool.path}` },
        ],
      });
    });
  }
  private isOperation(value: string): value is Operation {
    return this.tools.some((tool) => tool.id === value) || value === 'sort' || value === 'unescape';
  }
  navigate(operation: Operation) {
    this.select(operation);
    this.message.set('Input carried over. Ready when you are.');
    const path = this.tools.find((tool) => tool.id === operation)?.path;
    if (path) void this.router.navigate([JSON_BASE_PATH, path]);
  }
  private select(operation: Operation) {
    this.page.set(operation);
    this.active.set(
      operation === 'validate' || operation === 'minify'
        ? 'format'
        : operation === 'schemaGenerate'
          ? 'schemaValidate'
          : operation,
    );
    this.view.set('code');
    this.mobileNav.set(false);
    this.error.set('');
    this.revision++;
    this.busy.set(false);
  }
  commandRun(operation: Operation) {
    if (operation === 'diff' || operation === 'schemaValidate' || operation === 'jsonpath') {
      if (this.active() !== operation) {
        this.navigate(operation);
        this.message.set('Review the additional input, then run this tool.');
        return;
      }
    }
    if (!['sort', 'unescape', 'validate'].includes(operation)) this.navigate(operation);
    void this.run(operation);
  }
  editInput(value: string) {
    this.schemaResult.set(null);
    this.schemaView.set('schema');
    this.undoInput.set(null);
    this.view.set('code');
    this.workspace.input.set(value);
    this.revision++;
    this.busy.set(false);
    this.hasRun.set(false);
    this.error.set('');
    this.message.set(
      this.singleEditor()
        ? 'Ready when you are.'
        : 'Input changed. Run an action to update the output.',
    );
  }
  undoTransform() {
    const previous = this.undoInput();
    if (previous === null) return;
    this.editInput(previous);
    this.message.set('Transformation undone.');
  }
  editSecondary(value: string) {
    this.schemaResult.set(null);
    this.schemaView.set('schema');
    this.error.set('');
    this.message.set('Schema changed. Validate to check this document.');
    this.secondary.set(value);
    this.revision++;
    this.busy.set(false);
  }
  editQuery(value: string) {
    this.query.set(value);
    this.revision++;
    this.busy.set(false);
  }
  async run(operation = this.active()) {
    if (operation === 'diff') {
      this.diffEditor()?.compare();
      return;
    }
    const revision = ++this.revision;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.processor.process({
        operation,
        input: this.workspace.input(),
        secondary: this.secondary(),
        query: this.query(),
        indent: Number(this.indent()),
      });
      if (revision !== this.revision) return;
      if (operation === 'schemaGenerate') {
        this.secondary.set(result.output);
        this.schemaResult.set(null);
        this.schemaView.set('schema');
      } else if (operation === 'schemaValidate') {
        this.schemaResult.set(result.output);
        this.schemaView.set('result');
      } else if (operation !== 'validate') {
        if (
          operation === 'format' ||
          operation === 'minify' ||
          (operation === 'sort' && this.singleEditor())
        ) {
          if (result.output !== this.workspace.input()) {
            this.undoInput.set(this.workspace.input());
            this.workspace.input.set(result.output);
          }
        } else {
          this.workspace.output.set(result.output);
          this.workspace.language.set(result.language);
        }
      }
      this.message.set(result.message);
      this.hasRun.set(true);
      this.view.set('code');
    } catch (error) {
      if (revision === this.revision) {
        this.error.set(error instanceof Error ? error.message : 'Unable to process this input.');
        this.message.set('Check your input and try again.');
      }
    } finally {
      if (revision === this.revision) this.busy.set(false);
    }
  }
  loadSample() {
    if (this.active() === 'diff') {
      this.editInput(DIFF_SAMPLE.left);
      this.diffRight.set(DIFF_SAMPLE.right);
      return;
    }
    const sample =
      this.active() === 'fromYaml'
        ? YAML_SAMPLE
        : this.active() === 'fromCsv'
          ? CSV_SAMPLE
          : this.active() === 'toCsv'
            ? JSON_ROWS_SAMPLE
            : SAMPLE;
    this.editInput(sample);
  }
  async upload(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Please choose a file smaller than 5 MB.');
      this.editInput(await file.text());
      this.message.set(`${file.name} opened locally.`);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to read this file.');
    }
    element.value = '';
  }
  private exportContent() {
    return this.schemaWorkspace()
      ? this.schemaView() === 'result'
        ? (this.schemaResult() ?? '')
        : this.secondary()
      : this.singleEditor()
        ? this.workspace.input()
        : this.workspace.output();
  }
  async copy() {
    try {
      await navigator.clipboard.writeText(this.exportContent());
      this.message.set('Content copied to clipboard.');
    } catch {
      this.error.set('Clipboard access is unavailable. Select and copy the output manually.');
    }
  }
  download() {
    const blob = new Blob([this.exportContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.schemaWorkspace()
      ? this.schemaView() === 'result'
        ? 'moss-validation.json'
        : 'moss-schema.json'
      : this.singleEditor()
        ? 'moss.json'
        : `moss-output.${this.workspace.language() === 'text' ? 'txt' : this.workspace.language()}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  syncScroll(event: Event, gutter: HTMLElement) {
    gutter.scrollTop = (event.target as HTMLTextAreaElement).scrollTop;
  }
  @HostListener('document:keydown', ['$event'])
  shortcuts(event: KeyboardEvent) {
    if (
      this.singleEditor() &&
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      !event.altKey &&
      ['f', 'm'].includes(event.key.toLowerCase()) &&
      !(event.target instanceof Element && event.target.closest('dialog'))
    ) {
      event.preventDefault();
      if (!event.repeat && !this.busy())
        void this.run(event.key.toLowerCase() === 'f' ? 'format' : 'minify');
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.palette().open();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void this.run();
    }
    if (event.key === 'Shift' && !event.repeat) {
      const now = Date.now();
      if (now - this.lastShift < 400) {
        this.palette().open();
        this.lastShift = 0;
      } else this.lastShift = now;
    } else if (event.key !== 'Shift') this.lastShift = 0;
    if (event.key === 'Escape') this.mobileNav.set(false);
  }
}
