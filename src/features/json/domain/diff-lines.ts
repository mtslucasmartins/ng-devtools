import type { JsonValue } from './json';
export type DiffKind = 'same' | 'added' | 'removed' | 'changed' | 'empty';
export interface DiffLine {
  text: string;
  kind: DiffKind;
  number?: number;
}
export interface DiffRow {
  left: DiffLine;
  right: DiffLine;
}

// Objects align by key; arrays compare by index, matching the structural diff contract.
export function diffLines(left: JsonValue, right: JsonValue): DiffRow[] {
  const rows: DiffRow[] = [];
  const add = (a: string, b: string, leftKind: DiffKind = 'same', rightKind: DiffKind = leftKind) =>
    rows.push({ left: { text: a, kind: leftKind }, right: { text: b, kind: rightKind } });
  const block = (value: JsonValue, depth: number, prefix: string, comma: string) =>
    JSON.stringify(value, null, 2)
      .split('\n')
      .map(
        (line, index, lines) =>
          '  '.repeat(depth) +
          (index === 0 ? prefix : '') +
          line +
          (index === lines.length - 1 ? comma : ''),
      );
  function visit(
    a: JsonValue | undefined,
    b: JsonValue | undefined,
    depth: number,
    prefix = '',
    leftComma = '',
    rightComma = '',
  ) {
    const padding = '  '.repeat(depth);
    const aObject = a !== null && typeof a === 'object';
    const bObject = b !== null && typeof b === 'object';
    if (aObject && bObject && Array.isArray(a) === Array.isArray(b)) {
      const array = Array.isArray(a);
      add(padding + prefix + (array ? '[' : '{'), padding + prefix + (array ? '[' : '{'));
      const leftKeys = Object.keys(a),
        rightKeys = Object.keys(b);
      const keys = [...new Set([...leftKeys, ...rightKeys])];
      const leftOrder = keys.filter((key) => Object.hasOwn(a, key));
      const rightOrder = keys.filter((key) => Object.hasOwn(b, key));
      const av = a as Record<string, JsonValue>,
        bv = b as Record<string, JsonValue>;
      for (const key of keys) {
        visit(
          Object.hasOwn(a, key) ? av[key] : undefined,
          Object.hasOwn(b, key) ? bv[key] : undefined,
          depth + 1,
          array ? '' : JSON.stringify(key) + ': ',
          key === leftOrder.at(-1) ? '' : ',',
          key === rightOrder.at(-1) ? '' : ',',
        );
      }
      add(padding + (array ? ']' : '}') + leftComma, padding + (array ? ']' : '}') + rightComma);
      return;
    }
    const aLines = a === undefined ? [] : block(a, depth, prefix, leftComma);
    const bLines = b === undefined ? [] : block(b, depth, prefix, rightComma);
    const kind =
      a === undefined
        ? 'added'
        : b === undefined
          ? 'removed'
          : Object.is(a, b)
            ? 'same'
            : 'changed';
    for (let index = 0; index < Math.max(aLines.length, bLines.length); index++) {
      add(
        aLines[index] ?? '',
        bLines[index] ?? '',
        aLines[index] === undefined ? 'empty' : kind,
        bLines[index] === undefined ? 'empty' : kind,
      );
    }
  }
  visit(left, right, 0);
  let leftNumber = 0,
    rightNumber = 0;
  for (const row of rows) {
    if (row.left.kind !== 'empty') row.left.number = ++leftNumber;
    if (row.right.kind !== 'empty') row.right.number = ++rightNumber;
  }
  return rows;
}
