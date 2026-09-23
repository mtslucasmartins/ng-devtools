import type { ToolGuideContent } from '../../../shared/components/tool-guide/tool-guide';
import type { Operation } from '../ports/json-processor';

const LOCAL = {
  question: 'Is my JSON uploaded anywhere?',
  answer:
    'No. Every tool on this page runs in your browser. Your documents are never sent to a server, and closing the tab discards them.',
};

const BIG_NUMBERS = {
  question: 'Can very large numbers change?',
  answer:
    'Integers larger than 9,007,199,254,740,991 can lose precision, because browsers store JSON numbers as 64-bit floating point. If your data has long IDs, keep them as strings.',
};

/** Page copy shown below each tool page. Actions without a page of their own (sort, stringify) have none. */
export const TOOL_GUIDES: Partial<Record<Operation, ToolGuideContent>> = {
  format: {
    heading: 'About the JSON Viewer & Formatter',
    intro:
      'Paste minified or messy JSON and turn it into consistently indented, readable text. Switch to the tree view to fold objects and arrays and explore large documents one level at a time.',
    steps: [
      'Paste JSON into the editor, upload a file, or try the sample.',
      'Pick 2, 4 or 8 spaces and press Format (Ctrl/Cmd + Shift + F).',
      'Use Sort keys to order object keys alphabetically, or switch to Tree to browse the structure.',
      'Press Stringify to turn the document into a single JSON string, ready to embed in another JSON value.',
      'Copy or download the result. Undo restores the text from before the last change.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Does formatting change my data?',
        answer:
          'No. Only whitespace changes. Values and key order stay the same unless you choose Sort keys.',
      },
      {
        question: 'Can I paste stringified JSON?',
        answer:
          'Yes. A document wrapped in a string, such as "{\\"id\\":1}" copied from a log or an API field, is unwrapped automatically, with or without the surrounding quotes.',
      },
      BIG_NUMBERS,
      {
        question: 'How large a file can I open?',
        answer:
          'Uploads up to 5 MB are supported. Pasting larger text works too, but may feel slower.',
      },
    ],
  },
  minify: {
    heading: 'About the JSON Minifier',
    intro:
      'Minifying removes every space, tab and line break that JSON does not need, producing the smallest single-line version of your document. Useful for payloads, config values and embedding JSON in other files.',
    steps: [
      'Paste or upload your JSON.',
      'Press Minify (Ctrl/Cmd + Shift + M).',
      'Copy or download the one-line result. Format turns it back into readable JSON.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Is minified JSON still valid JSON?',
        answer:
          'Yes. Whitespace between tokens is optional in JSON, so the minified document means exactly the same thing.',
      },
      BIG_NUMBERS,
    ],
  },
  validate: {
    heading: 'About the JSON Validator',
    intro:
      'Check that a document is well-formed JSON before it reaches your API, config loader or database. The editor checks as you type and points to the first problem it finds.',
    steps: [
      'Paste or upload the JSON you want to check.',
      'Watch the status line: a warning appears as soon as the document is invalid.',
      'Fix the reported problem and repeat until the document is valid.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'What are the most common JSON errors?',
        answer:
          'Trailing commas, single quotes instead of double quotes, unquoted keys, and comments. JSON allows none of these, even though JavaScript does.',
      },
      {
        question: 'Does this validate against a JSON Schema?',
        answer:
          'This page checks syntax only. To check structure and types as well, use the JSON Schema Validator.',
      },
    ],
  },
  diff: {
    heading: 'About JSON Diff',
    intro:
      'Compare two JSON documents by structure rather than by text. Reordered keys and different indentation are ignored, so you only see real changes: values that were added, removed or changed.',
    steps: [
      'Paste the original document on the left and the new one on the right.',
      'Press Compare to highlight every difference in both documents.',
      'Review each change; its location is shown as a JSON Pointer path such as /user/name.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Does key order matter?',
        answer:
          'No. Objects are compared key by key, so {"a":1,"b":2} and {"b":2,"a":1} are identical.',
      },
      {
        question: 'How are arrays compared?',
        answer:
          'By position. Inserting an item near the start of an array shows every later item as changed.',
      },
    ],
  },
  jsonpath: {
    heading: 'About the JSONPath Tester',
    intro:
      'JSONPath is a query language for picking values out of JSON, much like XPath for XML. Type an expression and see exactly which values it matches in your document.',
    steps: [
      'Paste or upload your JSON document.',
      'Enter an expression starting with $, for example $.store.books[*].title.',
      'Run the query to see every match as a JSON array.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Which syntax is supported?',
        answer:
          'Child paths ($.a.b), wildcards ([*]), recursive descent ($..name), array indexes and slices ([0], [0:3]) and unions ([0,2]).',
      },
      {
        question: 'Why are filter expressions disabled?',
        answer:
          'Filters such as [?(@.price < 10)] evaluate script code. They are disabled so that a pasted query can never run code in your browser.',
      },
    ],
  },
  toYaml: {
    heading: 'About the JSON to YAML Converter',
    intro:
      'Turn JSON into YAML, the indentation-based format used by Kubernetes, Docker Compose, GitHub Actions and many other config files.',
    steps: [
      'Paste or upload your JSON.',
      'Press Convert to YAML.',
      'Copy or download the YAML, or use the output as your next input.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Is every JSON document valid YAML?',
        answer:
          'Yes. YAML 1.2 is a superset of JSON, so the conversion is lossless. Key order is preserved.',
      },
      {
        question: 'Can I convert back to JSON?',
        answer: 'Yes. Choose YAML → JSON in the Convert menu.',
      },
    ],
  },
  fromYaml: {
    heading: 'About the YAML to JSON Converter',
    intro:
      'Convert YAML config files into formatted JSON, for APIs, scripts or tools that only understand JSON.',
    steps: [
      'Paste or upload your YAML.',
      'Press Convert to JSON.',
      'Copy or download the formatted JSON.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'What happens with duplicate keys?',
        answer:
          'They are reported as an error instead of silently keeping one value, so nothing is lost without you noticing.',
      },
      {
        question: 'Are YAML anchors and aliases supported?',
        answer:
          'Yes, they are expanded in the JSON output. The number of aliases is capped to protect against documents designed to explode in size.',
      },
    ],
  },
  toCsv: {
    heading: 'About the JSON to CSV Converter',
    intro:
      'Turn an array of JSON objects into a CSV table you can open in Excel, Google Sheets or Numbers. Each object becomes a row and each key becomes a column.',
    steps: [
      'Paste a JSON array of objects, such as [{"name":"Ada"},{"name":"Linus"}].',
      'Press Convert to CSV.',
      'Download the CSV and open it in any spreadsheet app.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'What if objects have different keys?',
        answer:
          'The columns are the union of every key. Rows without a value for a column leave that cell empty.',
      },
      {
        question: 'How are nested objects and arrays handled?',
        answer: 'They are written into the cell as JSON text.',
      },
      {
        question: 'Why do some cells start with an apostrophe?',
        answer:
          'Values that start with =, +, - or @ are escaped so spreadsheet apps do not run them as formulas.',
      },
    ],
  },
  fromCsv: {
    heading: 'About the CSV to JSON Converter',
    intro:
      'Convert a CSV export into a JSON array of objects. The first row provides the keys and every following row becomes one object.',
    steps: [
      'Paste CSV text or upload a .csv file. The first row must contain column names.',
      'Press Convert to JSON.',
      'Copy or download the JSON array.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Why are numbers converted as strings?',
        answer:
          'CSV has no types, so every cell is kept exactly as written. This avoids surprises like ZIP codes losing leading zeros.',
      },
      {
        question: 'Do column names have to be unique?',
        answer:
          'Yes. Duplicate headers are reported as an error, because JSON keys must be unique.',
      },
    ],
  },
  toXml: {
    heading: 'About the JSON to XML Converter',
    intro:
      'Convert JSON into well-formed XML for systems that only accept XML. The output keeps types explicit, so it can be mapped back to the original JSON.',
    steps: [
      'Paste or upload your JSON.',
      'Press Convert to XML.',
      'Copy or download the XML document.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'What does the XML look like?',
        answer:
          'Objects become <object> elements with one <property name="…"> per key, arrays become <array> with <item> children, and values are wrapped in <string>, <number>, <boolean> or <null/>.',
      },
      {
        question: 'Why do I get a control character error?',
        answer:
          'XML 1.0 cannot represent most control characters, even escaped. Remove them from your strings and convert again.',
      },
    ],
  },
  schemaValidate: {
    heading: 'About the JSON Schema Validator',
    intro:
      'JSON Schema describes what a valid document looks like: required fields, types, allowed values and more. Validate a document against a schema and see every problem at once.',
    steps: [
      'Paste the JSON document on the left.',
      'Paste a JSON Schema on the right, or press Generate to create one from your document.',
      'Press Validate to see whether the document matches, with every error listed.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Which JSON Schema version is supported?',
        answer:
          'Draft-07. Most schemas written for newer drafts also work if they avoid newer keywords.',
      },
      {
        question: 'Are "format" keywords checked?',
        answer:
          'No. Annotations such as "format": "email" are accepted but not validated. Only local $ref references are resolved.',
      },
    ],
  },
  schemaGenerate: {
    heading: 'About the JSON Schema Generator',
    intro:
      'Start a JSON Schema from an example instead of writing it by hand. The generator reads your document and describes its types, properties and arrays as a Draft-07 schema.',
    steps: [
      'Paste a representative JSON document.',
      'Press Generate to create the schema.',
      'Review and adjust it, then press Validate to test documents against it.',
    ],
    faqs: [
      LOCAL,
      {
        question: 'Why is every field marked as required?',
        answer:
          'The generator only sees one example, so it treats every key it finds as required. Remove optional fields from "required" before using the schema.',
      },
      {
        question: 'How are numbers typed?',
        answer:
          'Whole numbers become "integer" and decimals become "number". Change the type to "number" if a field can hold both.',
      },
    ],
  },
};
