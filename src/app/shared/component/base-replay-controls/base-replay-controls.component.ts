import { Component, EventEmitter, Input, Output } from '@angular/core';

enum ReplayControlTextKey {
  PrevEvent = 'tradeBot.replay.controls.prevEvent',
  NextEvent = 'tradeBot.replay.controls.nextEvent',
  Speed = 'tradeBot.replay.controls.speed',
  Step = 'tradeBot.replay.controls.step'
}

@Component({
  selector: 'app-base-replay-controls',
  standalone: false,
  template: `
    <div class="flex flex-col gap-3 rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-2">
        <button pButton type="button" icon="pi pi-fast-backward" severity="secondary" text (click)="rewind.emit()"></button>
        <button pButton type="button" icon="pi pi-chevron-left" severity="secondary" text (click)="previousStep.emit()"></button>
        <button
          pButton
          type="button"
          [icon]="playing ? 'pi pi-pause' : 'pi pi-play'"
          (click)="playingChange.emit(!playing)"
        ></button>
        <button pButton type="button" icon="pi pi-chevron-right" severity="secondary" text (click)="nextStep.emit()"></button>
        <button pButton type="button" icon="pi pi-fast-forward" severity="secondary" text (click)="fastForward.emit()"></button>
        <span class="ml-auto text-sm text-surface-500">{{ TEXT.Step | translateContent }} {{ currentStep + 1 }} / {{ totalSteps }}</span>
      </div>

      <p-slider
        [min]="0"
        [max]="sliderMax"
        [step]="1"
        [ngModel]="currentStep"
        (ngModelChange)="seek.emit($event)"
      ></p-slider>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            pButton
            type="button"
            class="p-button-text"
            icon="pi pi-step-backward"
            [label]="TEXT.PrevEvent | translateContent"
            (click)="previousEvent.emit()"
          ></button>
          <button
            pButton
            type="button"
            class="p-button-text"
            icon="pi pi-step-forward"
            [label]="TEXT.NextEvent | translateContent"
            (click)="nextEvent.emit()"
          ></button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-surface-500">{{ TEXT.Speed | translateContent }}</span>
          <p-select
            [options]="speedOptions"
            [ngModel]="speed"
            optionLabel="label"
            optionValue="value"
            (ngModelChange)="speedChange.emit($event)"
            styleClass="w-40"
          ></p-select>
        </div>
      </div>
    </div>
  `
})
export class BaseReplayControlsComponent {
  @Input() currentStep = 0;
  @Input() totalSteps = 0;
  @Input() playing = false;
  @Input() speed = 1;
  @Input() speedOptions: Array<{ label: string; value: number }> = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 }
  ];

  @Output() playingChange = new EventEmitter<boolean>();
  @Output() previousStep = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() fastForward = new EventEmitter<void>();
  @Output() rewind = new EventEmitter<void>();
  @Output() previousEvent = new EventEmitter<void>();
  @Output() nextEvent = new EventEmitter<void>();
  @Output() seek = new EventEmitter<number>();
  @Output() speedChange = new EventEmitter<number>();

  readonly TEXT = ReplayControlTextKey;

  get sliderMax(): number {
    return Math.max(0, this.totalSteps - 1);
  }
}
