/// <reference types="vite/client" />

import { FieldConfig, FormConfig } from '../shared/ui/form-input/models/form-config.model';
import { UploadStorageFormComponent } from './admin/file-storage-management/storage-repository/form/upload-storage-form.component';
import { JobConfigFormComponent } from './admin/job-scheduler/form/job-config-form.component';
import { AiAgentConfigFormComponent } from './admin/system-management/general-config/ai-agent-system/form/ai-agent-config-form.component';
import { StorageConfigFormComponent } from './admin/system-management/general-config/storage-system/form/storage-config-form.component';
import { TradeBotConfigFormComponent } from './admin/system-management/general-config/trade-bot-system/form/trade-bot-config-form.component';
import { AiAgentSecretFormComponent } from './admin/system-management/secret-management/ai-agent-system/form/ai-agent-secret-form.component';
import { StorageSecretFormComponent } from './admin/system-management/secret-management/storage-system/form/storage-secret-form.component';
import { TradeBotSecretFormComponent } from './admin/system-management/secret-management/trade-bot-system/form/trade-bot-secret-form.component';
import { CacheMonitorComponent } from './admin/trade-bot-management/pages/monitoring/cache-monitor.component';

const featureRouteSources = import.meta.glob('./admin/**/*.feature.ts', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const featureFormSources = import.meta.glob('./admin/**/form/*.component.ts', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

const featureFormTemplates = import.meta.glob('./admin/**/form/*.component.html', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

describe('feature form standard', () => {
  it('protects feature create and edit form routes with the unsaved changes guard', () => {
    const offenders = Object.entries(featureRouteSources).flatMap(([path, source]) =>
      findFormRouteObjects(source)
        .filter((routeObject) => !/canDeactivate\s*:\s*\[\s*unsavedChangesGuard\s*\]/.test(routeObject))
        .map(() => path)
    );

    expect(offenders).toEqual([]);
  });

  it('exposes BaseCrudPage dirty state for every feature edit form shell', () => {
    const offenders = baseCrudFormEntries()
      .filter(([, source]) =>
        !/@ViewChild\(BaseCrudPageComponent\)/.test(source) ||
        !/hasUnsavedChanges\(\)\s*:\s*boolean/.test(source) ||
        !/confirmDiscardChanges\(\)\s*:\s*Promise<boolean>\s*\|\s*boolean/.test(source)
      )
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('marks the standard form pristine before navigating after a successful save', () => {
    const offenders = baseCrudFormEntries()
      .filter(([, source]) => /router\.navigate/.test(source))
      .filter(([, source]) => !/markFormPristine\(\)/.test(source))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('keeps standard form loading state in signals instead of mutable booleans', () => {
    const offenders = baseCrudFormEntries()
      .filter(([path, source]) => {
        const templatePath = path.replace(/\.ts$/, '.html');
        const template = featureFormTemplates[templatePath] ?? '';

        return (
          /\bloading\s*=\s*false\b/.test(source) ||
          /this\.loading\s*=\s*(true|false)/.test(source) ||
          /loading:\s*this\.loading(?!\()/.test(source) ||
          /\[submitting\]="loading"/.test(template) ||
          /loading:\s*loading(?!\()/.test(template)
        );
      })
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('cleans up route param subscriptions in standard form shells', () => {
    const offenders = baseCrudFormEntries()
      .filter(([, source]) => /route\.paramMap/.test(source))
      .filter(([, source]) => !/route\.paramMap\.pipe\(takeUntilDestroyed\(this\.destroyRef\)\)/.test(source))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('uses translation keys for standard form labels, titles, and descriptions', () => {
    const offenders = baseCrudFormEntries()
      .filter(([path, source]) => {
        const templatePath = path.replace(/\.ts$/, '.html');
        const template = featureFormTemplates[templatePath] ?? '';
        return hasHardCodedDisplayLiteral(source) || hasHardCodedDisplayLiteral(template);
      })
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('uses option-backed autocomplete for fields that can be derived from existing data', () => {
    const requiredFieldsByPath: Record<string, { formConfig: FormConfig; fields: string[] }> = {
      './admin/job-scheduler/form/job-config-form.component.ts': {
        formConfig: formConfigOf(JobConfigFormComponent, 7),
        fields: [
          'cron',
          'timezone',
          'url',
          'basic.username',
          'apiKey.headerName',
          'keycloak.baseUrl',
          'keycloak.realm',
          'keycloak.clientId',
          'keycloak.scope',
          'keycloak.tokenField',
          'keycloak.headerName',
          'keycloak.headerPrefix'
        ]
      },
      './admin/file-storage-management/storage-repository/form/upload-storage-form.component.ts': {
        formConfig: formConfigOf(UploadStorageFormComponent, 7),
        fields: ['apiDomain', 'apiPath']
      },
      './admin/trade-bot-management/pages/monitoring/cache-monitor.component.ts': {
        formConfig: formConfigPropertyOf(CacheMonitorComponent, 5, 'evictForm'),
        fields: ['cacheName']
      },
      './admin/system-management/general-config/ai-agent-system/form/ai-agent-config-form.component.ts': {
        formConfig: formConfigOf(AiAgentConfigFormComponent, 9),
        fields: ['category', 'key', 'configGroup', 'scopeRef']
      },
      './admin/system-management/general-config/storage-system/form/storage-config-form.component.ts': {
        formConfig: formConfigOf(StorageConfigFormComponent, 7),
        fields: ['category', 'key']
      },
      './admin/system-management/general-config/trade-bot-system/form/trade-bot-config-form.component.ts': {
        formConfig: formConfigOf(TradeBotConfigFormComponent, 7),
        fields: ['category', 'key']
      },
      './admin/system-management/secret-management/ai-agent-system/form/ai-agent-secret-form.component.ts': {
        formConfig: formConfigOf(AiAgentSecretFormComponent, 7),
        fields: ['category']
      },
      './admin/system-management/secret-management/storage-system/form/storage-secret-form.component.ts': {
        formConfig: formConfigOf(StorageSecretFormComponent, 7),
        fields: ['category']
      },
      './admin/system-management/secret-management/trade-bot-system/form/trade-bot-secret-form.component.ts': {
        formConfig: formConfigOf(TradeBotSecretFormComponent, 7),
        fields: ['category']
      }
    };

    const offenders = Object.entries(requiredFieldsByPath).flatMap(([path, config]) =>
      config.fields
        .filter((fieldName) => !isOptionBackedAutocompleteField(config.formConfig, fieldName))
        .map((fieldName) => `${path}:${fieldName}`)
    );

    expect(offenders).toEqual([]);
  });
});

function baseCrudFormEntries(): Array<[string, string]> {
  return Object.entries(featureFormSources).filter(([path]) => {
    const templatePath = path.replace(/\.ts$/, '.html');
    return /<app-base-crud-page(\s|>)/.test(featureFormTemplates[templatePath] ?? '');
  });
}

function findFormRouteObjects(source: string): string[] {
  const matches = source.match(/\{[^{}]*path:\s*['"](?:create|edit\/[^'"]*)['"][^{}]*component:\s*\w+FormComponent[^{}]*\}/gs);
  return matches ?? [];
}

function hasHardCodedDisplayLiteral(source: string): boolean {
  return /(?:label|title|description)\s*:\s*['"][^'".]*\s+[^'"]*['"]/.test(source);
}

function isOptionBackedAutocompleteField(formConfig: FormConfig, fieldName: string): boolean {
  const field = findFieldConfig(formConfig.fields, fieldName);
  return !!field && field.type === 'auto-complete' && 'optionsExpression' in field && !!field.optionsExpression;
}

function findFieldConfig(fields: FieldConfig[], fieldName: string): FieldConfig | undefined {
  for (const field of fields) {
    if (field.name === fieldName) {
      return field;
    }
    if (field.type === 'group') {
      const child = findFieldConfig(field.children, fieldName);
      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

function stubDeps(count: number): any[] {
  return Array.from({ length: count }, () => ({} as any));
}

function formConfigOf<TComponent extends { formConfig: FormConfig }>(
  componentType: new (...args: any[]) => TComponent,
  dependencyCount: number
): FormConfig {
  return new componentType(...stubDeps(dependencyCount)).formConfig;
}

function formConfigPropertyOf<TComponent>(
  componentType: new (...args: any[]) => TComponent,
  dependencyCount: number,
  propertyName: keyof TComponent
): FormConfig {
  return new componentType(...stubDeps(dependencyCount))[propertyName] as FormConfig;
}
