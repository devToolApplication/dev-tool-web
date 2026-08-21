import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent } from './avatar';

const meta: Meta<AvatarComponent> = {
  title: 'Shared/Components/Display/Avatar',
  component: AvatarComponent,
  args: {
    label: 'AB',
    size: 'normal',
    shape: 'circle'
  }
};

export default meta;

type Story = StoryObj<AvatarComponent>;

export const Label: Story = {};

export const Icon: Story = {
  args: {
    label: undefined,
    icon: 'pi pi-user'
  }
};

export const Image: Story = {
  args: {
    label: undefined,
    image: 'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png'
  }
};

export const Sizes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="flex flex-wrap gap-2 items-center">
        <app-avatar label="SM" size="normal"></app-avatar>
        <app-avatar label="MD" size="large"></app-avatar>
        <app-avatar label="LG" size="xlarge"></app-avatar>
      </div>
    `
  })
};
