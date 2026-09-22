import { Component, input } from '@angular/core';

export interface ToolGuideContent {
  heading: string;
  intro: string;
  steps: string[];
  faqs: { question: string; answer: string }[];
}

/** Explains a tool below its workspace: what it does, how to use it, and common questions. */
@Component({
  selector: 'section[appToolGuide]',
  host: { class: 'tool-guide', 'aria-labelledby': 'tool-guide-heading' },
  template: `<div class="tool-guide-intro">
      <h2 id="tool-guide-heading">{{ guide().heading }}</h2>
      <p>{{ guide().intro }}</p>
    </div>
    <div class="tool-guide-columns">
      <div>
        <h3>How to use it</h3>
        <ol class="tool-guide-steps">
          @for (step of guide().steps; track $index) {
            <li>{{ step }}</li>
          }
        </ol>
      </div>
      <div>
        <h3>Frequently asked questions</h3>
        @for (faq of guide().faqs; track faq.question) {
          <details class="tool-guide-faq">
            <summary>{{ faq.question }}</summary>
            <p>{{ faq.answer }}</p>
          </details>
        }
      </div>
    </div>`,
})
export class ToolGuide {
  readonly guide = input.required<ToolGuideContent>();
}
