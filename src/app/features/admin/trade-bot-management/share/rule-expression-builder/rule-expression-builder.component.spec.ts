import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RuleExpressionBuilderComponent } from './rule-expression-builder.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

describe('RuleExpressionBuilderComponent', () => {
  let fixture: ComponentFixture<RuleExpressionBuilderComponent>;
  let component: RuleExpressionBuilderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RuleExpressionBuilderComponent, TranslateContentPipeStub],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RuleExpressionBuilderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('indicatorConfigs', [
      {
        id: 'indicator-fast',
        code: 'EMA_FAST',
        executor: 'EMA',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      }
    ]);
    fixture.componentRef.setInput('ruleConfigs', [
      {
        id: 'rule-confirm',
        code: 'CONFIRM_VOLUME',
        executor: 'VOLUME',
        executorVersion: 'v1',
        config: {},
        indicators: [],
        childRules: [],
        overlay: {},
        status: 'ACTIVE'
      }
    ]);
    fixture.detectChanges();
  });

  it('creates a single condition from the palette action', () => {
    const emitted: unknown[] = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    component.addCondition();

    expect(component.expression().root).toEqual(
      expect.objectContaining({
        type: 'condition',
        operator: 'CROSSOVER',
        operands: [],
        params: { lookback: 1, tolerance: 0 }
      })
    );
    expect(component.preview()).toBe('? CROSSOVER ?');
    expect(emitted.length).toBe(1);
  });

  it('creates an AND group when a second condition is added', () => {
    component.addCondition();
    component.addCondition();

    expect(component.expression().root).toEqual(expect.objectContaining({ type: 'group', operator: 'AND' }));
    expect(component.preview()).toBe('? CROSSOVER ? AND ? CROSSOVER ?');
  });

  it('adds groups without wrapping the selected node', () => {
    component.addCondition();
    const conditionId = component.selectedNodeId();
    expect(conditionId).toBeTruthy();

    component.addGroup('OR');
    const root = component.expression().root;

    expect(root).toEqual(expect.objectContaining({ type: 'group', operator: 'AND' }));
    expect(root?.type === 'group' ? root.children[0]?.id : null).toBe(conditionId);
    expect(root?.type === 'group' ? root.children[1] : null).toEqual(
      expect.objectContaining({ type: 'group', operator: 'OR' })
    );
  });

  it('adds rule references and emits validation state', () => {
    const validations: boolean[] = [];
    component.validationChange.subscribe((value) => validations.push(value.valid));

    component.addRuleRef();

    expect(component.expression().root).toEqual(expect.objectContaining({ type: 'ruleRef', ruleCode: 'CONFIRM_VOLUME' }));
    expect(component.dependencies().ruleCodes).toEqual(['CONFIRM_VOLUME']);
    expect(validations.at(-1)).toBe(true);
  });
});
