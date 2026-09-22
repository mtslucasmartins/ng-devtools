// Writes sitemap.xml into the build output from the tool list, so new tools are indexed automatically.
// Runs on Node's built-in TypeScript support: `node scripts/sitemap.mts`.
import { writeFileSync } from 'node:fs';
import { JSON_BASE_PATH, JSON_TOOLS } from '../src/features/json/application/tools.ts';

const SITE_URL = 'https://lurtins.com';
const OUTPUT = 'dist/ng-devtools/browser/sitemap.xml';

const urls = [
  ...JSON_TOOLS.map((tool) => `${SITE_URL}${JSON_BASE_PATH}/${tool.path}`),
  `${SITE_URL}/privacy`,
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(OUTPUT, xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
