import type { Meta, StoryObj } from '@storybook/angular';
import { CopyableTextComponent } from './copyable-text.component';

const meta: Meta<CopyableTextComponent> = {
  title: 'Shared/UI/DataDisplay/CopyableText',
  component: CopyableTextComponent,
  args: {
    value: 'cfg-001-long-identifier-text-to-demonstrate-copyable-utility',
    shorten: false,
    maxLength: 24,
    showCopy: true,
    allowCopy: true,
    secret: false,
    emptyValue: '-'
  }
};

export default meta;

type Story = StoryObj<CopyableTextComponent>;

export const Default: Story = {};

export const Shortened: Story = {
  args: {
    shorten: true,
    maxLength: 16
  }
};

export const SecretText: Story = {
  args: {
    secret: true,
    value: 'my-super-secret-password-or-token-value'
  }
};

export const HiddenCopyButton: Story = {
  args: {
    showCopy: false
  }
};

export const Empty: Story = {
  args: {
    value: null
  }
};
