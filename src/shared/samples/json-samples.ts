const pretty = (value: unknown) => JSON.stringify(value, null, 2);

export const SAMPLE = pretty({
  name: 'A little more local',
  version: '1.0.0',
  private: true,
  description: 'Good tools. No round trips.',
  workspace: { theme: 'moss', autosave: false, indentation: 2 },
  favorites: ['JSON Formatter', 'JSONPath', 'JSON → YAML'],
  madeFor: 'the everyday developer',
  dependencies: null,
});

export const DIFF_SAMPLE = {
  left: pretty({
    name: 'Moss',
    version: '1.0',
    private: true,
    tools: ['Viewer', 'JSONPath'],
    legacy: true,
  }),
  right: pretty({
    name: 'Moss',
    version: '1.1',
    private: true,
    tools: ['Viewer', 'Diff'],
    theme: 'green',
  }),
};

export const YAML_SAMPLE = 'name: Moss\nprivate: true\ntools:\n  - JSON\n  - YAML\n';

export const CSV_SAMPLE = 'name,language\nMoss,JSON\nFern,YAML';

export const JSON_ROWS_SAMPLE =
  '[{"name":"Moss","language":"JSON"},{"name":"Fern","language":"YAML"}]';
