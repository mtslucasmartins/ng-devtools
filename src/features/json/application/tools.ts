import type { Operation } from '../ports/json-processor';
export interface Tool {
  id: Operation;
  title: string;
  icon: string;
  group: string;
  description: string;
  action: string;
  /** URL segment under JSON_BASE_PATH, e.g. 'diff' for /tools/json/diff. */
  path: string;
  /** Search-facing copy; `title` gets the site name appended. */
  seo: { title: string; description: string };
}
/** Where the JSON tools live on the site; each tool is served at `${JSON_BASE_PATH}/${tool.path}`. */
export const JSON_BASE_PATH = '/tools/json';
export const JSON_TOOLS: Tool[] = [
  {
    id: 'format',
    title: 'Viewer',
    icon: 'code',
    group: 'ESSENTIALS',
    description: 'A little clarity for your curly brackets.',
    action: 'Format JSON',
    path: 'viewer',
    seo: {
      title: 'JSON Viewer & Formatter',
      description:
        'Format, beautify and explore JSON as a collapsible tree, right in your browser. Nothing is uploaded; your data never leaves your device.',
    },
  },
  {
    id: 'minify',
    title: 'Minifier',
    icon: 'compress',
    group: 'ESSENTIALS',
    description: 'Less whitespace. Same JSON.',
    action: 'Minify JSON',
    path: 'minify',
    seo: {
      title: 'JSON Minifier: Compress JSON Online',
      description:
        'Strip whitespace and shrink JSON to a single line, instantly and locally in your browser. Nothing is uploaded.',
    },
  },
  {
    id: 'validate',
    title: 'Validator',
    icon: 'circle-check',
    group: 'ESSENTIALS',
    description: 'Make sure every bracket is in the right place.',
    action: 'Validate JSON',
    path: 'validate',
    seo: {
      title: 'JSON Validator: Check JSON Syntax Online',
      description:
        'Validate JSON and pinpoint syntax errors instantly. Everything runs in your browser, so private data stays private.',
    },
  },
  {
    id: 'diff',
    title: 'Diff',
    icon: 'code-compare',
    group: 'ESSENTIALS',
    description: 'Find exactly what changed between two documents.',
    action: 'Compare',
    path: 'diff',
    seo: {
      title: 'JSON Diff: Compare Two JSON Documents',
      description:
        'Compare two JSON documents side by side and see exactly what was added, removed or changed. Private and fully local.',
    },
  },
  {
    id: 'jsonpath',
    title: 'JSONPath',
    icon: 'magnifying-glass',
    group: 'ESSENTIALS',
    description: 'Find the data you need, one path at a time.',
    action: 'Run query',
    path: 'jsonpath',
    seo: {
      title: 'JSONPath Tester: Query JSON Online',
      description:
        'Test JSONPath expressions against your JSON and see matching results instantly. Scripts are disabled and nothing leaves your device.',
    },
  },
  {
    id: 'toYaml',
    title: 'JSON → YAML',
    icon: 'arrow-right-arrow-left',
    group: 'CONVERT',
    description: 'Give your JSON a little breathing room.',
    action: 'Convert to YAML',
    path: 'to-yaml',
    seo: {
      title: 'JSON to YAML Converter',
      description:
        'Convert JSON to clean, readable YAML in one click. Free, fast and processed entirely in your browser.',
    },
  },
  {
    id: 'fromYaml',
    title: 'YAML → JSON',
    icon: 'arrow-right-arrow-left',
    group: 'CONVERT',
    description: 'Bring your YAML into the JSON workspace.',
    action: 'Convert to JSON',
    path: 'from-yaml',
    seo: {
      title: 'YAML to JSON Converter',
      description:
        'Convert YAML to formatted JSON instantly. Free, private and processed entirely in your browser.',
    },
  },
  {
    id: 'toCsv',
    title: 'JSON → CSV',
    icon: 'table-cells',
    group: 'CONVERT',
    description: 'Turn an array of records into a table.',
    action: 'Convert to CSV',
    path: 'to-csv',
    seo: {
      title: 'JSON to CSV Converter',
      description:
        'Turn an array of JSON records into a CSV table you can open in any spreadsheet. Runs locally, no uploads.',
    },
  },
  {
    id: 'fromCsv',
    title: 'CSV → JSON',
    icon: 'table-cells',
    group: 'CONVERT',
    description: 'Turn rows and columns into structured data.',
    action: 'Convert to JSON',
    path: 'from-csv',
    seo: {
      title: 'CSV to JSON Converter',
      description:
        'Convert CSV rows and columns into structured JSON in one click. Free, private and processed in your browser.',
    },
  },
  {
    id: 'toXml',
    title: 'JSON → XML',
    icon: 'file-code',
    group: 'CONVERT',
    description: 'An XML representation of your JSON data.',
    action: 'Convert to XML',
    path: 'to-xml',
    seo: {
      title: 'JSON to XML Converter',
      description:
        'Convert JSON into well-formed XML instantly. Free, fast and processed entirely in your browser.',
    },
  },
  {
    id: 'escape',
    title: 'Escape / Unescape',
    icon: 'quote-left',
    group: 'TRANSFORM',
    description: 'Safely wrap text in a JSON string, or unwrap it.',
    action: 'Escape string',
    path: 'escape',
    seo: {
      title: 'JSON Escape & Unescape: String Tool',
      description:
        'Escape text into a valid JSON string, or unescape it back to plain text. Runs locally in your browser.',
    },
  },
  {
    id: 'schemaValidate',
    title: 'Schema',
    icon: 'shield-halved',
    group: 'SCHEMA',
    description: 'Generate a schema from your document, or validate it against one.',
    action: 'Validate schema',
    path: 'schema',
    seo: {
      title: 'JSON Schema Validator',
      description:
        'Validate JSON against a JSON Schema (Draft-07), or generate a schema from a sample document. Runs locally in your browser.',
    },
  },
  {
    id: 'schemaGenerate',
    title: 'Schema Generator',
    icon: 'wand-magic-sparkles',
    group: 'SCHEMA',
    description: 'Start a JSON Schema from a sample document.',
    action: 'Generate schema',
    path: 'schema-generator',
    seo: {
      title: 'JSON Schema Generator: Create a Schema from JSON',
      description:
        'Generate a JSON Schema (Draft-07) from a sample JSON document, then refine and validate it. Free and fully local.',
    },
  },
];
