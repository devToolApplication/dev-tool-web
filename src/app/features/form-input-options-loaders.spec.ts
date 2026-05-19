import { firstValueFrom, of } from 'rxjs';

import { AiAgentSecretUserService } from '../core/services/ai-agent-service/ai-agent-secret-user.service';
import { StorageSecretUserService } from '../core/services/file-service/storage-secret-user.service';
import {
  AI_AGENT_USER_SECRETS_OPTIONS_SOURCE,
  createAiAgentSecretOptionsLoader,
  createStorageSecretOptionsLoader,
  mapActiveSecretOptions,
  STORAGE_USER_SECRETS_OPTIONS_SOURCE
} from './form-input-options-loaders';

describe('feature form input options loaders', () => {
  it('maps only active secret records to generic select options', () => {
    expect(
      mapActiveSecretOptions([
        { id: 'active-id', category: 'Runtime', name: 'Password', status: 'ACTIVE' },
        { id: 'disabled-id', category: 'Runtime', name: 'Disabled', status: 'INACTIVE' }
      ])
    ).toEqual([{ label: 'Runtime / Password', value: 'active-id' }]);
  });

  it('creates an ai-agent secret options loader without exposing the service to shared ui', async () => {
    const service = {
      getAll: () => of([{ id: 'ai-secret', category: 'AI', name: 'OpenAI', status: 'ACTIVE' }])
    } as AiAgentSecretUserService;
    const loader = createAiAgentSecretOptionsLoader(service);

    await expect(firstValueFrom(loader.load())).resolves.toEqual([{ label: 'AI / OpenAI', value: 'ai-secret' }]);
    expect(loader.source).toBe(AI_AGENT_USER_SECRETS_OPTIONS_SOURCE);
  });

  it('creates a storage secret options loader without exposing the service to shared ui', async () => {
    const service = {
      getAll: () => of([{ id: 'storage-secret', category: 'Storage', name: 'S3', status: 'ACTIVE' }])
    } as StorageSecretUserService;
    const loader = createStorageSecretOptionsLoader(service);

    await expect(firstValueFrom(loader.load())).resolves.toEqual([{ label: 'Storage / S3', value: 'storage-secret' }]);
    expect(loader.source).toBe(STORAGE_USER_SECRETS_OPTIONS_SOURCE);
  });
});
