import { Component, computed, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { diffJson, type JsonValue } from '../domain/json';
import { diffLines } from '../domain/diff-lines';
import { tokenize } from './code-output';
function parse(text: string): { value: JsonValue; error: string } {
  try {
    return { value: JSON.parse(text), error: '' };
  } catch (error) {
    return {
      value: null,
      error: text.trim()
        ? error instanceof Error
          ? error.message
          : 'Invalid JSON.'
        : 'Paste a JSON document to compare.',
    };
  }
}
@Component({
  selector: 'app-json-diff',
  imports: [FormsModule],
  template: `
    <div class="diff-summary" role="status">
      <span>{{ summary() }}</span>
      <div class="diff-legend">
        <span class="legend-added">+ Added</span><span class="legend-removed">− Removed</span
        ><span class="legend-changed">~ Changed</span>
      </div>
    </div>
    <div class="editor-panes diff-panes">
      @for (side of sides; track side) {
        <section class="editor-pane" [class.input-pane]="side === 'left'">
          <header class="pane-header">
            <div class="pane-title">
              <span class="pane-indicator" [class.green]="side === 'right'"></span
              ><label [for]="'diff-' + side">{{
                side === 'left' ? 'Left · Original' : 'Right · Modified'
              }}</label
              ><span class="file-type">JSON</span>
            </div>
            <div class="pane-actions">
              <div class="view-toggle">
                <button [class.active]="!viewing(side) || !valid()" (click)="setView(side, false)">
                  Edit
                </button>
                <button
                  [class.active]="viewing(side) && valid()"
                  [disabled]="!valid()"
                  (click)="setView(side, true)"
                >
                  Changes
                </button>
              </div>
              <button
                class="icon-button"
                [attr.aria-label]="'Clear ' + side + ' document'"
                [title]="'Clear ' + side"
                (click)="update(side, '')"
              >
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </div>
          </header>
          @if (viewing(side) && valid()) {
            <div
              class="output-editor diff-highlight"
              tabindex="0"
              [attr.aria-label]="side + ' document comparison'"
            >
              @for (row of rows(); track $index) {
                <div [class]="'code-line diff-line diff-' + row[side].kind">
                  <span class="line-number" aria-hidden="true">{{ row[side].number }}</span>
                  <span
                    class="diff-marker"
                    [attr.aria-label]="
                      row[side].kind === 'same' || row[side].kind === 'empty'
                        ? null
                        : row[side].kind
                    "
                    >{{
                      row[side].kind === 'added'
                        ? '+'
                        : row[side].kind === 'removed'
                          ? '−'
                          : row[side].kind === 'changed'
                            ? '~'
                            : ' '
                    }}</span
                  >
                  <code>
                    @for (token of row[side].tokens; track $index) {
                      <span [class]="'token-' + token.kind">{{ token.value }}</span>
                    }
                  </code>
                </div>
              }
            </div>
          } @else {
            <div class="input-editor">
              <div #gutter class="editor-gutter" aria-hidden="true">
                @for (
                  line of text(side).split(
                    '
'
                  );
                  track $index
                ) {
                  <div>{{ $index + 1 }}</div>
                }
              </div>
              <textarea
                [id]="'diff-' + side"
                [attr.aria-label]="side === 'left' ? 'Left JSON document' : 'Right JSON document'"
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                wrap="off"
                [ngModel]="text(side)"
                (ngModelChange)="update(side, $event)"
                (scroll)="syncScroll($event, gutter)"
                [placeholder]="'Paste ' + side + ' JSON here…'"
              ></textarea>
            </div>
          }
          <footer class="pane-footer">
            <span
              >{{
                text(side).split(
                  '
'
                ).length
              }}
              lines</span
            ><span>{{
              viewing(side) && valid()
                ? 'Aligned by JSON structure · Edit to revise'
                : 'Editable · JSON'
            }}</span>
          </footer>
          @if (issue(side) && (text(side).trim() || compared())) {
            <div class="diff-error" role="alert">
              <strong>{{ side === 'left' ? 'Left' : 'Right' }} document:</strong> {{ issue(side) }}
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class JsonDiff {
  readonly left = model.required<string>();
  readonly right = model.required<string>();
  readonly sides = ['left', 'right'] as const;
  readonly leftView = signal(false);
  readonly rightView = signal(false);
  readonly compared = signal(false);
  readonly leftParsed = computed(() => parse(this.left()));
  readonly rightParsed = computed(() => parse(this.right()));
  readonly valid = computed(() => !this.leftParsed().error && !this.rightParsed().error);
  readonly changes = computed(() =>
    this.valid() ? diffJson(this.leftParsed().value, this.rightParsed().value) : [],
  );
  readonly rows = computed(() =>
    this.valid()
      ? diffLines(this.leftParsed().value, this.rightParsed().value).map((row) => ({
          left: { ...row.left, tokens: tokenize(row.left.text) },
          right: { ...row.right, tokens: tokenize(row.right.text) },
        }))
      : [],
  );
  readonly summary = computed(() =>
    !this.valid()
      ? 'Paste JSON on both sides, then compare.'
      : !this.compared()
        ? 'Ready to compare · Object key order is ignored.'
        : this.changes().length
          ? `${this.changes().length} difference${this.changes().length === 1 ? '' : 's'} · Live comparison`
          : 'Identical JSON · No differences.',
  );
  text(side: 'left' | 'right') {
    return side === 'left' ? this.left() : this.right();
  }
  issue(side: 'left' | 'right') {
    return side === 'left' ? this.leftParsed().error : this.rightParsed().error;
  }
  viewing(side: 'left' | 'right') {
    return side === 'left' ? this.leftView() : this.rightView();
  }
  setView(side: 'left' | 'right', value: boolean) {
    (side === 'left' ? this.leftView : this.rightView).set(value);
    if (value) this.compared.set(true);
  }
  update(side: 'left' | 'right', value: string) {
    (side === 'left' ? this.left : this.right).set(value);
    this.setView(side, false);
  }
  compare() {
    this.compared.set(true);
    if (this.valid()) {
      this.leftView.set(true);
      this.rightView.set(true);
    }
  }
  syncScroll(event: Event, gutter: HTMLElement) {
    gutter.scrollTop = (event.target as HTMLTextAreaElement).scrollTop;
  }
}
