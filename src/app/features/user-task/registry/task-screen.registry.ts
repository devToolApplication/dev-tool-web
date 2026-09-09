import { Injectable, Type } from '@angular/core';
import { UnsupportedTaskScreenComponent } from '../components/unsupported-task-screen/unsupported-task-screen.component';
import { GenericApprovalScreenComponent } from '../screens/generic-approval/generic-approval-screen.component';
import { KocCandidateApprovalScreenComponent } from '../screens/koc-candidate-approval/koc-candidate-approval-screen.component';
import { KocDiscoveryDecisionScreenComponent } from '../screens/koc-discovery-decision/koc-discovery-decision-screen.component';
import { Manual2faConfirmationScreenComponent } from '../screens/manual-2fa-confirmation/manual-2fa-confirmation-screen.component';
import { SUPPORTED_FORM_KEYS } from '../models/user-task.model';

export interface TaskScreenRegistration {
  formKey: string;
  component: Type<unknown>;
  screenTitleKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskScreenRegistry {
  private readonly registry = new Map<string, TaskScreenRegistration>();

  readonly unsupportedRegistration: TaskScreenRegistration = {
    formKey: 'UNSUPPORTED',
    component: UnsupportedTaskScreenComponent,
    screenTitleKey: 'userTask.unsupported.title',
  };

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register({
      formKey: SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
      component: KocCandidateApprovalScreenComponent,
      screenTitleKey: 'userTask.kocApproval.title',
    });
    this.register({
      formKey: SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION,
      component: KocDiscoveryDecisionScreenComponent,
      screenTitleKey: 'userTask.kocDecision.title',
    });
    this.register({
      formKey: SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION,
      component: Manual2faConfirmationScreenComponent,
      screenTitleKey: 'userTask.manual2fa.title',
    });
    this.register({
      formKey: SUPPORTED_FORM_KEYS.APPROVAL,
      component: GenericApprovalScreenComponent,
      screenTitleKey: 'userTask.generic.title',
    });
  }

  register(entry: TaskScreenRegistration): void {
    this.registry.set(entry.formKey, entry);
  }

  get(formKey: string | null | undefined): TaskScreenRegistration | null {
    if (!formKey) {
      return null;
    }
    const found = this.registry.get(formKey);
    if (found) {
      return found;
    }
    return this.unsupportedRegistration;
  }

  isSupported(formKey: string | null | undefined): boolean {
    if (!formKey) {
      return false;
    }
    return this.registry.has(formKey);
  }

  getRegisteredFormKeys(): string[] {
    return Array.from(this.registry.keys());
  }
}
