import type { Meta, StoryObj } from '@storybook/angular';
import { BasePopupComponent } from './base-popup.component';

const meta: Meta<BasePopupComponent> = {
  title: 'Shared/Components/Overlay/BasePopup',
  component: BasePopupComponent,
  args: {
    visible: true,
    header: 'Popup Header Title',
    subheader: 'Providing additional details for context',
    size: 'md',
    loading: false,
    modal: true,
    dismissableMask: false,
    closeOnEscape: true,
    maximizable: false,
    showCloseIcon: true,
    showFooter: true,
    confirmLabel: 'submit',
    cancelLabel: 'cancel',
    showDefaultCancel: true,
    showDefaultConfirm: true
  },
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded">Note: BasePopup has "visible: true" by default to render in Storybook.</p>
        <app-base-popup
          [visible]="visible"
          [header]="header"
          [subheader]="subheader"
          [size]="size"
          [width]="width"
          [loading]="loading"
          [modal]="modal"
          [dismissableMask]="dismissableMask"
          [closeOnEscape]="closeOnEscape"
          [maximizable]="maximizable"
          [showCloseIcon]="showCloseIcon"
          [showFooter]="showFooter"
          [confirmLabel]="confirmLabel"
          [cancelLabel]="cancelLabel"
          [showDefaultCancel]="showDefaultCancel"
          [showDefaultConfirm]="showDefaultConfirm"
        >
          <p>This is projected dialog body content.</p>
        </app-base-popup>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<BasePopupComponent>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
    header: 'Small Popup'
  }
};

export const Large: Story = {
  args: {
    size: 'lg',
    header: 'Large Popup'
  }
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    header: 'Extra Large Popup'
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};
