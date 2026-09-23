# Moss · local developer tools

An Angular + TypeScript developer workspace, styled with locally bundled Bootstrap and Font Awesome. Tool processing happens entirely in the browser. Documents live in memory and are discarded when the tab closes; Data Tools scripts persist in browser storage. There are no analytics or remote fonts.

## Run

```sh
npm ci
npm start
npm run build
npm test -- --watch=false
```

Open `http://localhost:4200`. Production files are in `dist/ng-devtools/browser` and can be served by any static host. Internet access is needed to install packages, not to process documents. This is not an offline-installable PWA.

## Layout

- `src/app`: application entry UI.
- `src/features/json/domain`: pure JSON comparison, sorting, and schema inference.
- `src/features/json/application`: tool metadata and command registration.
- `src/features/json/ports`: processing contract and injection token.
- `src/features/json/infrastructure`: browser adapter and lazy third-party processors.
- `src/features/json/ui`: JSON workspace and presentation components.
- `src/features/commands`: feature-independent command registry and palette.
- `src/shared/workspace`: shared, memory-only input and output.

The composition root in `src/main.ts` binds `JSON_PROCESSOR` to `BrowserJsonProcessor`. Replace that provider to swap processing infrastructure. The domain layer has no Angular or library dependencies. YAML, Papa Parse, Ajv, and JSONPath Plus load only when used; formatting, minifying, validation, and sorting are immediately available.

Register tools through feature metadata and commands through `CommandRegistry.register`. The palette discovers commands from the registry, supports fuzzy matching, and ranks the current tool's actions first. It contains no tool list. Navigation never clears shared input. Format and Minify transform a single document editor, with an Undo transformation button (available until the next manual edit). JSON validation runs automatically and shows a warning for invalid input. Other tools keep separate input/output panes; **Use output as input** promotes their results for the next operation.

## Tools and shortcuts

Viewer with code/tree views, format/stringify/minify actions (stringified JSON is unwrapped automatically), automatic validation, structural diff, JSONPath, JSON ↔ YAML, JSON ↔ CSV, JSON → XML, JSON Schema validation/generation, YAML tools, JSON data generation, and regex match/replace.

- `Ctrl/Cmd + K` or double `Shift`: open commands.
- `Ctrl/Cmd + Enter`: run the selected tool.
- `Ctrl/Cmd + Shift + F` / `Ctrl/Cmd + Shift + M`: format / minify in the single document editor.
- Palette: arrow keys, Enter, Escape; native dialog keeps focus inside.
- Floating Actions button works on desktop and mobile.

## Deliberate behavior

- Diff keeps two editable documents. Compare opens aligned JSON with green additions, red removals, and amber changes, plus text markers. Each pane can return to Edit independently; comparisons refresh live and original input is preserved. Object keys align regardless of order; arrays compare by index.
- The Schema tab pairs Document and Schema editors. Generate fills the schema editor; Validate displays a separate Result view. Editing either source invalidates the old result.
- Schema validation supports draft-07, bundled/local references, and all validation errors. Remote references never fetch data. `format` annotations are not enforced. Generated schemas are sample-derived starting points; review required fields and constraints.
- JSONPath supports property selection, wildcards, recursive descent, and slices. Script/filter expressions are disabled; no input is executed as JavaScript.
- CSV export expects a non-empty array of objects. It includes the union of column names, JSON-encodes nested values, and escapes spreadsheet formula prefixes. CSV import keeps cell values as strings and rejects duplicate headers and malformed rows.
- XML uses typed `object`, `property name="…"`, `array`, and `item` elements to preserve arbitrary JSON keys. It is not an application-specific XML mapping.
- Native JSON parsing has JavaScript number precision. File uploads are limited to 5 MB. Processing runs on the main thread; very large pasted documents can pause the UI. The processor port is the boundary for a future worker adapter if needed.
- The sponsor column is a static placeholder and is hidden on smaller screens.
