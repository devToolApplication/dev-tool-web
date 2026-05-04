import type { Meta, StoryObj } from '@storybook/angular';

import { BasePopupComponent } from './base-popup.component';

const meta: Meta<BasePopupComponent> = {
  title: 'Shared/Components/Base Popup',
  component: BasePopupComponent,
  parameters: {
    layout: 'padded'
  },
  args: {
    visible: true,
    header: 'Confirm action',
    subheader: 'Shared dialog wrapper',
    showDefaultConfirm: true,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    appendTo: 'body'
  }
};

export default meta;

type Story = StoryObj<BasePopupComponent>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="p-4">
        <app-button label="Open popup" icon="pi pi-external-link" (buttonClick)="visible = true"></app-button>

        <app-base-popup
          [visible]="visible"
          [header]="header"
          [subheader]="subheader"
          [size]="size"
          [width]="width"
          [loading]="loading"
          [modal]="modal"
          [appendTo]="appendTo"
          [position]="position"
          [dismissableMask]="dismissableMask"
          [closeOnEscape]="closeOnEscape"
          [maximizable]="maximizable"
          [showCloseIcon]="showCloseIcon"
          [showFooter]="showFooter"
          [confirmLabel]="confirmLabel"
          [cancelLabel]="cancelLabel"
          [showDefaultCancel]="showDefaultCancel"
          [showDefaultConfirm]="showDefaultConfirm"
          (visibleChange)="visible = $event"
          (cancel)="visible = false"
          (confirm)="visible = false"
        >
          <p class="m-0 text-sm app-text-soft">
            This popup renders projected content and optional default footer actions.
          </p>
        </app-base-popup>
      </div>
    `
  })
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: Default.render
};
