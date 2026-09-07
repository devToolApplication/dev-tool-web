import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';
import { CodexThreadListPageComponent } from './codex-thread-list.component';
import { CodexChatDrawerComponent } from '../../components/codex-chat-drawer/codex-chat-drawer.component';
import { CodexSdkService } from '../../services/codex-sdk.service';
import { CodexThreadListResponse } from '../../models/codex-sdk.model';

describe('CodexThreadListPageComponent', () => {
  let component: CodexThreadListPageComponent;
  let fixture: ComponentFixture<CodexThreadListPageComponent>;
  let codexServiceMock: any;

  beforeEach(async () => {
    codexServiceMock = {
      getThreads: vi.fn().mockReturnValue(
        of({
          data: [
            { id: 'thread-1', previewText: 'First preview', turnCount: 3 },
            { id: 'thread-2', previewText: 'Second preview', turnCount: 1 },
          ],
          nextCursor: 'next_cursor_token',
        } as CodexThreadListResponse)
      ),
      getThreadHistory: vi.fn().mockReturnValue(of({ id: 'thread-1', turns: [] })),
    };

    await TestBed.configureTestingModule({
      declarations: [CodexThreadListPageComponent, CodexChatDrawerComponent, TranslateContentPipe],
      providers: [{ provide: CodexSdkService, useValue: codexServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CodexThreadListPageComponent);
    component = fixture.componentInstance;
  });

  it('should load threads on init and set nextCursor', () => {
    component.ngOnInit();
    expect(component.threads().length).toBe(2);
    expect(component.nextCursor()).toBe('next_cursor_token');
  });

  it('should advance to next page with cursor and save history', () => {
    component.ngOnInit();
    expect(component.cursorHistory().length).toBe(0);

    component.goToNextPage();

    expect(component.cursorHistory().length).toBe(1);
    expect(component.currentCursor()).toBe('next_cursor_token');
    expect(codexServiceMock.getThreads).toHaveBeenCalled();
  });

  it('should open new workbench session', () => {
    component.openNewWorkbench();
    expect(component.selectedThreadId()).toBeNull();
    expect(component.drawerVisible()).toBe(true);
  });
});
