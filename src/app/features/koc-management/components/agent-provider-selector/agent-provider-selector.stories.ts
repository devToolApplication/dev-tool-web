import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '@shared/shared.module';
import type { KocAgentCatalogItem } from '../../model/koc-agent.model';
import { AgentProviderSelectorComponent } from './agent-provider-selector.component';

const sampleAgents: KocAgentCatalogItem[] = [
  {
    agentCode: 'facebook-discovery',
    displayName: 'Facebook Discovery Agent',
    capability: 'DISCOVERY',
    health: 'HEALTHY',
    requiredDependencies: ['facebook-mcp-auth'],
    supportedProviders: [
      { provider: 'codex', health: 'HEALTHY', available: true },
      { provider: 'claude', health: 'DEGRADED', available: false },
    ],
  },
  {
    agentCode: 'profile-evaluator',
    displayName: 'Profile Evaluator Agent',
    capability: 'SCREENING',
    health: 'HEALTHY',
    requiredDependencies: [],
    supportedProviders: [
      { provider: 'codex', health: 'HEALTHY', available: true },
      { provider: 'claude', health: 'HEALTHY', available: true },
    ],
  },
  {
    agentCode: 'content-analyst',
    displayName: 'Content Analyst Agent',
    capability: 'SCREENING',
    health: 'UNHEALTHY',
    requiredDependencies: ['content-analysis-model'],
    supportedProviders: [
      { provider: 'claude', health: 'UNHEALTHY', available: false },
    ],
  },
];

const meta: Meta<AgentProviderSelectorComponent> = {
  title: 'Features/KOC Management/Components/Agent Provider Selector',
  component: AgentProviderSelectorComponent,
  decorators: [
    moduleMetadata({
      declarations: [AgentProviderSelectorComponent],
      imports: [SharedModule],
    }),
  ],
  args: {
    agents: sampleAgents,
    value: {
      agentCode: 'facebook-discovery',
      provider: 'codex',
    },
    disabled: false,
    readonly: false,
    loading: false,
  },
};

export default meta;

type Story = StoryObj<AgentProviderSelectorComponent>;

export const Normal: Story = {};

export const UnavailableProvider: Story = {
  args: {
    agents: sampleAgents,
    value: {
      agentCode: 'facebook-discovery',
      provider: 'codex',
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const ReadonlyPersistedUnavailableProvider: Story = {
  args: {
    readonly: true,
    value: {
      agentCode: 'facebook-discovery',
      provider: 'claude',
    },
  },
};

export const EmptyAgents: Story = {
  args: {
    agents: [],
    value: null,
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
  },
};