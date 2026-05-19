import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { PanelComponent } from './panel.component';

describe('PanelComponent', () => {
  let component: PanelComponent;
  let fixture: ComponentFixture<PanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(PanelComponent);
    component = fixture.componentInstance;
  });

  it('renders optional title and description through the shared card shell', () => {
    component.title = 'shared.panel.title';
    component.description = 'shared.panel.description';

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-panel-title')?.textContent).toContain(
      'shared.panel.title'
    );
    expect(fixture.nativeElement.querySelector('.app-panel-description')?.textContent).toContain(
      'shared.panel.description'
    );
  });
});
