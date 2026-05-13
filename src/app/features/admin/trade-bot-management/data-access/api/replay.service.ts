import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  OverlayRequestDto,
  OverlayResponse,
  ReplayInitDto,
  ReplayInitResponse
} from '../models/replay.model';
import { TradingSystemService } from './trading-system.service';

@Injectable({ providedIn: 'root' })
export class ReplayService {
  constructor(private readonly tradingSystemService: TradingSystemService) {}

  initReplay(payload: ReplayInitDto): Observable<ReplayInitResponse> {
    return this.tradingSystemService.initReplay(payload);
  }

  buildOverlay(payload: OverlayRequestDto): Observable<OverlayResponse> {
    return this.tradingSystemService.buildOverlay(payload);
  }
}
