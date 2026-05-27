import type { Meta, StoryObj } from '@storybook/angular';
import { FilterPanelComponent, type FilterPanelField } from './filter-panel.component';

const sampleFilters: FilterPanelField[] = [
  {
    key: 'search',
    label: 'filter.search',
    type: 'text',
    placeholder: 'filter.search.placeholder',
    advanced: false
  },
  {
    key: 'status',
    label: 'filter.status',
    type: 'select',
    placeholder: 'filter.status.select',
    options: [
      { label: 'status.active', value: 'active' },
      { label: 'status.inactive', value: 'inactive' },
      { label: 'status.pending', value: 'pending' }
    ],
    advanced: false
  },
  {
    key: 'tags',
    label: 'filter.tags',
    type: 'multi-select',
    placeholder: 'filter.tags.select',
    options: [
      { label: 'QA', value: 'qa' },
      { label: 'PROD', value: 'prod' },
      { label: 'STAGING', value: 'staging' }
    ],
    advanced: true
  },
  {
    key: 'createdDate',
    label: 'filter.createdDate',
    type: 'date-range',
    advanced: true
  },
  {
    key: 'amount',
    label: 'filter.amount',
    type: 'number-range',
    advanced: true
  },
  {
    key: 'enabledOnly',
    label: 'filter.enabledOnly',
    type: 'boolean',
    advanced: true
  }
];

const meta: Meta<FilterPanelComponent> = {
  title: 'Shared/UI/Layout/FilterPanel',
  component: FilterPanelComponent,
  args: {
    filters: sampleFilters,
    advancedCollapsed: true,
    values: {},
    initialValues: {},
    searchDebounceMs: 250
  }
};

export default meta;

type Story = StoryObj<FilterPanelComponent>;

export const Default: Story = {};

export const ExpandedAdvancedFilters: Story = {
  args: {
    advancedCollapsed: false
  }
};

export const WithInitialValues: Story = {
  args: {
    advancedCollapsed: false,
    values: {
      search: 'Approval',
      status: 'active',
      enabledOnly: true,
      amount: { from: 100, to: 500 }
    },
    initialValues: {
      search: '',
      status: null,
      enabledOnly: false,
      amount: null
    }
  }
};
