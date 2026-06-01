import { BasePageResponse } from '../../../../../../core/models/base-response.model';

export type SecretType = 'PLAINTEXT' | 'KEYCLOAK_CLIENT_CREDENTIALS';

export interface PlaintextSecretData {
  value: string;
}

export interface KeycloakSecretData {
  baseUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  tokenField: string;
  headerName: string;
  headerPrefix: string;
}

export type SecretData = PlaintextSecretData | KeycloakSecretData;

export interface SecretResponse {
  _id: string;
  code: string;
  name: string;
  type: SecretType;
  data: SecretData;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecretCreateDto {
  code: string;
  name: string;
  type: SecretType;
  data: SecretData;
  description?: string;
}

export interface SecretUpdateDto {
  name?: string;
  data?: SecretData;
  description?: string;
}

export interface SecretOption {
  code: string;
  name: string;
  type: SecretType;
}

export interface SecretOptionsResponse {
  options: SecretOption[];
}

export type SecretPageResponse = BasePageResponse<SecretResponse>;
