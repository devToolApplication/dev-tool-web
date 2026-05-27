import type { Meta, StoryObj } from '@storybook/angular';
import { DiffViewerComponent } from './diff-viewer.component';

const beforeObj = {
  id: 'cfg-001',
  active: true,
  settings: {
    maxUsers: 10,
    allowedOrigins: ['http://localhost:3000']
  },
  roles: ['admin', 'member']
};

const afterObj = {
  id: 'cfg-001',
  active: false,
  settings: {
    maxUsers: 25,
    allowedOrigins: ['http://localhost:3000', 'https://app.company.com']
  },
  roles: ['admin', 'member', 'editor']
};

const meta: Meta<DiffViewerComponent> = {
  title: 'Shared/UI/DataDisplay/DiffViewer',
  component: DiffViewerComponent,
  args: {
    before: beforeObj,
    after: afterObj,
    emptyTitle: 'shared.empty.title'
  }
};

export default meta;

type Story = StoryObj<DiffViewerComponent>;

export const Default: Story = {};

export const AddedOnly: Story = {
  args: {
    before: null,
    after: {
      newService: {
        enabled: true,
        host: 'api.service.local'
      }
    }
  }
};

export const RemovedOnly: Story = {
  args: {
    before: {
      legacyField: 'obsolete',
      deprecatedSecret: 'keep-it-secret'
    },
    after: null
  }
};
