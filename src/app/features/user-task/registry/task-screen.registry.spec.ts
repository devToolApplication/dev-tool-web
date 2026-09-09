import { GenericApprovalScreenComponent } from '../screens/generic-approval/generic-approval-screen.component';
import { KocCandidateApprovalScreenComponent } from '../screens/koc-candidate-approval/koc-candidate-approval-screen.component';
import { KocDiscoveryDecisionScreenComponent } from '../screens/koc-discovery-decision/koc-discovery-decision-screen.component';
import { Manual2faConfirmationScreenComponent } from '../screens/manual-2fa-confirmation/manual-2fa-confirmation-screen.component';
import { UnsupportedTaskScreenComponent } from '../components/unsupported-task-screen/unsupported-task-screen.component';
import { SUPPORTED_FORM_KEYS } from '../models/user-task.model';
import { TaskScreenRegistry } from './task-screen.registry';

describe('TaskScreenRegistry', () => {
  let registry: TaskScreenRegistry;

  beforeEach(() => {
    registry = new TaskScreenRegistry();
  });

  it('resolves KOC_CANDIDATE_APPROVAL screen and title', () => {
    const entry = registry.get(SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL);
    expect(entry).not.toBeNull();
    expect(entry?.component).toBe(KocCandidateApprovalScreenComponent);
    expect(entry?.screenTitleKey).toBe('userTask.kocApproval.title');
  });

  it('resolves KOC_DISCOVERY_DECISION screen and title', () => {
    const entry = registry.get(SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION);
    expect(entry).not.toBeNull();
    expect(entry?.component).toBe(KocDiscoveryDecisionScreenComponent);
    expect(entry?.screenTitleKey).toBe('userTask.kocDecision.title');
  });

  it('resolves MANUAL_2FA_CONFIRMATION screen and title', () => {
    const entry = registry.get(SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION);
    expect(entry).not.toBeNull();
    expect(entry?.component).toBe(Manual2faConfirmationScreenComponent);
    expect(entry?.screenTitleKey).toBe('userTask.manual2fa.title');
  });

  it('resolves APPROVAL screen and title', () => {
    const entry = registry.get(SUPPORTED_FORM_KEYS.APPROVAL);
    expect(entry).not.toBeNull();
    expect(entry?.component).toBe(GenericApprovalScreenComponent);
    expect(entry?.screenTitleKey).toBe('userTask.generic.title');
  });

  it('maps unknown formKey to UnsupportedTaskScreen', () => {
    const entry = registry.get('CUSTOM_UNKNOWN_FORM');
    expect(entry).not.toBeNull();
    expect(entry?.component).toBe(UnsupportedTaskScreenComponent);
    expect(entry?.screenTitleKey).toBe('userTask.unsupported.title');
  });

  it('uses exact matching for padded and whitespace-only formKeys', () => {
    const padded = registry.get(` ${SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL} `);
    const whitespace = registry.get('   ');

    expect(padded?.component).toBe(UnsupportedTaskScreenComponent);
    expect(whitespace?.component).toBe(UnsupportedTaskScreenComponent);
    expect(registry.isSupported(` ${SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL} `)).toBe(false);
    expect(registry.isSupported('   ')).toBe(false);
  });

  it('returns null only for empty or absent formKey with no fallback', () => {
    expect(registry.get('')).toBeNull();
    expect(registry.get(null)).toBeNull();
    expect(registry.get(undefined)).toBeNull();
  });

  it('checks supported status accurately', () => {
    expect(registry.isSupported(SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL)).toBe(true);
    expect(registry.isSupported(SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION)).toBe(true);
    expect(registry.isSupported(SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION)).toBe(true);
    expect(registry.isSupported(SUPPORTED_FORM_KEYS.APPROVAL)).toBe(true);
    expect(registry.isSupported('UNKNOWN_KEY')).toBe(false);
    expect(registry.isSupported('')).toBe(false);
    expect(registry.isSupported(null)).toBe(false);
  });

  it('exposes all four registered formKeys', () => {
    const keys = registry.getRegisteredFormKeys();
    expect(keys).toEqual([
      SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
      SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION,
      SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION,
      SUPPORTED_FORM_KEYS.APPROVAL,
    ]);
  });
});
