import type { Meta, StoryObj } from '@storybook/angular';
import { ValueDisplayComponent } from './value-display.component';

const meta: Meta<ValueDisplayComponent> = {
  title: 'Shared/UI/DataDisplay/ValueDisplay',
  component: ValueDisplayComponent,
  args: {
    value: 'Hello World',
    type: 'text',
    emptyValue: '-',
    variant: 'default',
    shorten: true,
    currencyCode: 'USD',
    prefix: '',
    suffix: ''
  }
};

export default meta;

type Story = StoryObj<ValueDisplayComponent>;

export const Text: Story = {};

export const NumberType: Story = {
  args: {
    type: 'number',
    value: 1250000.75
  }
};

export const Currency: Story = {
  args: {
    type: 'currency',
    value: 999.95,
    currencyCode: 'EUR'
  }
};

export const Percent: Story = {
  args: {
    type: 'percent',
    value: 0.854,
    suffix: '%'
  }
};

export const DateType: Story = {
  args: {
    type: 'date',
    value: new Date(2026, 4, 27)
  }
};

export const DateTimeType: Story = {
  args: {
    type: 'datetime',
    value: new Date(2026, 4, 27, 21, 0, 0)
  }
};

export const BooleanTrue: Story = {
  args: {
    type: 'boolean',
    value: true
  }
};

export const BooleanFalse: Story = {
  args: {
    type: 'boolean',
    value: false
  }
};

export const BadgeType: Story = {
  args: {
    type: 'badge',
    value: 'status.active',
    variant: 'success'
  }
};

export const Copyable: Story = {
  args: {
    type: 'copyable',
    value: 'cfg-val-xyz-987-123'
  }
};

export const JsonType: Story = {
  args: {
    type: 'json',
    value: { id: 1, name: 'Workflow' }
  }
};

export const Empty: Story = {
  args: {
    value: null
  }
};
