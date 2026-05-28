import type { Meta, StoryObj } from '@storybook/angular';
import { Fileupload } from './fileupload';

const meta: Meta<Fileupload> = {
  title: 'Shared/Components/Form/FileUpload',
  component: Fileupload,
  args: {
    mode: 'basic',
    chooseLabel: 'Choose File',
    uploadLabel: 'Upload',
    cancelLabel: 'Cancel',
    multiple: false,
    customUpload: true,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<Fileupload>;

export const Basic: Story = {};

export const Advanced: Story = {
  args: {
    mode: 'advanced'
  }
};

export const Multiple: Story = {
  args: {
    mode: 'advanced',
    multiple: true
  }
};
