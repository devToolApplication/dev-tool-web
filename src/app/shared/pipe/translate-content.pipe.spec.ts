import { I18nService } from '../../core/ui-services/i18n.service';
import { TranslateContentPipe } from './translate-content.pipe';

class MockI18nService {
  private readonly currentLanguage = (): 'vi' | 'en' => 'vi';

  readonly language = this.currentLanguage;

  t(key: string): string {
    return `translated:${key}`;
  }
}

describe('TranslateContentPipe', () => {
  let pipe: TranslateContentPipe;

  beforeEach(() => {
    pipe = new TranslateContentPipe(new MockI18nService() as unknown as I18nService);
  });

  it('should translate select option labels only once for same object reference', () => {
    const options = [
      { label: 'option.one', value: 1 },
      { label: 'option.two', value: 2 }
    ];

    const first = pipe.transform(options);
    const second = pipe.transform(options);

    expect(first).toBe(second);
    expect((first as Array<{ label: string }>)[0].label).toBe('translated:option.one');
  });

  it('should not crash with circular object references', () => {
    const circular: Record<string, unknown> = { label: 'circular.label' };
    circular['self'] = circular;

    const translated = pipe.transform(circular) as Record<string, unknown>;

    expect(translated['label']).toBe('translated:circular.label');
    expect(translated['self']).toBe(translated);
  });
});
