import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { JsonPreviewComponent } from './json-preview.component';

describe('JsonPreviewComponent', () => {
  let fixture: ComponentFixture<JsonPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(JsonPreviewComponent);
  });

  it('renders the legacy JSON preview container', () => {
    fixture.detectChanges();

    const preview: HTMLElement | null = fixture.nativeElement.querySelector('pre.json-preview');
    expect(preview).toBeTruthy();
  });
});
