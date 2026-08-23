import { SHARED_INTERNAL_UI_COMPONENTS, SHARED_UI_COMPONENTS } from './shared.module';
import { FieldArrayRenderer } from './ui/patterns/form-input/component/field-array-renderer/field-array-renderer';
import { FieldGroupRenderer } from './ui/patterns/form-input/component/field-group-renderer/field-group-renderer';
import { FieldRecordRenderer } from './ui/patterns/form-input/component/field-record-renderer/field-record-renderer';
import { FieldRenderer } from './ui/patterns/form-input/component/field-renderer/field-renderer';
import { FieldTreeRendererComponent } from './ui/patterns/form-input/component/field-tree-renderer/field-tree-renderer';
import { TableCellComponent } from './ui/patterns/table/component/table/table-cell/table-cell';
import { TableFilterComponent } from './ui/patterns/table/component/table/table-filter/table-filter';

describe('SharedModule public API', () => {
  it('declares implementation renderers without exporting them through SharedModule', () => {
    const internalOnly = [
      FieldRenderer,
      FieldArrayRenderer,
      FieldGroupRenderer,
      FieldRecordRenderer,
      FieldTreeRendererComponent,
      TableCellComponent,
      TableFilterComponent,
    ];

    expect(SHARED_INTERNAL_UI_COMPONENTS).toEqual(expect.arrayContaining(internalOnly));
    for (const component of internalOnly) {
      expect(SHARED_UI_COMPONENTS).not.toContain(component);
    }
  });
});
