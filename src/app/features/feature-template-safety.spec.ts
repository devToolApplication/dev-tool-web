/// <reference types="vite/client" />

const featureTemplates = import.meta.glob('./**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const sharedComponentSources = import.meta.glob('../shared/component/**/*.ts', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const sharedUiSources = import.meta.glob('../shared/ui/**/*.ts', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const featureTemplateEntries = Object.entries(featureTemplates).filter(([path]) =>
  path.replace(/\\/g, '/').includes('/src/app/features/')
);

const sharedSourceEntries = [
  ...Object.entries(sharedComponentSources),
  ...Object.entries(sharedUiSources)
].filter(([path]) => !path.endsWith('.spec.ts') && !path.endsWith('.stories.ts'));

describe('feature template safety', () => {
  it('does not render raw pre blocks in feature templates', () => {
    const offenders = featureTemplateEntries
      .filter(([, template]) => /<pre(\s|>)/i.test(template))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('keeps feature json viewers collapsed by default', () => {
    const offenders = featureTemplateEntries
      .filter(([, template]) => /<app-json-viewer(?![^>]*\[collapsed\])/i.test(template))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('does not use native business controls in feature templates', () => {
    const offenders = featureTemplateEntries
      .filter(([, template]) => /<(button|input|select|textarea|table|dialog)(\s|>)/i.test(template))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('keeps migrated feature list templates on the shared app-table', () => {
    const migratedListTemplates = featureTemplateEntries
      .filter(([path]) => /\/list\/.*\.html$/.test(path.replace(/\\/g, '/')))
      .filter(([, template]) => /<app-table(\s|>)/i.test(template))
      .map(([path]) => path.replace(/\\/g, '/'));

    expect(
      migratedListTemplates.some((path) => path.endsWith('/admin/job-scheduler/list/job-config-list.component.html'))
    ).toBe(true);
  });

  it('keeps shared component and shared UI sources domain-free', () => {
    const forbiddenImport = /from\s+['"][^'"]*(features|trade-bot|job-scheduler|data-form|ai-agent|file-storage|system-management)/i;
    const offenders = sharedSourceEntries
      .filter(([, source]) => forbiddenImport.test(source))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});
