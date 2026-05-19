import { Provider } from '@angular/core';
import { map } from 'rxjs';

import {
  AiAgentSecretUserResponse,
  AiAgentSecretUserService
} from '../core/services/ai-agent-service/ai-agent-secret-user.service';
import {
  StorageSecretUserResponse,
  StorageSecretUserService
} from '../core/services/file-service/storage-secret-user.service';
import { SelectOption } from '../shared/ui/form-input/models/form-config.model';
import {
  FORM_INPUT_OPTIONS_LOADERS,
  FormInputOptionsLoader
} from '../shared/ui/form-input/utils/form-input-options-loader';

type SecretOptionSource = Pick<AiAgentSecretUserResponse | StorageSecretUserResponse, 'category' | 'id' | 'name' | 'status'>;

export const AI_AGENT_USER_SECRETS_OPTIONS_SOURCE = 'ai-agent-user-secrets';
export const STORAGE_USER_SECRETS_OPTIONS_SOURCE = 'storage-user-secrets';

export function mapActiveSecretOptions(items: SecretOptionSource[]): SelectOption[] {
  return items
    .filter((item) => item.status === 'ACTIVE')
    .map((item) => ({ label: `${item.category} / ${item.name}`, value: item.id }));
}

export function createAiAgentSecretOptionsLoader(service: AiAgentSecretUserService): FormInputOptionsLoader {
  return {
    source: AI_AGENT_USER_SECRETS_OPTIONS_SOURCE,
    load: () => service.getAll().pipe(map(mapActiveSecretOptions))
  };
}

export function createStorageSecretOptionsLoader(service: StorageSecretUserService): FormInputOptionsLoader {
  return {
    source: STORAGE_USER_SECRETS_OPTIONS_SOURCE,
    load: () => service.getAll().pipe(map(mapActiveSecretOptions))
  };
}

export const FEATURE_FORM_INPUT_OPTIONS_LOADERS: Provider[] = [
  {
    provide: FORM_INPUT_OPTIONS_LOADERS,
    multi: true,
    deps: [AiAgentSecretUserService],
    useFactory: createAiAgentSecretOptionsLoader
  },
  {
    provide: FORM_INPUT_OPTIONS_LOADERS,
    multi: true,
    deps: [StorageSecretUserService],
    useFactory: createStorageSecretOptionsLoader
  }
];
