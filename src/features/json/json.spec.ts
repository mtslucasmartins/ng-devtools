import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Title } from '@angular/platform-browser';
import { routes } from '../../app/app.routes';
import { JsonWorkspace } from './ui/json-workspace';
import { BrowserJsonProcessor } from './infrastructure/browser-json-processor';
import { JSON_PROCESSOR, type Operation } from './ports/json-processor';
import { JSON_TOOLS } from './application/tools';
import { TOOL_GUIDES } from './application/tool-guides';
import { CommandRegistry } from '../commands/application/command-registry';
import { registerJsonCommands } from './application/register-commands';
import { diffLines } from './domain/diff-lines';
import { tokenize } from './ui/code-output';
const processor = new BrowserJsonProcessor();
const run = (operation: Operation, input: string, secondary = '', query = '$.items[*]') =>
  processor.process({ operation, input, secondary, query, indent: 2 });
describe('local JSON workspace', () => {
  it('formats, minifies, validates and recursively sorts without changing values', async () => {
    const input = '{"z":[{"b":2,"a":1}],"__proto__":{"safe":true},"a":null}';
    for (const operation of ['format', 'minify', 'validate', 'sort'] as const) {
      const result = await run(operation, input);
      expect(JSON.parse(result.output)).toEqual(JSON.parse(input));
    }
    expect(Object.keys(JSON.parse((await run('sort', input)).output))).toEqual([
      '__proto__',
      'a',
      'z',
    ]);
    await expect(run('validate', '{')).rejects.toThrow();
  });
  it('compares structures and escapes JSON pointer paths', async () => {
    const result = await run('diff', '{"a/b":1,"old":null}', '{"a/b":2,"new":true}');
    expect(JSON.parse(result.output)).toEqual([
      { path: '/a~1b', change: 'changed', before: 1, after: 2 },
      { path: '/old', change: 'removed', before: null },
      { path: '/new', change: 'added', after: true },
    ]);
    expect(JSON.parse((await run('diff', '{"b":2,"a":1}', '{"a":1,"b":2}')).output)).toEqual([]);
  });
  it('round trips YAML and rejects duplicate keys', async () => {
    const input = '{"items":["one",false,null,2],"nested":{"name":"Moss"}}';
    expect(JSON.parse((await run('fromYaml', (await run('toYaml', input)).output)).output)).toEqual(
      JSON.parse(input),
    );
    await expect(run('fromYaml', 'a: 1\na: 2')).rejects.toThrow();
  });
  it('preserves CSV quotes and newlines and includes fields from every row', async () => {
    const records = [
      { name: 'a,"b"\nc', extra: 'yes' },
      { name: 'fern', other: 'x' },
    ];
    const csv = await run('toCsv', JSON.stringify(records));
    expect(JSON.parse((await run('fromCsv', csv.output)).output)).toEqual([
      { name: 'a,"b"\nc', extra: 'yes', other: '' },
      { name: 'fern', extra: '', other: 'x' },
    ]);
    await expect(run('toCsv', '{"name":"Moss"}')).rejects.toThrow('array');
    await expect(run('fromCsv', 'a,b\n1,2,3')).rejects.toThrow();
  });
  it('queries JSON without permitting executable expressions', async () => {
    expect(JSON.parse((await run('jsonpath', '{"items":[1,2]}')).output)).toEqual([1, 2]);
    await expect(run('jsonpath', '{"items":[1,2]}', '', '$.items[?(@ > 1)]')).rejects.toThrow();
  });
  it('generates a schema that accepts a heterogeneous sample and reports violations', async () => {
    const input = '{"items":[{"a":1},{"b":null},false],"empty":[],"name":"Moss"}';
    const schema = (await run('schemaGenerate', input)).output;
    expect(JSON.parse((await run('schemaValidate', input, schema)).output).valid).toBe(true);
    expect(JSON.parse((await run('schemaValidate', '{}', schema)).output).valid).toBe(false);
    await expect(
      run('schemaValidate', '{}', '{"$ref":"https://example.com/schema"}'),
    ).rejects.toThrow();
  });
  it('escapes text reversibly and creates valid XML with arbitrary object keys', async () => {
    const input = 'a "quote"\n<element>&';
    expect((await run('unescape', (await run('escape', input)).output)).output).toBe(input);
    await expect(run('unescape', '{}')).rejects.toThrow();
    const document = new DOMParser().parseFromString(
      (await run('toXml', '{"a b":"<&\\\""}')).output,
      'application/xml',
    );
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.querySelector('property')?.getAttribute('name')).toBe('a b');
    expect(document.querySelector('string')?.textContent).toBe('<&"');
  });
  it('fuzzy searches registered commands and ranks current actions first', () => {
    const registry = new CommandRegistry();
    registerJsonCommands(registry);
    expect(registry.search('', 'toYaml')[0].id).toBe('json.toYaml');
    expect(registry.search('fmt', 'format').some((command) => command.id === 'json.format')).toBe(
      true,
    );
    registry.register([
      {
        id: 'plugin.test',
        title: 'Custom plugin',
        keywords: ['example'],
        category: 'Navigation',
        execute: () => {},
      },
    ]);
    expect(registry.search('custom', 'format')[0].id).toBe('plugin.test');
  });
  it('renders all navigation and preserves workspace data and output on invalid input', async () => {
    TestBed.configureTestingModule({
      imports: [JsonWorkspace],
      providers: [
        provideRouter(routes),
        { provide: JSON_PROCESSOR, useClass: BrowserJsonProcessor },
      ],
    });
    const fixture = TestBed.createComponent(JsonWorkspace);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(fixture.nativeElement.querySelectorAll('.nav-item')).toHaveLength(1);
    const convertTab = Array.from(
      fixture.nativeElement.querySelectorAll('.tool-tabs button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.trim() === 'Convert')!;
    convertTab.click();
    fixture.detectChanges();
    expect(app.active()).toBe('toYaml');
    expect(fixture.nativeElement.querySelectorAll('#conversion option')).toHaveLength(5);
    const conversion = fixture.nativeElement.querySelector('#conversion') as HTMLSelectElement;
    conversion.value = 'toCsv';
    conversion.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(app.active()).toBe('toCsv');
    app.navigate('format');
    app.editInput('{"name":"Moss"}');
    await app.run();
    const output = app.workspace.output();
    const formatted = '{\n  "name": "Moss"\n}';
    expect(app.workspace.input()).toBe(formatted);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.output-pane')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tool-tabs').textContent).not.toContain('Validate');
    expect(fixture.nativeElement.querySelector('.tool-tabs').textContent).not.toContain('Minify');
    app.undoTransform();
    expect(app.workspace.input()).toBe('{"name":"Moss"}');
    await app.run();
    app.navigate('minify');
    expect(app.active()).toBe('format');
    expect(app.workspace.input()).toBe(formatted);
    await app.run('minify');
    expect(app.workspace.input()).toBe('{"name":"Moss"}');
    app.undoTransform();
    expect(app.workspace.input()).toBe(formatted);
    const minifyShortcut = new KeyboardEvent('keydown', {
      key: 'M',
      ctrlKey: true,
      shiftKey: true,
      cancelable: true,
    });
    app.shortcuts(minifyShortcut);
    await fixture.whenStable();
    expect(minifyShortcut.defaultPrevented).toBe(true);
    expect(app.workspace.input()).toBe('{"name":"Moss"}');
    const formatShortcut = new KeyboardEvent('keydown', {
      key: 'f',
      metaKey: true,
      shiftKey: true,
      cancelable: true,
    });
    app.shortcuts(formatShortcut);
    await fixture.whenStable();
    expect(formatShortcut.defaultPrevented).toBe(true);
    expect(app.workspace.input()).toBe(formatted);
    fixture.detectChanges();
    const actions = fixture.nativeElement.querySelector('.editor-actions');
    expect(actions.querySelector('button:first-child').textContent).toContain('Minify');
    expect(actions.querySelector('button:last-child').textContent).toContain('Format');
    expect(actions.textContent).not.toContain('Format JSON');
    app.editInput('{');
    fixture.detectChanges();
    expect(app.jsonWarning()).not.toBe('');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    await app.run();
    expect(app.error()).not.toBe('');
    expect(app.workspace.output()).toBe(output);
    expect(app.workspace.input()).toBe('{');
    app.editInput('{"valid":true}');
    expect(app.jsonWarning()).toBe('');
    app.navigate('fromYaml');
    app.editInput('name: Moss');
    expect(app.jsonWarning()).toBe('');
    await app.run();
    expect(app.workspace.input()).toBe('name: Moss');
    expect(JSON.parse(app.workspace.output())).toEqual({ name: 'Moss' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.output-pane')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.floating-command')).not.toBeNull();
  });
  it('generates and validates in one Schema workspace without replacing the document or schema with results', async () => {
    TestBed.configureTestingModule({
      imports: [JsonWorkspace],
      providers: [
        provideRouter(routes),
        { provide: JSON_PROCESSOR, useClass: BrowserJsonProcessor },
      ],
    });
    const fixture = TestBed.createComponent(JsonWorkspace);
    const app = fixture.componentInstance;
    app.navigate('schemaGenerate');
    app.editInput('{"name":"Moss","count":2}');
    fixture.detectChanges();
    expect(app.active()).toBe('schemaValidate');
    expect(fixture.nativeElement.querySelectorAll('.editor-panes textarea')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.secondary-panel')).toBeNull();
    const document = app.workspace.input();
    await app.run('schemaGenerate');
    fixture.detectChanges();
    const schema = app.secondary();
    expect(JSON.parse(schema).properties.count.type).toBe('integer');
    expect(app.workspace.input()).toBe(document);
    expect(app.schemaView()).toBe('schema');
    await app.run('schemaValidate');
    fixture.detectChanges();
    expect(app.schemaView()).toBe('result');
    expect(app.schemaValid()).toBe(true);
    expect(app.secondary()).toBe(schema);
    expect(app.workspace.input()).toBe(document);
    app.schemaView.set('schema');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement.querySelector('#schema-editor') as HTMLTextAreaElement).value,
    ).toBe(schema);
    app.editInput('{"name":"Moss","count":"two"}');
    expect(app.schemaResult()).toBeNull();
    expect(app.schemaView()).toBe('schema');
    await app.run('schemaValidate');
    expect(app.schemaValid()).toBe(false);
    expect(JSON.parse(app.schemaResult()!).errors[0].instancePath).toBe('/count');
    app.editSecondary('{');
    expect(app.schemaResult()).toBeNull();
    await app.run('schemaValidate');
    expect(app.error()).not.toBe('');
    expect(app.secondary()).toBe('{');
    app.navigate('format');
    app.navigate('schemaValidate');
    expect(app.secondary()).toBe('{');
  });
  it('aligns structural changes while preserving complete JSON on both sides', () => {
    const left = { 'a/b': { old: [1, null] }, unchanged: false, removed: 'x' };
    const right = { unchanged: false, 'a/b': [2, true], added: { value: 'x' } };
    const rows = diffLines(left, right);
    for (const side of ['left', 'right'] as const) {
      const lines = rows.map((row) => row[side]).filter((line) => line.kind !== 'empty');
      expect(JSON.parse(lines.map((line) => line.text).join('\n'))).toEqual(
        side === 'left' ? left : right,
      );
      expect(lines.map((line) => line.number)).toEqual(lines.map((_, index) => index + 1));
    }
    expect(rows.some((row) => row.left.kind === 'removed')).toBe(true);
    expect(rows.some((row) => row.right.kind === 'added')).toBe(true);
    expect(rows.some((row) => row.left.kind === 'changed')).toBe(true);
    expect(
      diffLines({ b: 2, a: 1 }, { a: 1, b: 2 }).every(
        (row) => row.left.kind === 'same' && row.right.kind === 'same',
      ),
    ).toBe(true);
    expect(diffLines(null, false)[0].left.kind).toBe('changed');
    expect(
      diffLines([1, 2], [1]).some(
        (row) => row.left.kind === 'removed' && row.right.kind === 'empty',
      ),
    ).toBe(true);
  });
  it('keeps both diff documents editable, refreshes highlights, and preserves input across navigation', async () => {
    TestBed.configureTestingModule({
      imports: [JsonWorkspace],
      providers: [
        provideRouter(routes),
        { provide: JSON_PROCESSOR, useClass: BrowserJsonProcessor },
      ],
    });
    const fixture = TestBed.createComponent(JsonWorkspace);
    const app = fixture.componentInstance;
    app.navigate('diff');
    app.editInput('{"a":1,"old":true}');
    app.diffRight.set('{"a":2,"new":true}');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.diff-panes textarea')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.secondary-panel')).toBeNull();
    await app.run();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.diff-highlight')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.diff-added')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.diff-removed')).not.toBeNull();
    const diff = app.diffEditor()!;
    diff.setView('right', false);
    fixture.detectChanges();
    const rightEditor = fixture.nativeElement.querySelector('#diff-right') as HTMLTextAreaElement;
    rightEditor.value = '{"a":1,"old":true}';
    rightEditor.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(app.diffRight()).toBe('{"a":1,"old":true}');
    expect(diff.summary()).toContain('Identical');
    expect(app.workspace.input()).toBe('{"a":1,"old":true}');
    diff.update('left', '{');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.diff-error').textContent).toContain(
      'Left document',
    );
    expect(fixture.nativeElement.querySelectorAll('.diff-highlight')).toHaveLength(0);
    app.navigate('format');
    fixture.detectChanges();
    app.navigate('diff');
    fixture.detectChanges();
    expect(app.workspace.input()).toBe('{');
    expect(app.diffRight()).toBe('{"a":1,"old":true}');
  });
  it('keeps every character when highlighting escaped strings and numbers', () => {
    const input = '  "name": "a \\" quote", "count": -1.2e+3,';
    expect(
      tokenize(input)
        .map((token) => token.value)
        .join(''),
    ).toBe(input);
  });
  it('gives every tool its own URL and page metadata, and keeps tabs in sync with the URL', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: JSON_PROCESSOR, useClass: BrowserJsonProcessor },
      ],
    });
    expect(new Set(JSON_TOOLS.map((tool) => tool.path)).size).toBe(JSON_TOOLS.length);
    for (const tool of JSON_TOOLS) expect(TOOL_GUIDES[tool.id]?.faqs.length).toBeGreaterThan(0);
    const harness = await RouterTestingHarness.create();
    const app = await harness.navigateByUrl('/tools/json/to-csv', JsonWorkspace);
    expect(app.active()).toBe('toCsv');
    expect(TestBed.inject(Title).getTitle()).toBe('JSON to CSV Converter | Moss');
    app.navigate('diff');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/tools/json/diff');
    await harness.navigateByUrl('/tools/json/minify');
    expect(app.active()).toBe('format');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(
      /^https:\/\/lurtins\.com\/tools\/json\/minify$/,
    );
    await harness.navigateByUrl('/tools/yaml');
    expect(TestBed.inject(Router).url).toBe('/tools/json/viewer');
    await harness.navigateByUrl('/tools/json/unknown');
    expect(TestBed.inject(Router).url).toBe('/tools/json/viewer');
  });
});
