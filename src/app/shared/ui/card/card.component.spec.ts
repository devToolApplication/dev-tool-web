import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  });

  it('maps padding, surface and interactive inputs to host styles and classes', () => {
    component.padding = 'lg';
    component.surface = 'strong';
    component.interactive = true;
    component.fullHeight = true;

    fixture.detectChanges();

    expect(component.hostPadding).toBe('1.25rem');
    expect(component.hostHeight).toBe('100%');
    expect(component.isStrong).toBe(true);
    expect(component.isInteractive).toBe(true);
  });
});
