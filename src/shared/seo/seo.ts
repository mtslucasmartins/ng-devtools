import { DOCUMENT, inject, Injectable, InjectionToken } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_NAME = 'Moss';

/** Production origin for canonical URLs, so preview deployments never compete with the real site. */
export const SITE_URL = new InjectionToken<string>('SITE_URL', {
  providedIn: 'root',
  factory: () => 'https://lurtins.com',
});

export interface Breadcrumb {
  name: string;
  path: string;
}

export interface SeoPage {
  title: string;
  description: string;
  path: string;
  breadcrumbs: Breadcrumb[];
}

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly siteUrl = inject(SITE_URL);

  set(page: SeoPage) {
    const title = `${page.title} | ${SITE_NAME}`;
    const url = this.siteUrl + page.path;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.head('link[rel="canonical"]', 'link', { rel: 'canonical' }).setAttribute('href', url);
    this.head('script[data-seo]', 'script', {
      type: 'application/ld+json',
      'data-seo': '',
    }).textContent = JSON.stringify(this.structuredData(page, url));
  }

  private structuredData(page: SeoPage, url: string) {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: page.title,
        description: page.description,
        url,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: page.breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: this.siteUrl + crumb.path,
        })),
      },
    ];
  }

  private head(selector: string, tag: string, attributes: Record<string, string>) {
    let element = this.document.head.querySelector(selector);
    if (!element) {
      element = this.document.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
      this.document.head.appendChild(element);
    }
    return element;
  }
}
