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
            { id: 'turn-1', role: 'user', content: 'Turn 1 prompt' },
            { id: 'turn-2', role: 'assistant', content: 'Turn 1 reply' },
          ],
        } as CodexThreadDetail)
      ),
      streamPrompt: vi.fn(),
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
});
