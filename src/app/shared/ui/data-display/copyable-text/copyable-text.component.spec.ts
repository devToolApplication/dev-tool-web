import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { CopyableTextComponent } from './copyable-text.component';

describe('CopyableTextComponent', () => {
  let fixture: ComponentFixture<CopyableTextComponent>;
  let component: CopyableTextComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(CopyableTextComponent);
    component = fixture.componentInstance;
  });

  it('renders text with a full-value tooltip', () => {
    component.value = 'record-123';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('record-123');
    expect(fixture.nativeElement.querySelector('.copyable-text')?.getAttribute('title')).toBe('record-123');
  });

  it('shortens long values without changing the copied value', () => {
    component.value = 'abcdefghijklmnopqrstuvwxyz';
    component.shorten = true;
    component.maxLength = 12;
    fixture.detectChanges();

    expect(component.displayText).toContain('...');
    expect(component.text).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('copies the real value and emits copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    component.value = 'copy-value';

    await component.copy();

    expect(writeText).toHaveBeenCalledWith('copy-value');
    expect(component.copiedState()).toBe(true);
  });

  it('falls back when Clipboard API is unavailable', async () => {
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand
    });
    component.value = 'fallback-value';

    await component.copy();

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(component.copiedState()).toBe(true);
  });

  it('handles null/undefined and disabled secret copy safely', async () => {
    component.value = null;
    fixture.detectChanges();

    expect(component.text).toBe('-');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    component.value = 'secret-value';
    component.secret = true;

    await component.copy();

    expect(writeText).not.toHaveBeenCalled();
  });
});
