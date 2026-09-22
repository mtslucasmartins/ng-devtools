import type { ProcessRequest, ProcessResult } from '../ports/json-processor';
import { diffJson, inferSchema, type JsonValue } from '../domain/json';
const xmlEscape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
function xml(value: JsonValue): string {
  if (value === null) return '<null/>';
  if (Array.isArray(value))
    return `<array>${value.map((item) => `<item>${xml(item)}</item>`).join('')}</array>`;
  if (typeof value === 'object')
    return `<object>${Object.entries(value)
      .map(([key, item]) => `<property name="${xmlEscape(key)}">${xml(item)}</property>`)
      .join('')}</object>`;
  return `<${typeof value}>${xmlEscape(String(value))}</${typeof value}>`;
}
export async function processExtended(request: ProcessRequest): Promise<ProcessResult> {
  const { operation, input, secondary, query, indent } = request;
  const pretty = (value: unknown) => JSON.stringify(value, null, indent);
  let output: string,
    language = 'json',
    message = 'Done. Processed entirely on your device.';
  switch (operation) {
    case 'toYaml': {
      const { stringify } = await import('yaml');
      output = stringify(JSON.parse(input));
      language = 'yaml';
      break;
    }
    case 'fromYaml': {
      const { parseDocument } = await import('yaml');
      const doc = parseDocument(input, { uniqueKeys: true });
      if (doc.errors.length) throw new Error(doc.errors.map((error) => error.message).join('\n'));
      output = pretty(doc.toJS({ maxAliasCount: 100 }));
      if (output === undefined)
        throw new Error('This YAML document cannot be represented as JSON.');
      break;
    }
    case 'toCsv': {
      const { default: Papa } = await import('papaparse');
      const data: unknown = JSON.parse(input);
      if (
        !Array.isArray(data) ||
        !data.length ||
        !data.every((row) => row !== null && typeof row === 'object' && !Array.isArray(row))
      )
        throw new Error('CSV conversion needs a non-empty JSON array of objects.');
      const fields = [...new Set(data.flatMap((row) => Object.keys(row)))];
      output = Papa.unparse(
        {
          fields,
          data: data.map((row) =>
            fields.map((key) => {
              const value = row[key];
              return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
            }),
          ),
        },
        { escapeFormulae: true },
      );
      language = 'csv';
      message = 'CSV ready. Nested values are JSON strings; spreadsheet formulas are escaped.';
      break;
    }
    case 'fromCsv': {
      const { default: Papa } = await import('papaparse');
      const result = Papa.parse(input, { header: true, skipEmptyLines: 'greedy' });
      if (result.errors.length)
        throw new Error(result.errors.map((error) => error.message).join('\n'));
      if (result.meta.renamedHeaders && Object.keys(result.meta.renamedHeaders).length)
        throw new Error('CSV column names must be unique.');
      output = pretty(result.data);
      message = 'CSV converted. Cell values are preserved as strings.';
      break;
    }
    case 'jsonpath': {
      const { JSONPath } = await import('jsonpath-plus');
      if (!query.trim().startsWith('$'))
        throw new Error('Start your JSONPath with $, for example $.favorites[*].');
      output = pretty(JSONPath({ path: query, json: JSON.parse(input), eval: false }));
      message = 'Query complete. Script expressions are disabled for safety.';
      break;
    }
    case 'diff': {
      const changes = diffJson(JSON.parse(input), JSON.parse(secondary));
      output = pretty(changes);
      message = changes.length
        ? `${changes.length} difference${changes.length === 1 ? '' : 's'} found.`
        : 'These JSON documents are identical.';
      break;
    }
    case 'schemaGenerate':
      output = pretty({
        $schema: 'http://json-schema.org/draft-07/schema#',
        ...inferSchema(JSON.parse(input)),
      });
      message = 'Schema inferred from this sample. Review required fields before use.';
      break;
    case 'schemaValidate': {
      const { default: Ajv } = await import('ajv');
      const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
      const validate = ajv.compile(JSON.parse(secondary));
      const valid = validate(JSON.parse(input));
      output = pretty({ valid, errors: validate.errors ?? [] });
      message = valid
        ? 'JSON matches the schema.'
        : `Schema validation failed: ${validate.errors?.length} issue(s).`;
      break;
    }
    case 'escape':
      output = JSON.stringify(input);
      break;
    case 'unescape': {
      const value: unknown = JSON.parse(input);
      if (typeof value !== 'string')
        throw new Error('Unescape expects a JSON string enclosed in double quotes.');
      output = value;
      language = 'text';
      break;
    }
    case 'toXml': {
      if (
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(
          JSON.stringify(JSON.parse(input)).replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) =>
            String.fromCharCode(parseInt(hex, 16)),
          ),
        )
      )
        throw new Error('Input contains control characters that XML 1.0 cannot represent.');
      output = `<?xml version="1.0" encoding="UTF-8"?>\n<root>${xml(JSON.parse(input))}</root>`;
      language = 'xml';
      break;
    }
    default:
      throw new Error('Unknown JSON operation.');
  }
  return { output, language, message };
}
