import type { JsonProcessor, ProcessRequest, ProcessResult } from '../ports/json-processor';
import { sortKeys } from '../domain/json';
export class BrowserJsonProcessor implements JsonProcessor {
  async process(request: ProcessRequest): Promise<ProcessResult> {
    const { operation, input, indent } = request;
    switch (operation) {
      case 'format':
        return {
          output: JSON.stringify(JSON.parse(input), null, indent),
          language: 'json',
          message: 'JSON formatted. Looking good.',
        };
      case 'minify':
        return {
          output: JSON.stringify(JSON.parse(input)),
          language: 'json',
          message: 'JSON minified.',
        };
      case 'validate':
        return {
          output: JSON.stringify(JSON.parse(input), null, indent),
          language: 'json',
          message: 'Valid JSON. Everything is in its place.',
        };
      case 'sort':
        return {
          output: JSON.stringify(sortKeys(JSON.parse(input)), null, indent),
          language: 'json',
          message: 'Object keys sorted alphabetically.',
        };
      default:
        return (await import('./extended-processors')).processExtended(request);
    }
  }
}
