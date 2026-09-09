export type TaskScreenValidationResult =
  | boolean
  | string
  | { valid: boolean; errorMessage?: string }
  | null
  | undefined;

export interface TaskScreenAdapter {
  /**
   * Validates screen-specific form or selection before an action is submitted.
   * Return true or { valid: true } if valid.
   * Return false, error string, or { valid: false, errorMessage: string } if invalid.
   */
  validate(action: string): TaskScreenValidationResult;

  /**
   * Builds screen-specific variables for the given action to be submitted to backend.
   */
  buildVariables(action: string): Record<string, unknown> | undefined;
}

export function isTaskScreenValid(
  result: TaskScreenValidationResult,
): { valid: boolean; errorMessage?: string } {
  if (result === true || result === null || result === undefined) {
    return { valid: true };
  }
  if (result === false) {
    return { valid: false };
  }
  if (typeof result === 'string') {
    return { valid: false, errorMessage: result };
  }
  return { valid: result.valid, errorMessage: result.errorMessage };
}