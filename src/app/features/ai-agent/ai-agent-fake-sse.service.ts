import { Injectable } from '@angular/core';
import { Observable, of, concat, timer } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AgentEvent, AgentRunRequest, AgentRunResponse } from './ai-agent.models';

@Injectable({ providedIn: 'root' })
export class AiAgentFakeSseService {
  startJob(_: AgentRunRequest): Observable<AgentRunResponse> {
    return of({ jobId: `job_${Date.now()}` }).pipe(delay(300));
  }

  stream(jobId: string): Observable<AgentEvent> {
    const seed = Date.now();
    const scenario: AgentEvent[] = [
      {
        type: 'thinking',
        stepId: 'step_1',
        timestamp: seed + 100
      },
      {
        type: 'tool_call',
        stepId: 'step_1',
        timestamp: seed + 700,
        tool: 'crawl_site',
        args: { url: 'https://status.internal.local', depth: 2 }
      },
      {
        type: 'tool_result',
        stepId: 'step_1',
        timestamp: seed + 1300,
        tool: 'crawl_site',
        data: { services: 12, degraded: 1, incidents: ['queue-lag'] }
      },
      {
        type: 'thinking',
        stepId: 'step_2',
        timestamp: seed + 1800
      },
      {
        type: 'tool_call',
        stepId: 'step_2',
        timestamp: seed + 2400,
        tool: 'query_metrics',
        args: { range: '24h', metrics: ['latency', 'error_rate'] }
      },
      {
        type: 'tool_result',
        stepId: 'step_2',
        timestamp: seed + 2900,
        tool: 'query_metrics',
        data: { p95Latency: '215ms', errorRate: '0.8%', trend: 'stable' }
      },
      {
        type: 'text_chunk',
        timestamp: seed + 3300,
        content: 'Tổng quan hệ thống hôm nay: '
      },
      {
        type: 'text_chunk',
        timestamp: seed + 3600,
        content: 'đa số dịch vụ ổn định, '
      },
      {
        type: 'text_chunk',
        timestamp: seed + 3900,
        content: 'có 1 thành phần queue đang tăng độ trễ. '
      },
      {
        type: 'text_chunk',
        timestamp: seed + 4300,
        content: 'Khuyến nghị theo dõi thêm trong 30 phút tới.'
      },
      {
        type: 'done',
        timestamp: seed + 4600
      }
    ];

    return concat(
      ...scenario.map((event, index) =>
        timer(index * 420).pipe(
          map(() => ({
            ...event,
            message: event.type === 'error' ? `Stream error for ${jobId}` : event.message
          }))
        )
      )
    );
  }
}
