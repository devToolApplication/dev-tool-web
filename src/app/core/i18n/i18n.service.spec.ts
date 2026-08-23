import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registers workflow studio translation keys', () => {
    const service = new I18nService();
    service.setLanguage('en');

    expect(service.t('workflowStudio.problems.title')).toBe('Workflow problems');

    service.setLanguage('vi');

    expect(service.t('workflowStudio.inspector.emptyTitle')).toBe('Chua chon node');
  });
});
