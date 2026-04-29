import type { Meta, StoryObj } from '@storybook/angular';

import { Fileupload } from './fileupload';

const meta: Meta<Fileupload> = {
  title: 'Shared/Components/File Upload',
  component: Fileupload,
  args: {
    mode: 'basic',
    chooseLabel: 'Choose file',
    uploadLabel: 'Upload',
    cancelLabel: 'Cancel',
    accept: '.csv,.json',
    multiple: false,
    customUpload: true
  }
};

export default meta;

type Story = StoryObj<Fileupload>;

export const Basic: Story = {};

export const Advanced: Story = {
  args: {
    mode: 'advanced',
    multiple: true,
    maxFileSize: 1000000
  }
};
