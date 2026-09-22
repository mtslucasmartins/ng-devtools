import type { Operation } from '../ports/json-processor';
export interface Tool {
  id: Operation;
  title: string;
  icon: string;
  group: string;
  description: string;
  action: string;
}
export const JSON_TOOLS: Tool[] = [
  {
    id: 'format',
    title: 'Viewer',
    icon: 'code',
    group: 'ESSENTIALS',
    description: 'A little clarity for your curly brackets.',
    action: 'Format JSON',
  },
  {
    id: 'minify',
    title: 'Minifier',
    icon: 'compress',
    group: 'ESSENTIALS',
    description: 'Less whitespace. Same JSON.',
    action: 'Minify JSON',
  },
  {
    id: 'validate',
    title: 'Validator',
    icon: 'circle-check',
    group: 'ESSENTIALS',
    description: 'Make sure every bracket is in the right place.',
    action: 'Validate JSON',
  },
  {
    id: 'diff',
    title: 'Diff',
    icon: 'code-compare',
    group: 'ESSENTIALS',
    description: 'Find exactly what changed between two documents.',
    action: 'Compare',
  },
  {
    id: 'jsonpath',
    title: 'JSONPath',
    icon: 'magnifying-glass',
    group: 'ESSENTIALS',
    description: 'Find the data you need, one path at a time.',
    action: 'Run query',
  },
  {
    id: 'toYaml',
    title: 'JSON → YAML',
    icon: 'arrow-right-arrow-left',
    group: 'CONVERT',
    description: 'Give your JSON a little breathing room.',
    action: 'Convert to YAML',
  },
  {
    id: 'fromYaml',
    title: 'YAML → JSON',
    icon: 'arrow-right-arrow-left',
    group: 'CONVERT',
    description: 'Bring your YAML into the JSON workspace.',
    action: 'Convert to JSON',
  },
  {
    id: 'toCsv',
    title: 'JSON → CSV',
    icon: 'table-cells',
    group: 'CONVERT',
    description: 'Turn an array of records into a table.',
    action: 'Convert to CSV',
  },
  {
    id: 'fromCsv',
    title: 'CSV → JSON',
    icon: 'table-cells',
    group: 'CONVERT',
    description: 'Turn rows and columns into structured data.',
    action: 'Convert to JSON',
  },
  {
    id: 'toXml',
    title: 'JSON → XML',
    icon: 'file-code',
    group: 'CONVERT',
    description: 'An XML representation of your JSON data.',
    action: 'Convert to XML',
  },
  {
    id: 'escape',
    title: 'Escape / Unescape',
    icon: 'quote-left',
    group: 'TRANSFORM',
    description: 'Safely wrap text in a JSON string, or unwrap it.',
    action: 'Escape string',
  },
  {
    id: 'schemaValidate',
    title: 'Schema',
    icon: 'shield-halved',
    group: 'SCHEMA',
    description: 'Generate a schema from your document, or validate it against one.',
    action: 'Validate schema',
  },
  {
    id: 'schemaGenerate',
    title: 'Schema Generator',
    icon: 'wand-magic-sparkles',
    group: 'SCHEMA',
    description: 'Start a JSON Schema from a sample document.',
    action: 'Generate schema',
  },
];
