import type { Meta, StoryObj } from '@storybook/angular';

import { InputArea } from './input-area';

const meta: Meta<InputArea> = {
  title: 'Shared/Components/Input Area',
  component: InputArea,
  args: {
    label: 'Notes',
    placeholder: 'Write notes',
    value: 'Reusable textarea with BaseInput behavior.',
    rows: 4,
    maxRows: 8,
    showZoomButton: true
  }
};

export default meta;

type Story = StoryObj<InputArea>;

export const Text: Story = {};

export const Json: Story = {
  args: {
    label: 'JSON config',
    contentType: 'json',
    value: '{\n  "symbol": "BTCUSDT",\n  "interval": "1h",\n  "enabled": true\n}',
    rows: 8,
    maxRows: 10
  }
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Content is required'
  }
};
