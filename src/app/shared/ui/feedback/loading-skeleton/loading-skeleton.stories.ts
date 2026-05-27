import type { Meta, StoryObj } from '@storybook/angular';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

const meta: Meta<LoadingSkeletonComponent> = {
  title: 'Shared/UI/Feedback/LoadingSkeleton',
  component: LoadingSkeletonComponent,
  args: {
    type: 'card',
    rows: 4,
    columns: 4,
    animated: true
  }
};

export default meta;

type Story = StoryObj<LoadingSkeletonComponent>;

export const Card: Story = {
  args: {
    type: 'card'
  }
};

export const Table: Story = {
  args: {
    type: 'table'
  }
};

export const Form: Story = {
  args: {
    type: 'form'
  }
};

export const Detail: Story = {
  args: {
    type: 'detail'
  }
};

export const List: Story = {
  args: {
    type: 'list'
  }
};

export const SkeletonTable: Story = {
  render: (args) => ({
    props: args,
    template: `<app-skeleton-table [rows]="rows" [columns]="columns"></app-skeleton-table>`
  }),
  args: {
    rows: 3,
    columns: 4
  }
};

export const SkeletonForm: Story = {
  render: (args) => ({
    props: args,
    template: `<app-skeleton-form [rows]="rows"></app-skeleton-form>`
  }),
  args: {
    rows: 3
  }
};

export const SkeletonCard: Story = {
  render: (args) => ({
    props: args,
    template: `<app-skeleton-card [rows]="rows"></app-skeleton-card>`
  }),
  args: {
    rows: 3
  }
};
