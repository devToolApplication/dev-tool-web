import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';
import { CodexChatDrawerComponent } from './codex-chat-drawer.component';
import { CodexSdkService } from '../../services/codex-sdk.service';
import { CodexThreadDetail } from '../../models/codex-sdk.model';

describe('CodexChatDrawerComponent', () => {
  let component: CodexChatDrawerComponent;
  let fixture: ComponentFixture<CodexChatDrawerComponent>;
  let codexServiceMock: any;

  beforeEach(async () => {
    codexServiceMock = {
      getThreadHistory: vi.fn().mockReturnValue(
        of({
          id: 't-100',
          turns: [
            { id: 'turn-1', role: 'user', content: 'Turn 1 prompt', requestContext: { campaignId: 'c1' } },
            { id: 'turn-2', role: 'assistant', content: 'Turn 1 reply' },
          ],
        } as CodexThreadDetail)
      ),
      getAgents: vi.fn().mockReturnValue(of([])),
      processRawCodexLines: vi.fn(),
      streamPrompt: vi.fn(),
      streamLiveThread: vi.fn().mockReturnValue({ abort: vi.fn() }),
    };

    await TestBed.configureTestingModule({
      declarations: [CodexChatDrawerComponent, TranslateContentPipe],
      providers: [{ provide: CodexSdkService, useValue: codexServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CodexChatDrawerComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and load turns when selectedThreadId is set', () => {
    component.selectedThreadId = 't-100';
    expect(component.threadId()).toBe('t-100');
    expect(codexServiceMock.getThreadHistory).toHaveBeenCalledWith('t-100');
    expect(component.turns().length).toBe(2);
  });

  it('should toggle tool call expansion independently', () => {
    expect(component.isToolCallExpanded('turn-1', 0)).toBe(false);
    component.toggleToolCall('turn-1', 0);
    expect(component.isToolCallExpanded('turn-1', 0)).toBe(true);
    expect(component.isToolCallExpanded('turn-1', 1)).toBe(false);
    component.toggleToolCall('turn-1', 0);
    expect(component.isToolCallExpanded('turn-1', 0)).toBe(false);
  });

  it('should stop active stream when stopStream is called', () => {
    const mockAbort = vi.fn();
    (component as any).activeAbortController = { abort: mockAbort };
    component.isStreaming.set(true);

    component.stopStream();

    expect(mockAbort).toHaveBeenCalled();
    expect(component.isStreaming()).toBe(false);
  });

  it('should toggle request context and output schema expansion independently', () => {
    expect(component.isRequestContextExpanded('turn-1')).toBe(false);
    component.toggleRequestContext('turn-1');
    expect(component.isRequestContextExpanded('turn-1')).toBe(true);
    component.toggleRequestContext('turn-1');
    expect(component.isRequestContextExpanded('turn-1')).toBe(false);

    expect(component.isOutputSchemaExpanded('turn-1')).toBe(false);
    component.toggleOutputSchema('turn-1');
    expect(component.isOutputSchemaExpanded('turn-1')).toBe(true);
    component.toggleOutputSchema('turn-1');
    expect(component.isOutputSchemaExpanded('turn-1')).toBe(false);
  });

  it('should format json and detect keys properly', () => {
    expect(component.formatJson(null)).toBe('');
    expect(component.formatJson({ a: 1 })).toContain('"a": 1');
    expect(component.formatJson('{"b":2}')).toContain('"b": 2');
    expect(component.hasKeys(null)).toBe(false);
    expect(component.hasKeys({})).toBe(false);
    expect(component.hasKeys({ campaignId: '123' })).toBe(true);
  });

  it('should automatically attach live stream when assistant turn has status streaming', () => {
    codexServiceMock.getThreadHistory.mockReturnValue(
      of({
        id: 't-live-1',
        turns: [
          { id: 'turn-u1', role: 'user', content: 'Search KOC prompt' },
          { id: 'turn-a1', role: 'assistant', content: '', status: 'streaming' },
        ],
      } as CodexThreadDetail)
    );

    component.loadHistory('t-live-1');

    expect(codexServiceMock.streamLiveThread).toHaveBeenCalledWith(
      't-live-1',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
    expect(component.isStreaming()).toBe(true);
  });
});
