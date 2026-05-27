import type { Meta, StoryObj } from '@storybook/angular';
import { ResponsiveGridComponent } from './responsive-grid.component';

const meta: Meta<ResponsiveGridComponent> = {
  title: 'Shared/UI/Layout/ResponsiveGrid',
  component: ResponsiveGridComponent,
  args: {
    columns: 2,
    gap: 'md',
    align: 'stretch'
  },
  render: (args) => ({
    props: args,
    template: `
      <app-responsive-grid [columns]="columns" [gap]="gap" [align]="align">
        <app-card class="block">
          <div class="p-4">
            <h3 class="font-bold">Card 1</h3>
            <p>This is content in the first grid cell.</p>
          </div>
        </app-card>
        <app-card class="block">
          <div class="p-4">
            <h3 class="font-bold">Card 2</h3>
            <p>This is content in the second grid cell.</p>
          </div>
        </app-card>
        <app-card class="block">
          <div class="p-4">
            <h3 class="font-bold">Card 3</h3>
            <p>This is content in the third grid cell.</p>
          </div>
        </app-card>
        <app-card class="block">
          <div class="p-4">
            <h3 class="font-bold">Card 4</h3>
            <p>This is content in the fourth grid cell.</p>
          </div>
        </app-card>
      </app-responsive-grid>
    `
  })
};

export default meta;

type Story = StoryObj<ResponsiveGridComponent>;

export const TwoColumns: Story = {
  args: {
    columns: 2
  }
};

export const ThreeColumns: Story = {
  args: {
    columns: 3
  }
};

export const FourColumns: Story = {
  args: {
    columns: 4
  }
};

export const SixColumns: Story = {
  args: {
    columns: 6
  }
};

export const SmallGap: Story = {
  args: {
    gap: 'sm'
  }
};

export const LargeGap: Story = {
  args: {
    gap: 'lg'
  }
};

export const AlignStart: Story = {
  args: {
    align: 'start'
  }
};
