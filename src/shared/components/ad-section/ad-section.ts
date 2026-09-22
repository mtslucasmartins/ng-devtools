import { Component } from '@angular/core';

@Component({
  selector: 'aside[appAdSection]',
  host: { class: 'ad-column', 'aria-label': 'Sponsor space' },
  template: `<div class="ad-label">
      A LITTLE SPACE FOR SUPPORT <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
    </div>
    <div class="sponsor-card">
      <div class="sponsor-art" aria-hidden="true">
        <div class="art-grid"></div>
        <span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span>
        <div class="art-window">
          <div class="art-window-dots"><b></b><b></b><b></b></div>
          <div class="art-code">
            <span>&lt;</span><i class="fa-solid fa-leaf"></i><span>/&gt;</span>
          </div>
          <div class="art-line"></div>
          <div class="art-line short"></div>
        </div>
        <span class="art-star star-one">✳</span><span class="art-star star-two">+</span
        ><span class="art-pill">a little room to grow</span>
      </div>
      <div class="sponsor-content">
        <span class="sponsor-eyebrow">GOOD TOOLS DESERVE GOOD COMPANY.</span>
        <h3>Built for developers.<br />Seen by developers.</h3>
        <p>This spot could be home to your next favorite tool.</p>
        <div class="sponsor-placeholder">
          <i class="fa-solid fa-seedling" aria-hidden="true"></i> Sponsor space
        </div>
        <span class="sponsor-meta">300 × 250 · Thoughtfully placed</span>
      </div>
    </div>
    <p class="ad-footnote">
      A small space that helps keep<br />your tools free. No tracking scripts.
    </p>
    <div class="right-note">
      <span>Less friction.<br />More building.</span
      ><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>
    </div>`,
})
export class AdSection {}
