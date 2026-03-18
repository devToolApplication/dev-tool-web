import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AgentEvent, AgentStep } from './ai-agent.models';
import { AiAgentFakeSseService } from './ai-agent-fake-sse.service';

@Component({
  selector: 'app-ai-agent',
  standalone: false,
  templateUrl: './ai-agent.component.html',
  styleUrl: './ai-agent.component.css'
})
export class AiAgentComponent implements OnDestroy {
  @ViewChild('timelineContainer') timelineContainer?: ElementRef<HTMLDivElement>;

  prompt = '';
  loading = false;
  finalText = '';
  steps: AgentStep[] = [];
  streamStatus: 'idle' | 'running' | 'done' = 'idle';

  private streamSub?: Subscription;
  private lastPrompt = '';

  constructor(private readonly fakeSseService: AiAgentFakeSseService) {}

  run(): void {
    const userInput = this.prompt.trim();
    if (!userInput || this.loading) {
      return;
    }

    this.lastPrompt = userInput;
    this.resetForRun();

    this.fakeSseService.startJob({
      input: userInput,
      context: {
        userId: 'demo-user',
        sessionId: `sess_${Date.now()}`
      }
    }).subscribe((res) => {
      this.streamSub = this.fakeSseService.stream(res.jobId).subscribe({
        next: (event) => this.onEvent(event),
        complete: () => {
          this.loading = false;
          this.streamStatus = 'done';
        }
      });
    });
  }

  retry(): void {
    if (!this.lastPrompt || this.loading) {
      return;
    }

    this.prompt = this.lastPrompt;
    this.run();
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }

  private onEvent(event: AgentEvent): void {
    if (event.type === 'text_chunk' && event.content) {
      this.finalText += event.content;
    }

    if (event.type === 'done') {
      this.loading = false;
      this.streamStatus = 'done';
    }

    if (event.stepId) {
      const step = this.getOrCreateStep(event.stepId);
      step.events = [...step.events, event];
    }

    this.autoScroll();
  }

  private getOrCreateStep(stepId: string): AgentStep {
    const matched = this.steps.find((step) => step.id === stepId);
    if (matched) {
      return matched;
    }

    const next: AgentStep = { id: stepId, events: [] };
    this.steps = [...this.steps, next];
    return next;
  }

  private autoScroll(): void {
    setTimeout(() => {
      const el = this.timelineContainer?.nativeElement;
      if (!el) {
        return;
      }
      el.scrollTop = el.scrollHeight;
    }, 0);
  }

  private resetForRun(): void {
    this.streamSub?.unsubscribe();
    this.loading = true;
    this.streamStatus = 'running';
    this.finalText = '';
    this.steps = [];
  }
}
