import type { JsonProcessor, ProcessRequest, ProcessResult } from '../ports/json-processor';
import { parseJson, parseJsonText, sortKeys } from '../domain/json';
export class BrowserJsonProcessor implements JsonProcessor {
  async process(request: ProcessRequest): Promise<ProcessResult> {
    const { operation, input, indent } = request;
    switch (operation) {
      case 'format': {
        const { value, unwrapped } = parseJsonText(input);
        return {
          output: JSON.stringify(value, null, indent),
          language: 'json',
          message: unwrapped
            ? 'Stringified JSON parsed and formatted.'
            : 'JSON formatted. Looking good.',
        };
      }
      case 'minify':
        return {
          output: JSON.stringify(parseJson(input)),
          language: 'json',
          message: 'JSON minified.',
        };
      case 'stringify':
        return {
          output: JSON.stringify(JSON.stringify(parseJson(input))),
          language: 'json',
          message: 'JSON stringified into a single string value.',
        };
      case 'validate':
        return {
          output: JSON.stringify(parseJson(input), null, indent),
          language: 'json',
          message: 'Valid JSON. Everything is in its place.',
        };
      case 'sort':
        return {
          output: JSON.stringify(sortKeys(parseJson(input)), null, indent),
          language: 'json',
          message: 'Object keys sorted alphabetically.',
        };
      default:
        return (await import('./extended-processors')).processExtended(request);
    }
  }
}
