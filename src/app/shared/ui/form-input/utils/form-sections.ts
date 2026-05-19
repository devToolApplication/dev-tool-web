import {
  ArrayFieldState,
  FieldState,
  FormConfig,
  FormResolvedSection,
  FormSectionConfig,
  GroupFieldState,
  TreeFieldState
} from '../models/form-config.model';

export type FormRenderableField = FieldState | ArrayFieldState | GroupFieldState | TreeFieldState;

export interface FormRenderSection extends FormResolvedSection {
  fields: FormRenderableField[];
}

const GENERAL_SECTION_ID = 'general';
const DETAILS_SECTION_ID = 'details';
const CONFIGURATION_SECTION_ID = 'configuration';

export function buildFormSections(
  config: FormConfig,
  fields: FormRenderableField[],
  options: {
    activeSectionId?: string | null;
    submitted: boolean;
  }
): FormRenderSection[] {
  const visibleFields = fields.filter((field) => field.visible());
  const explicitSections = (config.sections ?? [])
    .filter((section) => !!section.id)
    .map((section, index) => normalizeSection(section, index));

  const sectionMap = new Map<string, FormRenderSection>();

  explicitSections.forEach((section) => {
    sectionMap.set(section.id, {
      ...section,
      fieldCount: 0,
      errorCount: 0,
      warningCount: 0,
      completed: false,
      active: options.activeSectionId === section.id,
      fields: []
    });
  });

  if (explicitSections.length === 0) {
    buildAutoSections(visibleFields).forEach((section) => sectionMap.set(section.id, section));
  }

  visibleFields.forEach((field) => {
    const sectionId = resolveFieldSectionId(field, sectionMap, explicitSections.length === 0);
    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, createGeneratedSection(sectionId, sectionMap.size));
    }
    sectionMap.get(sectionId)?.fields.push(field);
  });

  if (sectionMap.size === 0) {
    sectionMap.set(GENERAL_SECTION_ID, createGeneratedSection(GENERAL_SECTION_ID, 0));
  }

  const sections = Array.from(sectionMap.values())
    .filter((section) => section.fields.length > 0 || explicitSections.some((item) => item.id === section.id))
    .sort((a, b) => a.order - b.order);

  const activeId = options.activeSectionId && sections.some((section) => section.id === options.activeSectionId)
    ? options.activeSectionId
    : sections[0]?.id;

  return sections.map((section) => {
    const sectionFields = flattenFormFields(section.fields);
    const visibleSectionFields = sectionFields.filter((field) => field.visible());
    const counts = countVisibleErrors(visibleSectionFields, options.submitted);

    return {
      ...section,
      fieldCount: visibleSectionFields.length,
      errorCount: counts.errors,
      warningCount: counts.warnings,
      completed:
        visibleSectionFields.length > 0 &&
        visibleSectionFields.every((field) => !field.errors() && field.valid()),
      active: section.id === activeId
    };
  });
}

export function flattenFormFields(fields: FormRenderableField[] | FormRenderableField[][]): FieldState[] {
  return fields.flatMap((field) => {
    if (Array.isArray(field)) {
      return flattenFormFields(field);
    }

    const children = resolveChildren(field);
    return [field, ...children];
  });
}

export function findFirstInvalidField(fields: FormRenderableField[]): FieldState | undefined {
  return flattenFormFields(fields).find((field) => field.visible() && !!field.errors());
}

export function fieldErrorEntries(
  field: FieldState,
  submitted: boolean
): Array<{ key: string; message: string; severity: 'error' | 'warning' }> {
  const errors = field.errors();
  if (!field.visible() || !errors) {
    return [];
  }

  const exposeTouchedErrors = submitted || field.touched();

  return Object.entries(errors)
    .filter(([key]) => exposeTouchedErrors || key.startsWith('api-'))
    .map(([key, message]) => ({
      key,
      message,
      severity: key.startsWith('warning') ? 'warning' : 'error'
    }));
}

function countVisibleErrors(
  fields: FieldState[],
  submitted: boolean
): { errors: number; warnings: number } {
  return fields.reduce(
    (acc, field) => {
      fieldErrorEntries(field, submitted).forEach((entry) => {
        if (entry.severity === 'warning') {
          acc.warnings += 1;
        } else {
          acc.errors += 1;
        }
      });
      return acc;
    },
    { errors: 0, warnings: 0 }
  );
}

function resolveFieldSectionId(
  field: FormRenderableField,
  sectionMap: Map<string, FormRenderSection>,
  useAutoSections: boolean
): string {
  const sectionId = (field.fieldConfig as { sectionId?: string }).sectionId;
  if (sectionId && sectionMap.has(sectionId)) {
    return sectionId;
  }
  if (sectionId && sectionMap.size === 0) {
    return sectionId;
  }
  if (useAutoSections) {
    const autoSectionId = autoSectionIdForField(field);
    if (sectionMap.has(autoSectionId)) {
      return autoSectionId;
    }
  }
  return sectionMap.has(GENERAL_SECTION_ID) || sectionMap.size === 0
    ? GENERAL_SECTION_ID
    : sectionMap.keys().next().value ?? GENERAL_SECTION_ID;
}

function buildAutoSections(fields: FormRenderableField[]): FormRenderSection[] {
  if (fields.length === 0) {
    return [createGeneratedSection(GENERAL_SECTION_ID, 0)];
  }

  const hasDetails = fields.some((field) => field.type === 'textarea');
  const hasConfiguration = fields.some((field) => autoSectionIdForField(field) === CONFIGURATION_SECTION_ID);
  const hasGeneral = fields.some((field) => autoSectionIdForField(field) === GENERAL_SECTION_ID);
  const sections: FormRenderSection[] = [];

  if (hasGeneral || (!hasDetails && !hasConfiguration)) {
    sections.push(createGeneratedSection(GENERAL_SECTION_ID, sections.length));
  }
  if (hasDetails) {
    sections.push({
      ...createGeneratedSection(DETAILS_SECTION_ID, sections.length),
      title: 'shared.form.section.details'
    });
  }
  if (hasConfiguration) {
    sections.push({
      ...createGeneratedSection(CONFIGURATION_SECTION_ID, sections.length),
      title: 'shared.form.section.configuration'
    });
  }

  return sections.length ? sections : [createGeneratedSection(GENERAL_SECTION_ID, 0)];
}

function autoSectionIdForField(field: FormRenderableField): string {
  switch (field.type) {
    case 'textarea':
      return DETAILS_SECTION_ID;
    case 'json':
    case 'code':
    case 'record':
    case 'secret-metadata':
    case 'group':
    case 'array':
    case 'tree':
      return CONFIGURATION_SECTION_ID;
    default:
      return GENERAL_SECTION_ID;
  }
}

function normalizeSection(section: FormSectionConfig, index: number): FormResolvedSection {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    icon: section.icon,
    order: section.order ?? index,
    optional: section.optional ?? false,
    disabled: false,
    collapsible: section.collapsible ?? false,
    collapsed: section.collapsed ?? false,
    fieldCount: 0,
    errorCount: 0,
    warningCount: 0,
    completed: false,
    active: false
  };
}

function createGeneratedSection(id: string, order: number): FormRenderSection {
  const title = id === GENERAL_SECTION_ID ? 'shared.form.section.general' : id;
  return {
    id,
    title,
    order,
    optional: false,
    disabled: false,
    collapsible: false,
    collapsed: false,
    fieldCount: 0,
    errorCount: 0,
    warningCount: 0,
    completed: false,
    active: false,
    fields: []
  };
}

function resolveChildren(field: FormRenderableField): FieldState[] {
  if (!('children' in field)) {
    return [];
  }

  const rawChildren = field.children;
  const children = typeof rawChildren === 'function' ? rawChildren() : rawChildren;
  return flattenFormFields(children as FormRenderableField[] | FormRenderableField[][]);
}
