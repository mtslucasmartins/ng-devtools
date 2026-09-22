/**
 * Google AdSense settings. While `client` or `slot` is null, the sponsor card is shown instead of an
 * ad and no Google script is loaded. `client` also drives the generated ads.txt.
 */
export const ADSENSE: { client: string | null; slot: string | null } = {
  client: null, // e.g. 'ca-pub-1234567890123456'
  slot: null, // ad unit id from AdSense → Ads → By ad unit
};

type AdsWindow = Window & { adsbygoogle?: object[] };

/** Loads the AdSense script once, then asks it to fill the next empty ad unit on the page. */
export function requestAd(document: Document, client: string) {
  if (!document.querySelector('script[data-adsense]')) {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    script.dataset['adsense'] = '';
    document.head.appendChild(script);
  }
  const view = document.defaultView as AdsWindow;
  (view.adsbygoogle ??= []).push({});
}
