import type { Meta, StoryObj } from '@storybook/angular';
import { Button } from './button';

const meta: Meta<Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
};

export const IconOnly: Story = {
  args: {
    icon: 'pi pi-check',
    iconOnly: true,
    ariaLabel: 'Confirm',
  },
};

export const Matrix: Story = {
  render: () => ({
    template: `
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <app-button label="Primary" variant="primary"></app-button>
          <app-button label="Secondary" variant="secondary"></app-button>
          <app-button label="Ghost" variant="ghost"></app-button>
          <app-button label="Destructive" variant="destructive"></app-button>
        </div>
        <div class="flex items-center gap-2">
          <app-button label="Small" size="sm"></app-button>
          <app-button label="Medium" size="md"></app-button>
          <app-button label="Large" size="lg"></app-button>
        </div>
      </div>
    `,
  }),
};
