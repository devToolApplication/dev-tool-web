import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../shared.module';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';
import { ConfirmDialogService } from '../../../overlay/confirm-dialog/confirm-dialog.service';
import { TreeFieldState, TreeFormNode } from '../../models/form-config.model';
import { FieldTreeRendererComponent } from './field-tree-renderer';

describe('FieldTreeRendererComponent', () => {
  let fixture: ComponentFixture<FieldTreeRendererComponent>;
  let component: FieldTreeRendererComponent;
  let confirmDialogService: { confirm: ReturnType<typeof vi.fn> };

  const initialNodes: TreeFormNode[] = [
    {
      id: 'node-1',
      label: 'Alpha',
      code: 'ALPHA',
      value: { code: 'ALPHA' },
      children: [
        {
          id: 'node-1-1',
          label: 'Child',
          code: 'CHILD_VIEW',
          value: { code: 'CHILD' },
          checked: true
        },
        {
          id: 'node-1-2',
          label: 'Update',
          code: 'CHILD_UPDATE',
          value: { code: 'UPDATE' }
        }
      ]
    }
  ];

  beforeEach(async () => {
    confirmDialogService = {
      confirm: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        ...provideSharedTesting(),
        { provide: ConfirmDialogService, useValue: confirmDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldTreeRendererComponent);
    component = fixture.componentInstance;
    component.field = createTreeField(initialNodes);
    fixture.detectChanges();
  });

  it('renders nodes, validation errors and advanced JSON behind a collapsed section', () => {
    expect(fixture.nativeElement.textContent).toContain('Alpha');
    expect(fixture.nativeElement.textContent).toContain('Node has an error');
    expect(fixture.nativeElement.querySelector('app-section-panel')).toBeTruthy();
  });

  it('renders an empty state when tree data is empty', () => {
    component.field = createTreeField([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('adds selected picker nodes without calling business APIs', () => {
    component.openAddPicker();
    component.togglePickerOption(
      {
        id: 'picker-1',
        label: 'Beta',
        value: { code: 'BETA' }
      },
      true
    );

    component.addSelectedOptions();

    expect(component.nodes.map((node) => node.label)).toEqual(['Alpha', 'Beta']);
    expect(component.field.touched()).toBe(true);
  });

  it('does not select disabled picker options', () => {
    const originalTree = JSON.stringify(component.nodes);
    const disabledOption = {
      id: 'picker-disabled',
      label: 'Disabled',
      value: { code: 'DISABLED' },
      disabled: true
    };

    component.openAddPicker();
    component.selectOption(disabledOption);
    component.togglePickerOption(disabledOption, true);
    component.addSelectedOptions();

    expect(JSON.stringify(component.nodes)).toBe(originalTree);
  });

  it('searches by label, code and path while preserving parent context', () => {
    component.setTreeQuery('child_view');

    expect(component.visibleTree.length).toBe(1);
    expect(component.visibleTree[0].node.label).toBe('Alpha');
    expect(component.visibleTree[0].children[0].node.label).toBe('Child');
    expect(component.visibleTree[0].forceExpanded).toBe(true);

    component.setTreeQuery('alpha / child');

    expect(component.visibleTree[0].children[0].matched).toBe(true);
  });

  it('supports selected-only review and tri-state checkbox selection', () => {
    expect(component.selectedItems.map((item) => item.node.id)).toEqual(['node-1-1']);
    expect(component.nodeSelectionState(component.nodes[0]).indeterminate).toBe(true);

    component.removeSelectedItem('node-1-1');

    expect(component.selectedItems).toEqual([]);

    component.toggleNodeSelection(component.nodes[0], true);

    expect(component.selectedItems.map((item) => item.node.id)).toEqual(['node-1', 'node-1-1', 'node-1-2']);
    expect(component.nodeSelectionState(component.nodes[0]).checked).toBe(true);

    component.clearSelection();

    expect(component.selectedItems).toEqual([]);
  });

  it('expands selected branches and applies quick presets', () => {
    component.collapseAll();

    expect(component.isExpanded('node-1')).toBe(false);

    component.expandSelected();

    expect(component.isExpanded('node-1')).toBe(true);

    component.clearSelection();
    component.applySelectionPreset('child-actions');

    expect(component.selectedItems.map((item) => item.node.id)).toEqual(['node-1-1']);
  });

  it('confirms dangerous remove and clear actions before mutating the tree', async () => {
    await component.removeNode('node-1-1');

    expect(confirmDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'shared.tree.confirmRemove', variant: 'danger' })
    );
    expect(component.nodes[0].children?.map((node) => node.id)).toEqual(['node-1-2']);

    await component.clear();

    expect(confirmDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'shared.tree.confirmClear', variant: 'danger' })
    );
    expect(component.nodes).toEqual([]);
  });

  it('replaces, moves and duplicates nodes without dropping existing children by default', () => {
    component.openReplacePicker('node-1');
    component.selectOption({
      id: 'picker-replace',
      label: 'Gamma',
      value: { code: 'GAMMA' }
    });

    expect(component.nodes[0].label).toBe('Gamma');
    expect(component.nodes[0].children?.map((node) => node.id)).toEqual(['node-1-1', 'node-1-2']);

    component.moveNode('node-1-2', -1);

    expect(component.nodes[0].children?.map((node) => node.id)).toEqual(['node-1-2', 'node-1-1']);
    expect(component.canMove('node-1-2', -1)).toBe(false);

    component.duplicateNode('node-1-2');

    const children = component.nodes[0].children ?? [];
    expect(children.map((node) => node.label)).toEqual(['Update', 'Update', 'Child']);
    expect(children[1].id).not.toBe(children[0].id);
  });

  it('does not mutate tree data when readonly or destructive actions are disabled', async () => {
    const originalTree = JSON.stringify(component.nodes);
    component.readonlyMode = true;

    component.openAddPicker();
    component.selectOption({
      id: 'picker-1',
      label: 'Beta',
      value: { code: 'BETA' }
    });
    await component.removeNode('node-1-1');
    await component.clear();
    component.onAdvancedJsonChange('[{"id":"node-json","label":"From JSON","value":{"code":"JSON"}}]');
    component.applyAdvancedJson();

    expect(JSON.stringify(component.nodes)).toBe(originalTree);
    expect(component.pickerOpen).toBe(false);
    expect(confirmDialogService.confirm).not.toHaveBeenCalled();

    component.readonlyMode = false;
    component.field.fieldConfig.treeConfig!.allowRemoveNode = false;

    await component.removeNode('node-1-1');

    expect(JSON.stringify(component.nodes)).toBe(originalTree);
    expect(confirmDialogService.confirm).not.toHaveBeenCalled();
  });

  it('validates editable advanced JSON before applying it', () => {
    component.onAdvancedJsonChange('[{"id":"node-json","label":"From JSON","value":{"code":"JSON"}}]');
    component.applyAdvancedJson();

    expect(component.nodes[0]).toMatchObject({
      id: 'node-json',
      label: 'From JSON',
      value: { code: 'JSON' },
      children: [],
      checked: false,
      disabled: false,
      readonly: false
    });
    expect(component.advancedJsonError()).toBeNull();

    component.onAdvancedJsonChange('{"not":"array"}');
    component.applyAdvancedJson();

    expect(component.advancedJsonError()).toBe('shared.tree.invalidJsonArray');
    expect(component.nodes.map((node) => node.id)).toEqual(['node-json']);

    component.onAdvancedJsonChange('not json');
    component.applyAdvancedJson();

    expect(component.advancedJsonError()).toBe('shared.json.invalid');
    expect(component.nodes.map((node) => node.id)).toEqual(['node-json']);
  });

  function createTreeField(nodes: TreeFormNode[]): TreeFieldState {
    const value = signal<TreeFormNode[]>(nodes);
    const touched = signal(false);
    const dirty = signal(false);

    return {
      type: 'tree',
      name: 'tree',
      label: 'Tree',
      path: 'tree',
      fieldConfig: {
        type: 'tree',
        name: 'tree',
        label: 'Tree',
        treeConfig: {
          selectionMode: 'checkbox',
          selectStrategy: 'parentAndChildren',
          searchable: true,
          showSelectedPanel: true,
          showFilterTabs: true,
          showToolbar: true,
          showPath: true,
          showBadges: true,
          showCounts: true,
          selectionPresets: [
            {
              id: 'child-actions',
              label: 'Child actions',
              match: { codeIncludes: ['view'], leafOnly: true }
            }
          ],
          allowAddNode: true,
          allowRemoveNode: true,
          allowReplaceNode: true,
          allowMoveNode: true,
          picker: {
            enabled: true,
            multiSelect: true
          },
          advancedJson: {
            enabled: true,
            editable: true,
            collapsedByDefault: true
          }
        },
        pickerOptions: [
          {
            id: 'picker-1',
            label: 'Beta',
            value: { code: 'BETA' }
          }
        ]
      },
      children: [],
      width: 'full',
      value,
      setValue: (next: TreeFormNode[]) => {
        value.set(next);
        dirty.set(true);
      },
      touched,
      focusing: signal(false),
      blurred: signal(false),
      dirty,
      externalErrors: signal(null),
      visible: signal(true),
      disabled: signal(false),
      required: signal(false),
      options: signal([]),
      errors: signal({ 'node:node-1:error-0': 'Node has an error' }),
      valid: signal(false),
      markAsTouched: () => touched.set(true),
      markAsFocused: () => undefined,
      markAsBlurred: () => undefined
    };
  }
});
