import { HttpErrorResponse } from '@angular/common/http';
import { FormValidationError } from '../models/form-config.model';

export interface FormApiErrorState {
  apiError: string | null;
  apiFieldErrors: FormValidationError[];
  status?: number;
  traceId?: string;
}

type AnyRecord = Record<string, unknown>;

export function mapApiErrorToFormState(error: unknown, fallbackMessage = 'saveError'): FormApiErrorState {
  const payload = unwrapPayload(error);
  const status = error instanceof HttpErrorResponse ? error.status : numberValue(recordValue(payload, 'status'));
  const fieldErrors = extractFieldErrors(payload);
  const apiError = firstText(
    recordValue(payload, 'message'),
    recordValue(payload, 'detail'),
    recordValue(payload, 'title'),
    recordValue(payload, 'error'),
    recordValue(recordValue(payload, 'data'), 'message')
  );

  return {
    apiError: apiError || (fieldErrors.length > 0 ? null : fallbackMessage),
    apiFieldErrors: fieldErrors,
    status,
    traceId: firstText(recordValue(payload, 'traceId'), recordValue(recordValue(payload, 'data'), 'traceId')) || undefined
  };
}

function unwrapPayload(error: unknown): unknown {
  if (error instanceof HttpErrorResponse) {
    return error.error ?? error;
  }
  return error;
}

function extractFieldErrors(payload: unknown): FormValidationError[] {
  const record = asRecord(payload);
  const data = asRecord(record['data']);
  const candidates = [
    record['fieldErrors'],
    record['validationErrors'],
    record['violations'],
    record['errors'],
    data['fieldErrors'],
    data['validationErrors'],
    data['violations'],
    data['errors']
  ];

  return candidates.flatMap((candidate) => normalizeFieldErrorCandidate(candidate));
}

function normalizeFieldErrorCandidate(candidate: unknown): FormValidationError[] {
  if (!candidate) {
    return [];
  }

  if (Array.isArray(candidate)) {
    return candidate.flatMap((item) => normalizeFieldErrorItem(item));
  }

  const record = asRecord(candidate);
  return Object.entries(record).flatMap(([fieldPath, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages
      .map((message) => messageFromValue(message))
      .filter(Boolean)
      .map((message) => ({
        fieldPath: normalizeFieldPath(fieldPath),
        message,
        severity: 'error' as const
      }));
  });
}

function normalizeFieldErrorItem(item: unknown): FormValidationError[] {
  if (typeof item === 'string') {
    return [];
  }

  const record = asRecord(item);
  const fieldPath = firstText(
    record['fieldPath'],
    record['field'],
    record['property'],
    record['propertyPath'],
    record['name'],
    record['path']
  );
  const message = firstText(record['message'], record['defaultMessage'], record['reason'], record['error']);

  if (!fieldPath || !message) {
    return [];
  }

  return [
    {
      fieldPath: normalizeFieldPath(fieldPath),
      message,
      severity: 'error'
    }
  ];
}

function normalizeFieldPath(fieldPath: string): string {
  return fieldPath
    .replace(/^\$\./, '')
    .replace(/^(body|model|payload|request)\./, '')
    .replace(/\[(\w+)\]/g, '.$1');
}

function messageFromValue(value: unknown): string {
  const record = asRecord(value);
  return firstText(record['message'], record['defaultMessage'], record['reason'], value);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function numberValue(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function recordValue(value: unknown, key: string): unknown {
  return asRecord(value)[key];
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}
