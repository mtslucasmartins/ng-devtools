import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdSection } from '../../../shared/components/ad-section/ad-section';
import { Tab, Tabs } from '../../../shared/components/tabs/tabs';
import { ToolGuide, type ToolGuideContent } from '../../../shared/components/tool-guide/tool-guide';
import { ToolSidebar } from '../../../shared/components/tool-sidebar/tool-sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { Seo } from '../../../shared/seo/seo';
import { CodeOutput } from '../../json/ui/code-output';

type RegexPage = 'match' | 'replace';
interface HighlightSegment {
  text: string;
  /** 0 for plain text, then alternating 1 and 2 so adjacent matches stay distinguishable. */
  match: 0 | 1 | 2;
}
interface MatchRow {
  text: string;
  index: number;
  groups: { name: string; value: string | undefined }[];
}

const FLAG_OPTIONS = [
  { value: 'g', label: 'Global: find every match, not just the first' },
  { value: 'i', label: 'Ignore case' },
  { value: 'm', label: 'Multiline: ^ and $ match at line breaks' },
  { value: 's', label: 'Dot all: . also matches line breaks' },
  { value: 'u', label: 'Unicode' },
  { value: 'y', label: 'Sticky: match only at the current position' },
] as const;
/** Stop collecting after this many matches so a broad pattern cannot freeze the page. */
const MATCH_LIMIT = 1000;
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const REGEX_GUIDES: Record<RegexPage, ToolGuideContent> = {
  match: {
    heading: 'About the Regex Matcher',
    intro:
      'Test a JavaScript regular expression against text and inspect each match, capture group and position.',
    steps: [
      'Type a pattern, or paste a full literal such as /\\d+/gi and the flags are picked up for you.',
      'Paste the text to search. Matches are highlighted as you type.',
      'The Matches pane lists each match with its position and capture groups.',
    ],
    faqs: [
      {
        question: 'Which regular expression syntax is supported?',
        answer:
          'The tool uses your browser’s JavaScript RegExp implementation, including named groups and lookarounds supported by that browser.',
      },
      {
        question: 'How do I search for text with symbols like ( or . in it?',
        answer:
          'Turn on Plain text. Every character is then matched literally, so there is nothing to escape with backslashes.',
      },
      {
        question: 'What does the Global flag change?',
        answer: 'Global returns every match. Without it, only the first match is returned.',
      },
      {
        question: 'Is my text uploaded?',
        answer: 'No. Matching runs entirely in your browser and the text is not stored.',
      },
    ],
  },
  replace: {
    heading: 'About Regex Replace',
    intro:
      'Replace text with JavaScript regular expressions and preview the complete result before copying it.',
    steps: [
      'Type a pattern and the replacement text.',
      'Paste the source text; the output updates as you type.',
      'Copy the transformed output.',
    ],
    faqs: [
      {
        question: 'Can I use capture groups in the replacement?',
        answer:
          'Yes. Use $1, $2 or $<name>, and use $& for the complete match. With Plain text on, the replacement is inserted exactly as typed.',
      },
      {
        question: 'Why was only one match replaced?',
        answer: 'Enable the Global flag to replace every match instead of only the first one.',
      },
      {
        question: 'Does replacement run locally?',
        answer: 'Yes. The pattern and text never leave your browser.',
      },
    ],
  },
};

@Component({
  selector: 'app-regex-workspace',
  imports: [
    AdSection,
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
        active="regex"
        [current]="page()"
        [mobileOpen]="mobileNav()"
        (close)="mobileNav.set(false)"
      />
      <div class="main-shell">
        <header
          appTopbar
          current="Regex"
          currentIcon="asterisk"
          (menu)="mobileNav.set(true)"
        ></header>
        <div class="content-layout">
          <main class="workspace-main">
            <div appTabs aria-label="Regex tools">
              <button
                appTab
                icon="magnifying-glass"
                [selected]="page() === 'match'"
                (click)="navigate('match')"
              >
                Match
              </button>
              <button
                appTab
                icon="pen-to-square"
                [selected]="page() === 'replace'"
                (click)="navigate('replace')"
              >
                Replace
              </button>
            </div>
            <div class="tool-heading">
              <div>
                <h2>Regex {{ page() === 'match' ? 'Match' : 'Replace' }}</h2>
                <p>Test JavaScript regular expressions entirely in your browser.</p>
              </div>
              <button class="text-button" (click)="loadSample()">
                <i class="fa-solid fa-flask" aria-hidden="true"></i> Try a sample
              </button>
            </div>
            <div class="regex-controls">
              <div class="regex-pattern" [class.invalid]="!!error()">
                <span class="regex-delimiter" aria-hidden="true">/</span
                ><input
                  aria-label="Regular expression"
                  spellcheck="false"
                  autocapitalize="off"
                  autocomplete="off"
                  [ngModel]="expression()"
                  (ngModelChange)="expression.set($event)"
                  (paste)="pastePattern($event)"
                  [placeholder]="literal() ? 'Text to find, e.g. price (USD)' : '\\\\b[A-Z]\\\\w+'"
                /><span class="regex-delimiter" aria-hidden="true">/</span>
                <div class="regex-flags" role="group" aria-label="Flags">
                  @for (flag of flagOptions; track flag.value) {
                    <button
                      type="button"
                      [class.active]="flags().includes(flag.value)"
                      [attr.aria-pressed]="flags().includes(flag.value)"
                      [title]="flag.label"
                      (click)="toggleFlag(flag.value)"
                    >
                      {{ flag.value }}
                    </button>
                  }
                </div>
              </div>
              <label
                class="regex-literal"
                title="Treat every character literally, no escaping needed"
                ><input
                  type="checkbox"
                  [checked]="literal()"
                  (change)="literal.set(!literal())"
                />Plain text</label
              >
            </div>
            @if (page() === 'replace') {
              <div class="regex-controls">
                <div class="regex-pattern">
                  <span class="regex-delimiter" aria-hidden="true">→</span
                  ><input
                    aria-label="Replacement"
                    spellcheck="false"
                    autocapitalize="off"
                    autocomplete="off"
                    [ngModel]="replacement()"
                    (ngModelChange)="replacement.set($event)"
                    [placeholder]="literal() ? 'Replacement text' : 'Replacement, e.g. [$&] or $1'"
                  />
                </div>
              </div>
            }
            <section class="editor-workspace" aria-label="Regular expression workspace">
              <div class="editor-panes">
                <section class="editor-pane input-pane">
                  <header class="pane-header">
                    <div class="pane-title">
                      <span class="pane-indicator"></span><label for="regex-input">Text</label
                      ><span class="file-type"
                        >{{ matches().length }}{{ truncated() ? '+' : '' }} match{{
                          matches().length === 1 ? '' : 'es'
                        }}</span
                      >
                    </div>
                    <div class="pane-actions">
                      <button
                        class="icon-button"
                        aria-label="Clear text"
                        title="Clear text"
                        (click)="source.set('')"
                      >
                        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                      </button>
                    </div>
                  </header>
                  <div class="input-editor">
                    <div #gutter class="editor-gutter" aria-hidden="true">
                      @for (line of inputLines(); track $index) {
                        <div>{{ $index + 1 }}</div>
                      }
                    </div>
                    <div class="regex-surface">
                      <div #mirror class="regex-mirror" aria-hidden="true">
                        @for (segment of highlighted(); track $index) {
                          @if (segment.match) {
                            <mark [class.alt]="segment.match === 2">{{ segment.text }}</mark>
                          } @else {
                            <span>{{ segment.text }}</span>
                          }
                        }
                        <span>{{ ' ' }}</span>
                      </div>
                      <textarea
                        id="regex-input"
                        spellcheck="false"
                        autocapitalize="off"
                        autocomplete="off"
                        wrap="off"
                        [ngModel]="source()"
                        (ngModelChange)="source.set($event)"
                        (scroll)="syncScroll($event, gutter, mirror)"
                        placeholder="Paste the text to search..."
                      ></textarea>
                    </div>
                  </div>
                  <footer class="pane-footer">
                    <span>{{ inputLines().length }} lines</span><span>Not stored</span>
                  </footer>
                </section>
                @if (page() === 'replace') {
                  <section class="editor-pane output-pane">
                    <header class="pane-header">
                      <div class="pane-title">
                        <span class="pane-indicator green"></span><span>Output</span
                        ><span class="file-type">TEXT</span>
                      </div>
                      <div class="pane-actions">
                        <button
                          class="icon-button"
                          aria-label="Copy output"
                          title="Copy output"
                          [disabled]="!replaced()"
                          (click)="copy(replaced())"
                        >
                          <i class="fa-solid fa-copy" aria-hidden="true"></i>
                        </button>
                      </div>
                    </header>
                    <div class="output-editor" tabindex="0">
                      <app-code-output [value]="replaced()" language="text" />
                    </div>
                    <footer class="pane-footer">
                      <span class="output-state"
                        ><i class="fa-solid fa-check" aria-hidden="true"></i>Live preview</span
                      ><span>Local only</span>
                    </footer>
                  </section>
                } @else {
                  <section class="editor-pane output-pane">
                    <header class="pane-header">
                      <div class="pane-title">
                        <span class="pane-indicator green"></span><span>Matches</span
                        ><span class="file-type"
                          >{{ matches().length }}{{ truncated() ? '+' : '' }}</span
                        >
                      </div>
                      <div class="pane-actions">
                        <button
                          class="icon-button"
                          aria-label="Copy matches as JSON"
                          title="Copy matches as JSON"
                          [disabled]="!matches().length"
                          (click)="copy(matchesJson())"
                        >
                          <i class="fa-solid fa-copy" aria-hidden="true"></i>
                        </button>
                      </div>
                    </header>
                    <div class="output-editor regex-results" tabindex="0" aria-label="Matches">
                      @if (matches().length) {
                        <ol>
                          @for (row of matches(); track $index) {
                            <li>
                              <span class="regex-result-index">{{ $index + 1 }}</span>
                              <code class="regex-result-text">{{ row.text || '(empty)' }}</code>
                              <span class="regex-result-position">at {{ row.index }}</span>
                              @for (group of row.groups; track group.name) {
                                <span class="regex-result-group"
                                  ><em>{{ group.name }}</em
                                  ><code>{{ group.value ?? '—' }}</code></span
                                >
                              }
                            </li>
                          }
                        </ol>
                      } @else {
                        <p class="regex-results-empty">
                          {{ error() ? 'Fix the pattern to see matches.' : 'No matches yet.' }}
                        </p>
                      }
                    </div>
                    <footer class="pane-footer">
                      <span class="output-state"
                        ><i class="fa-solid fa-check" aria-hidden="true"></i>Live preview</span
                      ><span>Local only</span>
                    </footer>
                  </section>
                }
              </div>
              <div class="workspace-status" role="status">
                <span
                  ><i
                    class="fa-solid"
                    [class.fa-circle-check]="!error()"
                    [class.fa-circle-exclamation]="!!error()"
                    aria-hidden="true"
                  ></i
                  >{{ error() || message() || status() }}</span
                ><span class="local-processing"
                  ><i class="fa-solid fa-lock" aria-hidden="true"></i> Local processing</span
                >
              </div>
            </section>
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
export class RegexWorkspace {
  readonly slug = input('match');
  readonly page = computed<RegexPage>(() => (this.slug() === 'replace' ? 'replace' : 'match'));
  readonly guide = computed(() => REGEX_GUIDES[this.page()]);
  readonly expression = signal('\\b[A-Z][a-z]+\\b');
  readonly flags = signal<string[]>(['g']);
  /** Match the expression as plain text, so nothing needs a backslash. */
  readonly literal = signal(false);
  readonly replacement = signal('[$&]');
  readonly source = signal('Ada and Grace build tools. Linus reviews them.');
  /** Transient feedback such as "copied"; cleared by the next edit. */
  readonly message = signal('');
  readonly mobileNav = signal(false);
  readonly inputLines = computed(() => this.source().split('\n'));
  readonly flagOptions = FLAG_OPTIONS;
  readonly compiled = computed(() => {
    const pattern = this.literal() ? escapeRegex(this.expression()) : this.expression();
    if (!pattern) return { regex: null, error: '' };
    try {
      return { regex: new RegExp(pattern, this.flags().join('')), error: '' };
    } catch (error) {
      return {
        regex: null,
        error: error instanceof Error ? error.message : 'Invalid regular expression.',
      };
    }
  });
  readonly error = computed(() => this.compiled().error);
  private readonly execResult = computed(() => {
    const regex = this.compiled().regex;
    const text = this.source();
    const found: RegExpExecArray[] = [];
    if (!regex) return { found, truncated: false };
    if (!regex.global) {
      regex.lastIndex = 0;
      const match = regex.exec(text);
      return { found: match ? [match] : [], truncated: false };
    }
    for (const match of text.matchAll(regex)) {
      if (found.length === MATCH_LIMIT) return { found, truncated: true };
      found.push(match);
    }
    return { found, truncated: false };
  });
  readonly truncated = computed(() => this.execResult().truncated);
  readonly matches = computed<MatchRow[]>(() =>
    this.execResult().found.map((match) => ({
      text: match[0],
      index: match.index,
      groups: [
        ...match.slice(1).map((value, position) => ({ name: `$${position + 1}`, value })),
        ...Object.entries(match.groups ?? {}).map(([name, value]) => ({
          name: `<${name}>`,
          value,
        })),
      ],
    })),
  );
  readonly highlighted = computed<HighlightSegment[]>(() => {
    const text = this.source();
    const segments: HighlightSegment[] = [];
    let cursor = 0;
    let alternate = false;
    for (const match of this.execResult().found) {
      if (!match[0] || match.index < cursor) continue;
      if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index), match: 0 });
      segments.push({ text: match[0], match: alternate ? 2 : 1 });
      alternate = !alternate;
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor), match: 0 });
    return segments;
  });
  readonly replaced = computed(() => {
    const regex = this.compiled().regex;
    if (!regex) return this.source();
    regex.lastIndex = 0;
    const replacement = this.replacement();
    return this.literal()
      ? this.source().replace(regex, () => replacement)
      : this.source().replace(regex, replacement);
  });
  readonly matchesJson = computed(() =>
    JSON.stringify(
      this.execResult().found.map((match) => ({
        match: match[0],
        index: match.index,
        captures: match.slice(1),
        groups: match.groups,
      })),
      null,
      2,
    ),
  );
  readonly status = computed(() => {
    if (!this.expression()) return 'Type a pattern to start matching.';
    const count = this.matches().length;
    if (!count) return 'No matches.';
    const total = `${count}${this.truncated() ? '+' : ''} match${count === 1 ? '' : 'es'}`;
    return this.page() === 'replace' ? `${total} replaced.` : `${total} found.`;
  });
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);

  constructor() {
    effect(() => {
      const page = this.page();
      this.seo.set({
        title: page === 'match' ? 'Regex Matcher' : 'Regex Replace',
        description: `${page === 'match' ? 'Test' : 'Replace with'} JavaScript regular expressions locally in your browser.`,
        path: `/tools/regex/${page}`,
        breadcrumbs: [
          { name: 'Tools', path: '/tools' },
          { name: 'Regex', path: '/tools/regex/match' },
          { name: page === 'match' ? 'Match' : 'Replace', path: `/tools/regex/${page}` },
        ],
      });
    });
    // Any edit makes the last "copied" notice stale.
    effect(() => {
      this.compiled();
      this.source();
      this.replacement();
      untracked(() => this.message.set(''));
    });
  }

  navigate(page: RegexPage) {
    void this.router.navigate(['/tools/regex', page]);
  }
  toggleFlag(flag: string) {
    this.flags.update((flags) =>
      flags.includes(flag) ? flags.filter((item) => item !== flag) : [...flags, flag],
    );
  }
  /** Accept a full literal such as /\d+/gi pasted from code: split it into pattern and flags. */
  pastePattern(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') ?? '';
    const literal = /^\s*\/(.+)\/([dgimsuvy]*)\s*$/s.exec(text);
    const field = event.target as HTMLInputElement;
    // Only when replacing the whole field; pasting into the middle of a pattern stays verbatim.
    if (!literal || field.selectionStart !== 0 || field.selectionEnd !== field.value.length) return;
    event.preventDefault();
    this.literal.set(false);
    this.expression.set(literal[1]);
    this.flags.set(
      FLAG_OPTIONS.map((flag) => flag.value).filter((flag) => literal[2].includes(flag)),
    );
  }
  loadSample() {
    this.literal.set(false);
    this.flags.set(['g']);
    if (this.page() === 'replace') {
      this.expression.set('(?<first>\\w+)@(?<domain>[\\w.]+)');
      this.replacement.set('$<first> at $<domain>');
      this.source.set('Write to ada@example.com or grace@moss.dev for access.');
    } else {
      this.expression.set('\\b[A-Z][a-z]+\\b');
      this.source.set('Ada and Grace build tools. Linus reviews them.');
    }
  }
  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.message.set('Copied to clipboard.');
    } catch {
      this.message.set('Clipboard access is unavailable. Select and copy the text manually.');
    }
  }
  syncScroll(event: Event, gutter: HTMLElement, mirror: HTMLElement) {
    const textarea = event.target as HTMLTextAreaElement;
    gutter.scrollTop = textarea.scrollTop;
    mirror.scrollTop = textarea.scrollTop;
    mirror.scrollLeft = textarea.scrollLeft;
  }
}
