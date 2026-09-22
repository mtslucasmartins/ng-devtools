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
