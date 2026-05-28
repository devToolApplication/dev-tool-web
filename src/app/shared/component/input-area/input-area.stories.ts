import type { Meta, StoryObj } from '@storybook/angular';
import { InputArea } from './input-area';

const meta: Meta<InputArea> = {
  title: 'Shared/Components/Form/InputArea',
  component: InputArea,
  args: {
    label: 'Description',
    placeholder: 'Enter detailed description here...',
    value: '',
    rows: 4,
    maxRows: 8,
    showZoomButton: false,
    contentType: 'text',
    disabled: false
  }
};

export default meta;

type Story = StoryObj<InputArea>;

export const Default: Story = {};

export const JsonMode: Story = {
  args: {
    label: 'JSON Configuration',
    placeholder: '{\n  "key": "value"\n}',
    value: '{\n  "server": "localhost",\n  "port": 8080,\n  "enabled": true\n}',
    contentType: 'json'
  }
};

export const WithZoom: Story = {
  args: {
    showZoomButton: true,
    value: 'Some long text that might benefit from a zoom modal to edit comfortably in full screen.'
  }
};
