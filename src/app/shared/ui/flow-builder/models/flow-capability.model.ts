import type { FlowCommand } from './flow-command.model';

export interface FlowCapabilities {
  history?: boolean;
  importExport?: boolean;
  navigator?: boolean;
  inspector?: boolean;
  fullscreen?: boolean;
  autoLayout?: boolean;
  deleteSelection?: boolean;
  duplicateSelection?: boolean;
  multiSelection?: boolean;
  contextActions?: boolean;
  commands?: Partial<Record<FlowCommand, boolean>>;
}

export const DEFAULT_FLOW_CAPABILITIES: Required<Omit<FlowCapabilities, 'commands'>> = {
  history: true,
  importExport: true,
  navigator: true,
  inspector: true,
  fullscreen: true,
  autoLayout: true,
  deleteSelection: true,
  duplicateSelection: true,
  multiSelection: false,
  contextActions: true,
};
