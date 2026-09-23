export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export function sortKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  return value;
}
export function inferSchema(value: JsonValue): Record<string, unknown> {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    const variants = [
      ...new Map(
        value.map((item) => {
          const schema = inferSchema(item);
          return [JSON.stringify(schema), schema];
        }),
      ).values(),
    ];
    return {
      type: 'array',
      ...(variants.length
        ? { items: variants.length === 1 ? variants[0] : { anyOf: variants } }
        : {}),
    };
  }
  if (typeof value === 'object')
    return {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, inferSchema(item)]),
      ),
      ...(Object.keys(value).length ? { required: Object.keys(value) } : {}),
    };
  return { type: typeof value === 'number' && Number.isInteger(value) ? 'integer' : typeof value };
}
export interface Difference {
  path: string;
  change: 'added' | 'removed' | 'changed';
  before?: JsonValue;
  after?: JsonValue;
}
export function diffJson(before: JsonValue, after: JsonValue, path = ''): Difference[] {
  if (Object.is(before, after)) return [];
  if (
    before !== null &&
    after !== null &&
    typeof before === 'object' &&
    typeof after === 'object' &&
    Array.isArray(before) === Array.isArray(after)
  ) {
    const left = before as Record<string, JsonValue>,
      right = after as Record<string, JsonValue>;
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].flatMap(
      (key): Difference[] => {
        const next = `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
        if (!Object.hasOwn(left, key)) return [{ path: next, change: 'added', after: right[key] }];
        if (!Object.hasOwn(right, key))
          return [{ path: next, change: 'removed', before: left[key] }];
        return diffJson(left[key], right[key], next);
      },
    );
  }
  return [{ path: path || '/', change: 'changed', before, after }];
}
/**
 * Parses JSON, unwrapping documents that were stringified one or more times, such as
 * "{\"a\":1}" copied from a log, with or without the surrounding quotes.
 */
export function parseJsonText(text: string): { value: JsonValue; unwrapped: boolean } {
  let value: JsonValue;
  let syntaxError: unknown = null;
  try {
    value = JSON.parse(text);
  } catch (error) {
    // An escaped document pasted without its quotes, e.g. {\"a\":1}.
    if (!/^\s*[[{]\s*\\"/.test(text)) throw error;
    syntaxError = error;
    try {
      value = JSON.parse(`"${text.trim()}"`);
    } catch {
      throw error;
    }
  }
  // Unwrap nested strings, but only keep the result when it ends in an object or array,
  // so a plain string such as "\"quoted\"" is left as it is.
  let inner: JsonValue = value;
  for (let depth = 0; typeof inner === 'string' && depth < 8; depth++) {
    try {
      inner = JSON.parse(inner) as JsonValue;
    } catch {
      break;
    }
  }
  const unwrapped = typeof value === 'string' && inner !== null && typeof inner === 'object';
  if (unwrapped) value = inner;
  else if (syntaxError) throw syntaxError;
  return { value, unwrapped };
}
export const parseJson = (text: string): JsonValue => parseJsonText(text).value;
