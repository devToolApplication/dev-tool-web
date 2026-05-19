import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

import { InputText } from './input-text';

const meta: Meta<InputText> = {
  title: 'Shared/Components/Form Controls/Input Text',
  component: InputText,
  args: {
    label: 'Name',
    placeholder: 'Enter name',
    value: 'Workflow Alpha',
    iconClass: 'pi pi-pencil',
    helpText: 'Single line text input.'
  }
};

export default meta;

type Story = StoryObj<InputText>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/name/i);

    await expect(input).toHaveValue('Workflow Alpha');
    await userEvent.clear(input);
    await userEvent.type(input, 'Workflow Beta');
    await expect(input).toHaveValue('Workflow Beta');
  }
};

export const Invalid: Story = {
  args: {
    value: '',
    invalid: true,
    errorMessage: 'Name is required'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
