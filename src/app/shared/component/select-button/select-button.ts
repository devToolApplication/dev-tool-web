import { AfterViewChecked, Component, ElementRef, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-select-button',
  standalone: false,
  templateUrl: './select-button.html',
  styleUrl: './select-button.css',
  providers: [provideValueAccessor(() => SelectButton)]
})
export class SelectButton extends BaseInput<string | number | boolean> implements AfterViewChecked {
  @Input() options: SelectOption[] = [];
  @Input() multiple = false;
  @Input() allowEmpty = true;
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';

  constructor(private readonly host: ElementRef<HTMLElement>) {
    super();
  }

  ngAfterViewChecked(): void {
    this.host.nativeElement
      .querySelectorAll<HTMLElement>('p-togglebutton, .p-togglebutton, .p-togglebutton-content, .p-togglebutton-label')
      .forEach((element) => {
        if (this.disabled) {
          element.style.setProperty('color', 'var(--app-text-soft)', 'important');
          element.style.setProperty('opacity', '1', 'important');
          return;
        }

        element.style.removeProperty('color');
        element.style.removeProperty('opacity');
      });
  }
}
