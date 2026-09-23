import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdSection } from '../../../shared/components/ad-section/ad-section';
import { Button } from '../../../shared/components/button/button';
import { Tab, Tabs } from '../../../shared/components/tabs/tabs';
import { ToolSidebar } from '../../../shared/components/tool-sidebar/tool-sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { ToolGuide, type ToolGuideContent } from '../../../shared/components/tool-guide/tool-guide';
import { YAML_SAMPLE } from '../../../shared/samples/json-samples';
import { Seo } from '../../../shared/seo/seo';
import { JSON_PROCESSOR } from '../../json/ports/json-processor';
import { CodeOutput } from '../../json/ui/code-output';
import { parseJson } from '../../json/domain/json';

type YamlModule = typeof import('yaml');

const YAML_GUIDES: Record<'viewer' | 'convert', ToolGuideContent> = {
  viewer: {
    heading: 'About the YAML Viewer & Formatter',
    intro:
      'Format YAML into a consistent, readable document and catch syntax or duplicate-key errors before using it in configuration files.',
    steps: [
      'Paste YAML into the editor or load the sample. Syntax errors are reported as you type.',
      'Press Format to normalize indentation and spacing.',
      'Copy the formatted YAML from the editor.',
    ],
    faqs: [
      {
        question: 'Is my YAML uploaded anywhere?',
        answer: 'No. Formatting and validation run entirely in your browser.',
      },
      {
        question: 'Are duplicate keys allowed?',
        answer:
          'No. Duplicate keys are reported as errors so one value cannot silently replace another.',
      },
      {
        question: 'Does formatting change my data?',
        answer:
          'It normalizes presentation such as indentation while preserving the represented values and key order.',
      },
    ],
  },
  convert: {
    heading: 'About the YAML Converter',
    intro:
      'Convert YAML to formatted JSON or JSON to readable YAML without sending either document to a server.',
    steps: [
      'Choose YAML → JSON or JSON → YAML.',
      'Paste the source document and press Convert.',
      'Review and copy the generated output.',
    ],
    faqs: [
      {
        question: 'Does conversion happen locally?',
        answer: 'Yes. Both directions run entirely in your browser.',
      },
      {
        question: 'Are YAML anchors and aliases supported?',
        answer:
          'Yes. Anchors and aliases are resolved in JSON output, with an expansion limit for safety.',
      },
      {
        question: 'Can every JSON document become YAML?',
        answer: 'Yes. JSON values have direct YAML representations, so the conversion is lossless.',
      },
    ],
  },
};

@Component({
  selector: 'app-yaml-workspace',
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
        active="yaml"
        [current]="page()"
        [mobileOpen]="mobileNav()"
        (close)="mobileNav.set(false)"
      />
      <div class="main-shell">
        <header
          appTopbar
          current="YAML"
          currentIcon="file-lines"
          (menu)="mobileNav.set(true)"
        ></header>
        <div class="content-layout">
          <main class="workspace-main">
            <div appTabs aria-label="YAML tools">
              <button
                appTab
                icon="file-lines"
                [selected]="page() === 'viewer'"
                (click)="navigate('viewer')"
              >
                Viewer
              </button>
              <button
                appTab
                icon="arrow-right-arrow-left"
                [selected]="page() === 'convert'"
                (click)="navigate('convert')"
              >
                Convert
              </button>
            </div>
            <div class="tool-heading">
              <div>
                <h2>{{ page() === 'viewer' ? 'YAML Viewer' : 'Convert YAML' }}</h2>
                <p>
                  {{
                    page() === 'viewer'
                      ? 'Format and validate YAML in your browser.'
                      : 'Move between YAML and JSON without uploading your data.'
                  }}
                </p>
              </div>
              <button class="text-button" (click)="loadSample()">
                <i class="fa-solid fa-flask" aria-hidden="true"></i> Try a sample
              </button>
            </div>
            <section class="editor-workspace" aria-label="YAML editor">
              <div class="editor-toolbar">
                <div class="toolbar-settings">
                  @if (page() === 'convert') {
                    <label for="yaml-direction">Direction</label>
                    <select
                      id="yaml-direction"
                      class="form-select"
                      [ngModel]="direction()"
                      (ngModelChange)="direction.set($event); reset()"
                    >
                      <option value="fromYaml">YAML → JSON</option>
                      <option value="toYaml">JSON → YAML</option>
                    </select>
                  } @else {
                    <span
                      ><i class="fa-solid fa-file-lines" aria-hidden="true"></i> YAML document</span
                    >
                  }
                </div>
                <button
                  appButton
                  icon="wand-magic-sparkles"
                  [busy]="busy()"
                  [disabled]="busy()"
                  (click)="run()"
                >
                  {{ page() === 'viewer' ? 'Format' : 'Convert' }}
                </button>
              </div>
              <div class="editor-panes" [class.single-editor]="page() === 'viewer'">
                <section class="editor-pane input-pane">
                  <header class="pane-header">
                    <div class="pane-title">
                      <span class="pane-indicator"></span
                      ><label for="yaml-input">{{
                        page() === 'viewer' ? 'Document' : 'Input'
                      }}</label
                      ><span class="file-type">{{ inputLanguage() }}</span>
                    </div>
                  </header>
                  <div class="input-editor">
                    <div #gutter class="editor-gutter" aria-hidden="true">
                      @for (line of inputLines(); track $index) {
                        <div>{{ $index + 1 }}</div>
                      }
                    </div>
                    <textarea
                      id="yaml-input"
                      spellcheck="false"
                      wrap="off"
                      [ngModel]="source()"
                      (ngModelChange)="source.set($event); reset()"
                      (scroll)="syncScroll($event, gutter)"
                      [placeholder]="'Paste ' + inputLanguage() + ' here...'"
                    ></textarea>
                  </div>
                  <footer class="pane-footer">
                    <span>{{ inputLines().length }} lines</span><span>UTF-8</span>
                  </footer>
                </section>
                @if (page() === 'convert') {
                  <section class="editor-pane output-pane">
                    <header class="pane-header">
                      <div class="pane-title">
                        <span class="pane-indicator green"></span><span>Output</span
                        ><span class="file-type">{{
                          direction() === 'fromYaml' ? 'JSON' : 'YAML'
                        }}</span>
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
                      <app-code-output
                        [value]="output()"
                        [language]="direction() === 'fromYaml' ? 'json' : 'yaml'"
                      />
                    </div>
                    <footer class="pane-footer">
                      <span class="output-state"
                        ><i class="fa-solid fa-check" aria-hidden="true"></i
                        >{{ output() ? 'Output updated' : 'Preview' }}</span
                      ><span>Local only</span>
                    </footer>
                  </section>
                }
              </div>
              <div class="workspace-status" role="status">
                <span
                  ><i
                    class="fa-solid"
                    [class.fa-circle-check]="!problem()"
                    [class.fa-circle-exclamation]="!!problem()"
                    aria-hidden="true"
                  ></i
                  >{{
                    warning()
                      ? 'Invalid ' + inputLanguage() + ' — check the warning below.'
                      : message()
                  }}</span
                ><span class="local-processing"
                  ><i class="fa-solid fa-lock" aria-hidden="true"></i> Local processing</span
                >
              </div>
            </section>
            @if (problem()) {
              <div class="error-message" role="alert">
                <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                <div>
                  <strong>Something needs a second look</strong>
                  <pre>{{ problem() }}</pre>
                </div>
              </div>
            }
            <section appToolGuide class="standalone-guide" [guide]="guide()"></section>
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
  `,
})
export class YamlWorkspace {
  readonly slug = input('viewer');
  readonly source = signal(YAML_SAMPLE);
  readonly output = signal('');
  readonly direction = signal<'fromYaml' | 'toYaml'>('fromYaml');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('Ready when you are.');
  readonly mobileNav = signal(false);
  readonly page = computed(() => (this.slug() === 'convert' ? 'convert' : 'viewer'));
  readonly guide = computed(() => YAML_GUIDES[this.page()]);
  readonly inputLanguage = computed(() =>
    this.page() === 'viewer' || this.direction() === 'fromYaml' ? 'YAML' : 'JSON',
  );
  readonly inputLines = computed(() => this.source().split('\n'));
  /** Loaded on first use; validation starts once it arrives. */
  private readonly yaml = signal<YamlModule | null>(null);
  /** Live syntax check of the input, like the JSON viewer's. */
  readonly warning = computed(() => {
    const source = this.source();
    if (!source.trim()) return '';
    if (this.inputLanguage() === 'JSON') {
      try {
        parseJson(source);
        return '';
      } catch (error) {
        return error instanceof Error ? error.message : 'Invalid JSON.';
      }
    }
    const yaml = this.yaml();
    if (!yaml) return '';
    const document = yaml.parseDocument(source, { uniqueKeys: true, prettyErrors: true });
    return document.errors.map((item) => item.message).join('\n\n');
  });
  readonly problem = computed(() => this.error() || this.warning());
  private readonly router = inject(Router);
  private readonly processor = inject(JSON_PROCESSOR);
  private readonly seo = inject(Seo);

  constructor() {
    void import('yaml').then((module) => this.yaml.set(module));
    effect(() => {
      const page = this.page();
      this.seo.set({
        title: page === 'viewer' ? 'YAML Viewer & Formatter' : 'YAML Converter',
        description: 'Format, validate and convert YAML locally in your browser.',
        path: `/tools/yaml/${page}`,
        breadcrumbs: [
          { name: 'Tools', path: '/tools' },
          { name: 'YAML', path: '/tools/yaml/viewer' },
          { name: page === 'viewer' ? 'Viewer' : 'Convert', path: `/tools/yaml/${page}` },
        ],
      });
    });
  }

  navigate(page: 'viewer' | 'convert') {
    void this.router.navigate(['/tools/yaml', page]);
  }
  reset() {
    this.output.set('');
    this.error.set('');
    this.message.set('Input changed. Ready when you are.');
  }
  loadSample() {
    this.source.set(
      this.direction() === 'toYaml' ? '{\n  "name": "Moss",\n  "local": true\n}' : YAML_SAMPLE,
    );
    this.reset();
  }
  async run() {
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.page() === 'viewer') {
        const { parseDocument } = await import('yaml');
        const document = parseDocument(this.source(), { uniqueKeys: true, prettyErrors: true });
        if (document.errors.length)
          throw new Error(document.errors.map((item) => item.message).join('\n'));
        this.source.set(document.toString({ indent: 2 }));
        this.message.set('Valid YAML. Document formatted.');
      } else {
        const result = await this.processor.process({
          operation: this.direction(),
          input: this.source(),
          secondary: '',
          query: '',
          indent: 2,
        });
        this.output.set(result.output);
        this.message.set(result.message);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to process this YAML.');
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
