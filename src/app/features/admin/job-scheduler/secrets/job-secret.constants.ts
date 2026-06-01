import { SecretCreateDto } from './data-access/models/job-secret.model';

export const JOB_SECRET_ROUTES = {
  list: '/admin/jobs/secrets',
  create: '/admin/jobs/secrets/create'
} as const;

export const JOB_SECRET_PLAINTEXT_INITIAL_VALUE: SecretCreateDto = {
  code: '',
  name: '',
  type: 'PLAINTEXT',
  data: { value: '' },
  description: ''
};

export const JOB_SECRET_KEYCLOAK_INITIAL_VALUE: SecretCreateDto = {
  code: '',
  name: '',
  type: 'KEYCLOAK_CLIENT_CREDENTIALS',
  data: {
    baseUrl: '',
    realm: '',
    clientId: '',
    clientSecret: '',
    scope: 'openid',
    tokenField: 'access_token',
    headerName: 'Authorization',
    headerPrefix: 'Bearer'
  },
  description: ''
};
