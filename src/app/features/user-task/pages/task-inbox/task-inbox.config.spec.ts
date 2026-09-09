import { describe, expect, it, vi } from 'vitest';
import type { KeycloakService } from '../../../../core/auth/keycloak.service';
import { UserTaskQuery, UserTaskSummary } from '../../models/user-task.model';
import {
  ALL_COLUMN_FIELDS,
  PRIMARY_COLUMN_FIELDS,
  buildUserTaskFilterFields,
  buildUserTaskTableConfig,
  buildUserTaskToolbarActions,
  buildUserTaskViewTabs,
  extractInboxError,
  filterValuesToQuery,
  isAiAgentAdmin,
  parseUserTaskQuery,
  queryToFilterValues,
  serializeUserTaskQuery,
} from './task-inbox.config';

describe('task-inbox.config', () => {
  describe('isAiAgentAdmin', () => {
    it('returns true when realm_access.roles contains ai_agent_admin', () => {
      const keycloak = {
        userInfo: { realm_access: { roles: ['offline_access', 'ai_agent_admin'] } },
      } as unknown as KeycloakService;
      expect(isAiAgentAdmin(keycloak)).toBe(true);
    });

    it('returns false when realm_access.roles does not contain ai_agent_admin', () => {
      const keycloak = {
        userInfo: { realm_access: { roles: ['offline_access', 'admin'] } },
      } as unknown as KeycloakService;
      expect(isAiAgentAdmin(keycloak)).toBe(false);
    });

    it('falls back to hasRole when realm_access is missing', () => {
      const keycloak = {
        userInfo: {},
        hasRole: vi.fn((role: string) => role === 'ai_agent_admin'),
      } as unknown as KeycloakService;
      expect(isAiAgentAdmin(keycloak)).toBe(true);
      expect(keycloak.hasRole).toHaveBeenCalledWith('ai_agent_admin');
    });

    it('returns false when keycloak is null or undefined', () => {
      expect(isAiAgentAdmin(null)).toBe(false);
      expect(isAiAgentAdmin(undefined)).toBe(false);
    });
  });

  describe('buildUserTaskViewTabs', () => {
    it('returns only MY and CLAIMABLE tabs for non-admin', () => {
      const tabs = buildUserTaskViewTabs(false);
      expect(tabs.length).toBe(2);
      expect(tabs.map((t) => t.value)).toEqual(['MY', 'CLAIMABLE']);
    });

    it('returns MY, CLAIMABLE, and ALL tabs for admin', () => {
      const tabs = buildUserTaskViewTabs(true);
      expect(tabs.length).toBe(3);
      expect(tabs.map((t) => t.value)).toEqual(['MY', 'CLAIMABLE', 'ALL']);
    });
  });

  describe('buildUserTaskToolbarActions', () => {
    it('returns refresh toolbar action', () => {
      const actions = buildUserTaskToolbarActions();
      expect(actions.length).toBe(1);
      expect(actions[0].id).toBe('refresh');
      expect(actions[0].icon).toBe('pi pi-refresh');
    });
  });

  describe('buildUserTaskFilterFields', () => {
    it('defines 5 filter fields with expected keys', () => {
      const fields = buildUserTaskFilterFields();
      expect(fields.length).toBe(5);
      const keys = fields.map((f) => f.key);
      expect(keys).toEqual(['keyword', 'formKey', 'status', 'businessKey', 'dueRange']);
    });

    it('includes all supported formKey options in formKey field', () => {
      const fields = buildUserTaskFilterFields();
      const formKeyField = fields.find((f) => f.key === 'formKey');
      expect(formKeyField).toBeDefined();
      const values = formKeyField?.options?.map((o) => o.value);
      expect(values).toContain('');
      expect(values).toContain('KOC_CANDIDATE_APPROVAL');
      expect(values).toContain('KOC_DISCOVERY_DECISION');
      expect(values).toContain('MANUAL_2FA_CONFIRMATION');
      expect(values).toContain('APPROVAL');
    });
  });

  describe('buildUserTaskTableConfig', () => {
    it('configures 7 columns and row clickable', () => {
      const onOpen = vi.fn();
      const config = buildUserTaskTableConfig(onOpen);

      expect(config.rowClickable).toBe(true);
      expect(config.pagination).toBe(true);
      expect(config.emptyTitle).toBe('userTask.empty.title');
      expect(config.emptyDescription).toBe('userTask.empty.description');
      expect(config.columns.length).toBe(7);

      const fieldNames = config.columns.map((c) => c.field);
      expect(fieldNames).toEqual([
        'task',
        'workflow',
        'formKey',
        'assignee',
        'createdAt',
        'status',
        'actions',
      ]);
    });

    it('open action triggers callback with taskId', () => {
      const onOpen = vi.fn();
      const config = buildUserTaskTableConfig(onOpen);
      const actionsCol = config.columns.find((c) => c.field === 'actions');
      expect(actionsCol?.actions?.length).toBe(1);

      const openAction = actionsCol?.actions?.[0];
      expect(openAction?.id).toBe('open');

      const mockTask: UserTaskSummary = {
        taskId: 'task-77',
        processInstanceId: 'proc-1',
        formKey: 'APPROVAL',
        taskName: 'Review Form',
        priority: 50,
        completed: false,
        claimable: false,
        readOnly: false,
        canAct: true,
        allowedActions: ['APPROVE'],
        createdAt: '2026-09-08T10:00:00Z',
      };

      openAction?.onClick(mockTask);
      expect(onOpen).toHaveBeenCalledWith('task-77');
    });
  });

  describe('serializeUserTaskQuery', () => {
    it('serializes full query object to params with dueAfter and dueBefore', () => {
      const query: UserTaskQuery = {
        view: 'CLAIMABLE',
        status: 'ACTIVE',
        keyword: 'Contract',
        formKey: 'APPROVAL',
        businessKey: 'CAMPAIGN-001',
        dueAfter: '2026-09-01T00:00:00.000Z',
        dueBefore: '2026-09-10T00:00:00.000Z',
        page: 2,
        size: 20,
        sort: 'priority,desc',
      };

      const params = serializeUserTaskQuery(query);
      expect(params).toEqual({
        view: 'CLAIMABLE',
        status: 'ACTIVE',
        keyword: 'Contract',
        formKey: 'APPROVAL',
        businessKey: 'CAMPAIGN-001',
        dueAfter: '2026-09-01T00:00:00.000Z',
        dueBefore: '2026-09-10T00:00:00.000Z',
        page: 2,
        size: 20,
        sort: 'priority,desc',
      });
    });

    it('does not trim formKey when serializing', () => {
      const query: UserTaskQuery = {
        view: 'MY',
        formKey: '  APPROVAL_EXACT  ',
      };

      const params = serializeUserTaskQuery(query);
      expect(params['formKey']).toBe('  APPROVAL_EXACT  ');
    });

    it('omits undefined/empty strings but serializes page, size, sort', () => {
      const query: UserTaskQuery = {
        view: 'MY',
        page: 0,
        size: 10,
        sort: 'createdAt,desc',
      };

      const params = serializeUserTaskQuery(query);
      expect(params).toEqual({
        view: 'MY',
        page: 0,
        size: 10,
        sort: 'createdAt,desc',
      });
    });
  });

  describe('parseUserTaskQuery', () => {
    it('parses valid query parameters with dueAfter and dueBefore correctly', () => {
      const params = {
        view: 'CLAIMABLE',
        status: 'ACTIVE',
        keyword: 'Approval',
        formKey: 'KOC_CANDIDATE_APPROVAL',
        businessKey: 'BK-100',
        dueAfter: '2026-09-01T00:00:00.000Z',
        dueBefore: '2026-09-10T00:00:00.000Z',
        page: '3',
        size: '50',
        sort: 'dueAt,asc',
      };

      const query = parseUserTaskQuery(params, false);
      expect(query).toEqual({
        view: 'CLAIMABLE',
        status: 'ACTIVE',
        keyword: 'Approval',
        formKey: 'KOC_CANDIDATE_APPROVAL',
        businessKey: 'BK-100',
        dueAfter: '2026-09-01T00:00:00.000Z',
        dueBefore: '2026-09-10T00:00:00.000Z',
        page: 3,
        size: 50,
        sort: 'dueAt,asc',
      });
    });

    it('does not trim formKey during parsing', () => {
      const params = { formKey: '  EXACT_KEY  ' };
      const query = parseUserTaskQuery(params, false);
      expect(query.formKey).toBe('  EXACT_KEY  ');
    });

    it('sanitizes view=ALL to MY when isAdmin is false', () => {
      const params = { view: 'ALL' };
      const query = parseUserTaskQuery(params, false);
      expect(query.view).toBe('MY');
    });

    it('preserves view=ALL when isAdmin is true', () => {
      const params = { view: 'ALL' };
      const query = parseUserTaskQuery(params, true);
      expect(query.view).toBe('ALL');
    });

    it('applies defaults when params are empty', () => {
      const query = parseUserTaskQuery({}, false);
      expect(query).toEqual({
        view: 'MY',
        page: 0,
        size: 10,
        sort: 'createdAt,desc',
      });
    });
  });

  describe('queryToFilterValues & filterValuesToQuery', () => {
    it('converts query to filter values correctly', () => {
      const query: UserTaskQuery = {
        keyword: 'Search Text',
        formKey: 'APPROVAL',
        status: 'ACTIVE',
        businessKey: 'CAMP-456',
        dueAfter: '2026-09-01T00:00:00.000Z',
        dueBefore: '2026-09-10T00:00:00.000Z',
      };

      const filterValues = queryToFilterValues(query);
      expect(filterValues['keyword']).toBe('Search Text');
      expect(filterValues['formKey']).toBe('APPROVAL');
      expect(filterValues['status']).toBe('ACTIVE');
      expect(filterValues['businessKey']).toBe('CAMP-456');

      const dueRange = filterValues['dueRange'] as { from: Date; to: Date };
      expect(dueRange.from).toBeInstanceOf(Date);
      expect(dueRange.to).toBeInstanceOf(Date);
    });

    it('converts filter values back to query with dueAfter and dueBefore', () => {
      const values: Record<string, unknown> = {
        keyword: 'New Keyword',
        formKey: '  MANUAL_2FA_CONFIRMATION  ',
        status: 'COMPLETED',
        businessKey: 'BK-789',
        dueRange: {
          from: new Date('2026-09-05T00:00:00.000Z'),
          to: new Date('2026-09-15T00:00:00.000Z'),
        },
      };

      const currentQuery: UserTaskQuery = {
        view: 'CLAIMABLE',
        page: 4,
        size: 20,
        sort: 'createdAt,desc',
      };

      const nextQuery = filterValuesToQuery(values, currentQuery);
      expect(nextQuery.view).toBe('CLAIMABLE');
      expect(nextQuery.page).toBe(0);
      expect(nextQuery.size).toBe(20);
      expect(nextQuery.keyword).toBe('New Keyword');
      expect(nextQuery.formKey).toBe('  MANUAL_2FA_CONFIRMATION  ');
      expect(nextQuery.status).toBe('COMPLETED');
      expect(nextQuery.businessKey).toBe('BK-789');
      expect(nextQuery.dueAfter).toBe('2026-09-05T00:00:00.000Z');
      expect(nextQuery.dueBefore).toBe('2026-09-15T00:00:00.000Z');
    });
  });

  describe('extractInboxError', () => {
    it('extracts errorCode and errorMessage from backend error payload', () => {
      const backendError = {
        status: 400,
        error: {
          errorCode: 'USER_TASK_ACCESS_DENIED',
          errorMessage: 'You do not have access to this task view',
        },
      };

      const result = extractInboxError(backendError);
      expect(result.errorCode).toBe('USER_TASK_ACCESS_DENIED');
      expect(result.errorMessage).toBe('You do not have access to this task view');
    });

    it('falls back to HTTP status when error code is not in payload', () => {
      const httpError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: 'Database connection failed',
      };

      const result = extractInboxError(httpError);
      expect(result.errorCode).toBe('HTTP_500');
      expect(result.errorMessage).toBe('Database connection failed');
    });

    it('handles null or undefined error safely', () => {
      const result = extractInboxError(null);
      expect(result.errorCode).toBe('UNKNOWN_ERROR');
      expect(result.errorMessage).toBe('An unknown error occurred');
    });
  });

  describe('column fields constants', () => {
    it('contains expected primary and all column fields', () => {
      expect(PRIMARY_COLUMN_FIELDS).toEqual(['task', 'status', 'actions']);
      expect(ALL_COLUMN_FIELDS).toEqual([
        'task',
        'workflow',
        'formKey',
        'assignee',
        'createdAt',
        'status',
        'actions',
      ]);
    });
  });
});
