import { InjectionToken } from '@angular/core';
export type Operation =
  | 'format'
  | 'minify'
  | 'validate'
  | 'sort'
  | 'diff'
  | 'jsonpath'
  | 'toYaml'
  | 'fromYaml'
  | 'toCsv'
  | 'fromCsv'
  | 'toXml'
  | 'escape'
  | 'unescape'
  | 'schemaValidate'
  | 'schemaGenerate';
export interface ProcessRequest {
  operation: Operation;
  input: string;
  secondary: string;
  query: string;
  indent: number;
}
export interface ProcessResult {
  output: string;
  language: string;
  message: string;
}
export interface JsonProcessor {
  process(request: ProcessRequest): Promise<ProcessResult>;
}
export const JSON_PROCESSOR = new InjectionToken<JsonProcessor>('JSON_PROCESSOR');
