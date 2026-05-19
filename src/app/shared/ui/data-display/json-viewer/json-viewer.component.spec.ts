import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared.module';
import { provideSharedTesting } from '../../../testing/shared-test.providers';
import { JsonViewerComponent } from './json-viewer.component';

describe('JsonViewerComponent', () => {
  let fixture: ComponentFixture<JsonViewerComponent>;
  let component: JsonViewerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(JsonViewerComponent);
    component = fixture.componentInstance;
  });

  it('renders formatted valid JSON and supports raw toggle', () => {
    component.value = '{"enabled":true}';
    fixture.detectChanges();

    expect(component.invalid).toBe(false);
    expect(component.displayValue).toContain('"enabled": true');

    component.toggleRaw();

    expect(component.displayValue).toBe('{"enabled":true}');
  });

  it('marks invalid JSON without crashing', () => {
    component.value = '{invalid-json';
    fixture.detectChanges();

    expect(component.invalid).toBe(true);
    expect(component.displayValue).toContain('{invalid-json');
  });

  it('handles null and undefined as empty JSON values', () => {
    component.value = null;
    fixture.detectChanges();

    expect(component.invalid).toBe(false);
    expect(component.displayValue).toBe('null');

    component.value = undefined;
    fixture.detectChanges();

    expect(component.displayValue).toBe('null');
  });

  it('collapses and expands content', () => {
    component.value = { id: 'cfg-1' };
    component.collapsed = true;
    component.ngOnChanges({
      collapsed: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.json-viewer__body')).toBeNull();

    component.toggleCollapsed();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.json-viewer__body')?.textContent).toContain('cfg-1');
  });

  it('copies the displayed JSON value', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    component.value = { id: 'cfg-1' };

    await component.copy();

    expect(writeText).toHaveBeenCalledWith(component.displayValue);
    expect(component.copied()).toBe(true);
  });

  it('masks secret-like keys when enabled', () => {
    component.value = {
      visible: 'shown',
      apiSecret: 'secret-value',
      nested: {
        accessToken: 'token-value'
      }
    };
    component.maskSecrets = true;

    expect(component.displayValue).toContain('shown');
    expect(component.displayValue).toContain('[masked]');
    expect(component.displayValue).not.toContain('secret-value');
    expect(component.displayValue).not.toContain('token-value');
  });
});
