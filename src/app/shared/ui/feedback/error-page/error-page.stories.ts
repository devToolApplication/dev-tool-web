import type { Meta, StoryObj } from '@storybook/angular';
import { ErrorPageComponent } from './error-page.component';

const meta: Meta<ErrorPageComponent> = {
  title: 'Shared/UI/Feedback/ErrorPage',
  component: ErrorPageComponent,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    code: '404',
    title: 'errors.notFound.title',
    description: 'errors.notFound.description',
    actionLabel: 'errors.backToDashboard',
    actionRouterLink: '/admin/dashboard'
  }
};

export default meta;

type Story = StoryObj<ErrorPageComponent>;

export const NotFound: Story = {};

export const ServerError: Story = {
  args: {
    code: '500',
    title: 'errors.serverError.title',
    description: 'errors.serverError.description'
  }
};

export const Forbidden: Story = {
  args: {
    code: '403',
    title: 'errors.forbidden.title',
    description: 'errors.forbidden.description'
  }
};
