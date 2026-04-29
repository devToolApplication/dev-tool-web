import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { CheckBox } from './check-box';

const meta: Meta<CheckBox> = {
  title: 'Shared/Components/Check Box',
  component: CheckBox,
  args: {
    label: 'Enable notifications',
    value: true,
    helpText: 'Binary checkbox bound through BaseInput.'
  }
};

export default meta;

type Story = StoryObj<CheckBox>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: /enable notifications/i });

    await expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
  }
};

export const Invalid: Story = {
  args: {
    value: false,
    invalid: true,
    errorMessage: 'This option must be checked'
  }
};
