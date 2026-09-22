// Writes ads.txt into the build output once an AdSense publisher id is configured.
// Runs on Node's built-in TypeScript support: `node scripts/ads-txt.mts`.
import { writeFileSync } from 'node:fs';
import { ADSENSE } from '../src/shared/ads/adsense.ts';

const OUTPUT = 'dist/ng-devtools/browser/ads.txt';

if (ADSENSE.client) {
  // f08c47fec0942fa0 is Google's certification authority id, the same for every publisher.
  const publisher = ADSENSE.client.replace(/^ca-/, '');
  writeFileSync(OUTPUT, `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`ads.txt: ${publisher}`);
} else {
  console.log('ads.txt: skipped, no AdSense client configured');
}
