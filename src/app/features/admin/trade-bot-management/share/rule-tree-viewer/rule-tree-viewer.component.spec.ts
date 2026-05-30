import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleTreeViewerComponent } from './rule-tree-viewer.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

@Component({ selector: 'app-tag', standalone: false, template: '' })
class TagStubComponent {
  @Input() value?: string;
  @Input() severity?: string | null;
}

@Component({ selector: 'app-button', standalone: false, template: '' })
class ButtonStubComponent {
  @Input() icon?: string;
  @Input() label?: string;
  @Input() severity?: string | null;
  @Input() disabled = false;
  @Input() text = false;
  @Input() tooltip?: string;
  @Input() ariaLabel?: string;
  @Input() styleClass?: string;
  @Output() readonly buttonClick = new EventEmitter<void>();
}

@Component({ selector: 'app-input-text', standalone: false, template: '' })
class InputTextStubComponent {
  @Input() inputId?: string;
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() iconClass?: string;
  @Input() value?: string;
  @Output() readonly valueChange = new EventEmitter<string | null>();
}

@Component({ selector: 'app-select-button', standalone: false, template: '' })
class SelectButtonStubComponent {
  @Input() label?: string;
  @Input() options: unknown[] = [];
  @Input() value?: unknown;
  @Input() allowEmpty = true;
  @Output() readonly valueChange = new EventEmitter<unknown>();
}

const trace = {
  ruleCode: 'ROOT_ENTRY',
  operator: 'AND',
  passed: false,
  children: [
    { ruleCode: 'PASS_CHILD', operator: 'GT', passed: true, value: 101.25, message: 'EMA accepted' },
    {
      ruleCode: 'FAIL_GROUP',
      operator: 'AND',
      passed: false,
      reason: 'Momentum blocked',
      children: [
        { ruleCode: 'FAIL_LEAF', operator: 'LT', passed: false, reason: 'RSI too high' },
        { ruleCode: 'UNKNOWN_LEAF', operator: 'GTE', result: 'UNKNOWN', message: 'Volume missing' }
      ]
    }
  ]
};

describe('RuleTreeViewerComponent', () => {
  let fixture: ComponentFixture<RuleTreeViewerComponent>;
  let component: RuleTreeViewerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        RuleTreeViewerComponent,
        TagStubComponent,
        ButtonStubComponent,
        InputTextStubComponent,
        SelectButtonStubComponent,
        TranslateContentPipeStub
      ],
      imports: [CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RuleTreeViewerComponent);
    component = fixture.componentInstance;
  });

  it('summarizes and keeps failed paths readable by default', () => {
    fixture.componentRef.setInput('trace', trace);
    fixture.detectChanges();

    expect(component.summary()).toEqual({ total: 5, passed: 1, failed: 3, unknown: 1, maxDepth: 3 });
    expect(component.visibleRows().map((row) => row.code)).toEqual([
      'ROOT_ENTRY',
      'PASS_CHILD',
      'FAIL_GROUP',
      'FAIL_LEAF',
      'UNKNOWN_LEAF'
    ]);
  });

  it('filters failed rules with ancestor context', () => {
    fixture.componentRef.setInput('trace', trace);
    fixture.detectChanges();

    component.updateStatusFilter('failed');

    expect(component.visibleRows().map((row) => row.code)).toEqual(['ROOT_ENTRY', 'FAIL_GROUP', 'FAIL_LEAF']);
  });

  it('searches by reason and preserves the matching branch context', () => {
    fixture.componentRef.setInput('trace', trace);
    fixture.detectChanges();

    component.updateQuery('volume');

    expect(component.visibleRows().map((row) => row.code)).toEqual(['ROOT_ENTRY', 'FAIL_GROUP', 'UNKNOWN_LEAF']);
  });

  it('exposes trace value as secondary searchable metadata', () => {
    fixture.componentRef.setInput('trace', trace);
    fixture.detectChanges();

    component.updateQuery('101.25');

    expect(component.visibleRows().map((row) => row.code)).toEqual(['ROOT_ENTRY', 'PASS_CHILD']);
    expect(component.visibleRows().find((row) => row.code === 'PASS_CHILD')?.value).toBe('101.25');
  });

  it('collapses and expands the whole tree', () => {
    fixture.componentRef.setInput('trace', trace);
    fixture.detectChanges();

    component.collapseAll();
    expect(component.visibleRows().map((row) => row.code)).toEqual(['ROOT_ENTRY']);

    component.expandAll();
    expect(component.visibleRows().map((row) => row.code)).toEqual([
      'ROOT_ENTRY',
      'PASS_CHILD',
      'FAIL_GROUP',
      'FAIL_LEAF',
      'UNKNOWN_LEAF'
    ]);
  });
});
