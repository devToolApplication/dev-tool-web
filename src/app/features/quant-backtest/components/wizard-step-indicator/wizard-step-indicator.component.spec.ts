import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WizardStepIndicatorComponent } from './wizard-step-indicator.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): string {
    return String(value ?? '');
  }
}

describe('WizardStepIndicatorComponent', () => {
  let component: WizardStepIndicatorComponent;
  let fixture: ComponentFixture<WizardStepIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WizardStepIndicatorComponent, TranslateContentPipeStub],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardStepIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('creates the component and renders 4 steps', () => {
    expect(component).toBeTruthy();
    expect(component.steps.length).toBe(4);
  });

  it('determines if step is clickable based on maxVisitedStep and currentStep', () => {
    component.currentStep = 3;
    component.maxVisitedStep = 3;

    expect(component.isStepClickable(1)).toBe(true);
    expect(component.isStepClickable(2)).toBe(true);
    expect(component.isStepClickable(3)).toBe(false); // Current step
    expect(component.isStepClickable(4)).toBe(false); // Unvisited
  });

  it('emits stepSelect when a valid step is clicked', () => {
    component.currentStep = 2;
    component.maxVisitedStep = 2;

    const emitSpy = vi.spyOn(component.stepSelect, 'emit');
    component.onStepClick(1);
    expect(emitSpy).toHaveBeenCalledWith(1);

    emitSpy.mockClear();
    component.onStepClick(4); // Not clickable
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('renders accessible nav label with i18n key and allows custom key', () => {
    fixture.detectChanges();
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('quantBacktest.create.wizardNav');

    fixture.componentRef.setInput('ariaLabelKey', 'quantBacktest.create.title');
    fixture.detectChanges();
    expect(nav.getAttribute('aria-label')).toBe('quantBacktest.create.title');
  });

  it('sets accessible aria and tabindex focus semantics on step buttons', () => {
    component.currentStep = 2;
    component.maxVisitedStep = 2;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      'button.wizard-step__btn',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(4);

    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[0].getAttribute('aria-current')).toBeNull();
    expect(buttons[0].getAttribute('aria-disabled')).toBeNull();

    expect(buttons[1].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('aria-current')).toBe('step');
    expect(buttons[1].getAttribute('aria-disabled')).toBe('true');

    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
    expect(buttons[2].getAttribute('aria-current')).toBeNull();
    expect(buttons[2].getAttribute('aria-disabled')).toBe('true');
  });

  it('emits stepSelect on accessible keydown Enter/Space for visited steps only', () => {
    component.currentStep = 2;
    component.maxVisitedStep = 2;
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.stepSelect, 'emit');

    component.onStepKeydown(new KeyboardEvent('keydown', { key: 'Enter' }), 1);
    expect(emitSpy).toHaveBeenCalledWith(1);

    emitSpy.mockClear();
    component.onStepKeydown(new KeyboardEvent('keydown', { key: ' ' }), 2);
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
