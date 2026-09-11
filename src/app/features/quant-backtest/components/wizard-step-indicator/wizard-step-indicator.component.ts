import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface WizardStep {
  step: number;
  labelKey: string;
  descriptionKey?: string;
}

@Component({
  selector: 'app-wizard-step-indicator',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wizard-step-indicator.component.html',
  styleUrl: './wizard-step-indicator.component.css',
})
export class WizardStepIndicatorComponent {
  @Input() currentStep = 1;
  @Input() maxVisitedStep = 1;
  @Input() ariaLabelKey = 'quantBacktest.create.wizardNav';

  @Output() stepSelect = new EventEmitter<number>();

  readonly steps: WizardStep[] = [
    { step: 1, labelKey: 'quantBacktest.create.step1' },
    { step: 2, labelKey: 'quantBacktest.create.step2' },
    { step: 3, labelKey: 'quantBacktest.create.step3' },
    { step: 4, labelKey: 'quantBacktest.create.step4' },
  ];

  // ponytail: stepper uses visited tab index; upgrade to roving arrow-key manager when sub-steps are added.
  isStepFocusable(step: number): boolean {
    return step <= this.maxVisitedStep;
  }

  isStepClickable(step: number): boolean {
    return step <= this.maxVisitedStep && step !== this.currentStep;
  }

  onStepClick(step: number): void {
    if (this.isStepClickable(step)) {
      this.stepSelect.emit(step);
    }
  }

  onStepKeydown(event: KeyboardEvent, step: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (this.isStepClickable(step)) {
        event.preventDefault();
        this.stepSelect.emit(step);
      }
    }
  }
}
