import { toEntityRefOptions, toUniqueTextOptions } from './form-option-utils';

describe('form option utils', () => {
  it('maps existing text values to sorted unique options', () => {
    const options = toUniqueTextOptions(
      [
        { category: ' Runtime ' },
        { category: 'Storage' },
        { category: 'Runtime' },
        { category: '' },
        { category: null }
      ],
      (item) => item.category
    );

    expect(options).toEqual([
      { label: 'Runtime', value: 'Runtime' },
      { label: 'Storage', value: 'Storage' }
    ]);
  });

  it('maps existing entities to selectable ref options', () => {
    const options = toEntityRefOptions(
      [
        { id: 'model-2', name: 'Beta' },
        { id: 'model-1', name: 'Alpha' }
      ],
      (item) => item.id,
      (item) => item.name
    );

    expect(options).toEqual([
      { label: 'Alpha', value: 'model-1' },
      { label: 'Beta', value: 'model-2' }
    ]);
  });
});
