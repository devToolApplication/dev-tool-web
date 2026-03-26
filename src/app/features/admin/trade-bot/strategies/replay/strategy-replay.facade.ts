import { Injectable, computed, signal } from '@angular/core';
import { StrategyReplayEventType, ReplayStepEvent, ReplayTradeTimelineItem, StrategyReplayPayload } from '../../../../../core/models/trade-bot/strategy-replay.model';

const STEP_JUMP = 5;

@Injectable()
export class StrategyReplayFacade {
  readonly payload = signal<StrategyReplayPayload | null>(null);
  readonly currentStepIndex = signal(0);
  readonly playing = signal(false);
  readonly speed = signal(1);
  readonly autoPauseEnabled = signal(true);
  readonly autoPauseEventTypes = signal<StrategyReplayEventType[]>(['setup-formed', 'order-placed', 'tp-hit', 'sl-hit', 'trade-closed']);
  readonly selectedTradeId = signal<string | null>(null);
  readonly selectedEventId = signal<string | null>(null);
  readonly eventTypeFilters = signal<StrategyReplayEventType[]>([]);

  readonly steps = computed(() => this.payload()?.steps ?? []);
  readonly events = computed(() => this.payload()?.events ?? []);
  readonly trades = computed(() => this.payload()?.trades ?? []);
  readonly overlays = computed(() => this.payload()?.overlays ?? []);
  readonly currentStep = computed(() => this.steps()[this.currentStepIndex()] ?? null);
  readonly currentStepEvents = computed(() => {
    const step = this.currentStep();
    if (!step) {
      return [];
    }
    return this.events().filter((event) => event.stepIndex === step.index);
  });
  readonly filteredEvents = computed(() => {
    const filters = this.eventTypeFilters();
    if (filters.length === 0) {
      return this.events();
    }
    return this.events().filter((event) => filters.includes(event.type));
  });
  readonly activeTrade = computed(() => {
    const selectedTradeId = this.selectedTradeId();
    if (selectedTradeId) {
      return this.trades().find((trade) => trade.id === selectedTradeId) ?? null;
    }
    const currentStep = this.currentStep();
    if (!currentStep) {
      return null;
    }
    return this.trades().find((trade) => currentStep.activeTradeIds.includes(trade.id)) ?? null;
  });
  readonly activeOverlaySlice = computed(() => {
    const stepIndex = this.currentStepIndex();
    return this.overlays().filter(
      (overlay) => stepIndex >= overlay.visibleFromStepIndex && stepIndex <= (overlay.visibleToStepIndex ?? Number.MAX_SAFE_INTEGER)
    );
  });

  private timerId: number | null = null;

  setPayload(payload: StrategyReplayPayload): void {
    this.stop();
    this.payload.set(payload);
    this.currentStepIndex.set(0);
    this.selectedTradeId.set(null);
    this.selectedEventId.set(null);
  }

  setPlaying(playing: boolean): void {
    this.playing.set(playing);
    if (playing) {
      this.startTimer();
      return;
    }
    this.stopTimer();
  }

  toggleAutoPauseEvent(type: StrategyReplayEventType): void {
    const current = this.autoPauseEventTypes();
    if (current.includes(type)) {
      this.autoPauseEventTypes.set(current.filter((item) => item !== type));
      return;
    }
    this.autoPauseEventTypes.set([...current, type]);
  }

  setEventFilters(filters: StrategyReplayEventType[]): void {
    this.eventTypeFilters.set(filters);
  }

  setSpeed(speed: number): void {
    this.speed.set(speed);
    if (this.playing()) {
      this.startTimer();
    }
  }

  seek(stepIndex: number): void {
    const total = this.steps().length;
    if (total === 0) {
      this.currentStepIndex.set(0);
      return;
    }
    this.currentStepIndex.set(Math.max(0, Math.min(total - 1, stepIndex)));
    this.syncSelectionWithCurrentStep();
  }

  nextStep(): void {
    const total = this.steps().length;
    if (total === 0) {
      return;
    }

    const nextIndex = Math.min(total - 1, this.currentStepIndex() + 1);
    this.currentStepIndex.set(nextIndex);
    this.syncSelectionWithCurrentStep();

    if (nextIndex >= total - 1) {
      this.stop();
      return;
    }

    if (this.autoPauseEnabled() && this.currentStepEvents().some((event) => this.autoPauseEventTypes().includes(event.type))) {
      this.setPlaying(false);
    }
  }

  previousStep(): void {
    this.seek(this.currentStepIndex() - 1);
  }

  fastForward(): void {
    this.seek(this.currentStepIndex() + STEP_JUMP);
  }

  rewind(): void {
    this.seek(this.currentStepIndex() - STEP_JUMP);
  }

  nextEvent(): void {
    const event = this.filteredEvents().find((item) => item.stepIndex > this.currentStepIndex());
    if (event) {
      this.jumpToEvent(event.id);
    }
  }

  previousEvent(): void {
    const events = [...this.filteredEvents()].reverse();
    const event = events.find((item) => item.stepIndex < this.currentStepIndex());
    if (event) {
      this.jumpToEvent(event.id);
    }
  }

  jumpToEvent(eventId: string): void {
    const event = this.events().find((item) => item.id === eventId);
    if (!event) {
      return;
    }
    this.selectedEventId.set(event.id);
    if (event.tradeId) {
      this.selectedTradeId.set(event.tradeId);
    }
    this.seek(event.stepIndex);
  }

  jumpToTrade(tradeId: string): void {
    const trade = this.trades().find((item) => item.id === tradeId);
    if (!trade) {
      return;
    }
    this.selectedTradeId.set(trade.id);
    this.seek(trade.activeFromStepIndex);
  }

  stop(): void {
    this.setPlaying(false);
  }

  destroy(): void {
    this.stopTimer();
  }

  private syncSelectionWithCurrentStep(): void {
    const currentTrade = this.activeTrade();
    if (currentTrade) {
      this.selectedTradeId.set(currentTrade.id);
    }

    const currentStepEvents = this.currentStepEvents();
    if (currentStepEvents.length > 0) {
      this.selectedEventId.set(currentStepEvents[0].id);
    }
  }

  private startTimer(): void {
    this.stopTimer();
    const interval = Math.max(180, Math.round(900 / Math.max(this.speed(), 0.25)));
    this.timerId = window.setInterval(() => this.nextStep(), interval);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
