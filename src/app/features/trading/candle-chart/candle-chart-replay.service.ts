import { Injectable } from '@angular/core';

import type { CandleChartStatus, ReplayConfig } from './candle-chart.models';

export interface CandleChartReplayStep {
  index: number;
  status: CandleChartStatus;
}

@Injectable()
export class CandleChartReplayService {
  private timerId: number | null = null;

  play(
    currentIndex: number,
    length: number,
    config: ReplayConfig | null | undefined,
    onStep: (step: CandleChartReplayStep) => void,
  ): void {
    this.pause();
    if (length <= 0) {
      onStep({ index: 0, status: 'IDLE' });
      return;
    }

    onStep({ index: currentIndex, status: 'PLAYING' });
    this.timerId = window.setInterval(() => {
      const nextIndex = this.resolveNextIndex(currentIndex, length, config);
      currentIndex = nextIndex.index;
      onStep(nextIndex);
      if (nextIndex.status === 'ENDED') {
        this.pause();
      }
    }, Math.max(50, Number(config?.speedMs ?? 650)));
  }

  pause(): void {
    if (this.timerId != null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  first(length: number): CandleChartReplayStep {
    return { index: 0, status: length > 0 ? 'PAUSED' : 'IDLE' };
  }

  previous(currentIndex: number, length: number): CandleChartReplayStep {
    return { index: Math.max(0, currentIndex - 1), status: length > 0 ? 'PAUSED' : 'IDLE' };
  }

  next(currentIndex: number, length: number, config: ReplayConfig | null | undefined): CandleChartReplayStep {
    return this.resolveNextIndex(currentIndex, length, config, true);
  }

  last(length: number): CandleChartReplayStep {
    return { index: Math.max(0, length - 1), status: length > 0 ? 'ENDED' : 'IDLE' };
  }

  seek(index: number, length: number): CandleChartReplayStep {
    if (length <= 0) {
      return { index: 0, status: 'IDLE' };
    }
    return {
      index: Math.min(Math.max(Math.trunc(index), 0), length - 1),
      status: 'PAUSED',
    };
  }

  private resolveNextIndex(
    currentIndex: number,
    length: number,
    config: ReplayConfig | null | undefined,
    manual = false,
  ): CandleChartReplayStep {
    if (length <= 0) {
      return { index: 0, status: 'IDLE' };
    }
    if (currentIndex >= length - 1) {
      if (config?.loop) {
        return { index: 0, status: manual ? 'PAUSED' : 'PLAYING' };
      }
      return { index: length - 1, status: 'ENDED' };
    }
    return { index: currentIndex + 1, status: manual ? 'PAUSED' : 'PLAYING' };
  }
}
