import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';

const meta: Meta<Button> = {
  title: 'Shared/Components/Button',
  component: Button,
  args: {
    label: 'Submit',
    icon: 'pi pi-check',
    severity: null,
    disabled: false,
    loading: false,
    text: false
  }
};

export default meta;

type Story = StoryObj<Button>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /submit/i });

    await expect(button).toBeEnabled();
    await userEvent.click(button);
  }
};

export const Secondary: Story = {
  args: {
    label: 'Filter',
    icon: 'pi pi-filter',
    severity: 'secondary'
  }
};

export const Text: Story = {
  args: {
    label: 'Clear',
    icon: 'pi pi-times',
    severity: 'secondary',
    text: true
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};
