import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../../shared/seo/seo';

@Component({
  selector: 'app-privacy-page',
  imports: [RouterLink],
  template: `<div class="legal-page">
    <header class="legal-header">
      <a class="brand-tag" routerLink="/tools/json/viewer" aria-label="DevTools home">DEVTOOLS</a
      ><a class="text-button" routerLink="/tools/json/viewer"
        ><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back to the tools</a
      >
    </header>
    <main>
      <h1>Privacy Policy</h1>
      <p class="legal-updated">Last updated: September 22, 2026</p>

      <h2>Your documents stay on your device</h2>
      <p>
        Everything you paste, type or upload into the tools on lurtins.com is processed in your
        browser. Your documents are never sent to our servers or to anyone else, and they are not
        saved: closing the tab discards them.
      </p>

      <h2>Hosting</h2>
      <p>
        The site is served by Cloudflare. Like any web server, Cloudflare processes technical
        information such as your IP address and browser type to deliver pages and protect the site
        from abuse. See
        <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener" target="_blank"
          >Cloudflare's privacy policy</a
        >.
      </p>

      <h2>Advertising</h2>
      <p>
        To keep the tools free, this site shows ads from Google AdSense. Google and its partners use
        cookies to serve ads based on your previous visits to this and other websites.
      </p>
      <ul>
        <li>
          Learn
          <a
            href="https://policies.google.com/technologies/partner-sites"
            rel="noopener"
            target="_blank"
            >how Google uses information from sites that use its services</a
          >.
        </li>
        <li>
          Turn off personalized ads in
          <a href="https://myadcenter.google.com/" rel="noopener" target="_blank"
            >Google's My Ad Center</a
          >, or opt out of other vendors' personalized ads at
          <a href="https://www.aboutads.info/choices/" rel="noopener" target="_blank"
            >aboutads.info</a
          >.
        </li>
        <li>
          Visitors in the European Economic Area, the UK and Switzerland are asked for consent
          before personalized ads are shown, and can change their choice at any time.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        If this policy changes, the new version will be posted on this page with an updated date.
      </p>
    </main>
  </div>`,
})
export class PrivacyPage {
  constructor() {
    inject(Seo).set({
      title: 'Privacy Policy',
      description:
        'How lurtins.com handles your data: documents are processed in your browser and never uploaded. Ads are provided by Google AdSense.',
      path: '/privacy',
      breadcrumbs: [{ name: 'Privacy Policy', path: '/privacy' }],
    });
  }
}
