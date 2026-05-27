import type { Meta, StoryObj } from '@storybook/angular';
import { EmptyStateComponent } from './empty-state.component';

const meta: Meta<EmptyStateComponent> = {
  title: 'Shared/UI/Feedback/EmptyState',
  component: EmptyStateComponent,
  args: {
    title: 'shared.empty.title',
    description: 'There are no active records in this directory or view.',
    variant: 'default',
    size: 'default',
    align: 'center'
  }
};

export default meta;

type Story = StoryObj<EmptyStateComponent>;

export const Default: Story = {};

export const Search: Story = {
  args: {
    title: 'No search results',
    description: 'We could not find any matches for your search keywords.',
    variant: 'search'
  }
};

export const Create: Story = {
  args: {
    title: 'No projects created yet',
    description: 'Get started by creating your first workflow automation project.',
    variant: 'create',
    primaryActionLabel: 'common.create'
  }
};

export const Warning: Story = {
  args: {
    title: 'Access restricted',
    description: 'You do not have access rights to view this data panel.',
    variant: 'warning'
  }
};

export const Compact: Story = {
  args: {
    size: 'compact',
    description: 'No sub-items available.'
  }
};

export const WithActions: Story = {
  args: {
    title: 'Empty Repository',
    description: 'This deployment package has no versions. Upload a package or link to a repository.',
    primaryActionLabel: 'Upload Package',
    secondaryActionLabel: 'Link Repository'
  }
};
