import type { ValidationRule } from '../models/form-config.model';

/**
 * Helper tạo rule nhanh
 */
function rule(expression: string, message: string): ValidationRule {
  return { expression, message };
}

/**
 * Bộ rule thường dùng
 */
export const Rules = {
  // =========================
  // REQUIRED
  // =========================
  required(message = 'This field is required'): ValidationRule {
    return rule(
      'value == null || (typeof value === "string" ? value.trim() === "" : value === "")',
      message,
    );
  },

  requiredArray(message = 'At least one item is required'): ValidationRule {
    return rule('!value || value.length === 0', message);
  },

  requiredTrue(message = 'This field must be checked'): ValidationRule {
    return rule('value !== true', message);
  },

  // =========================
  // NUMBER
  // =========================
  min(min: number, message?: string): ValidationRule {
    return rule(`value == null || value < ${min}`, message ?? `Value must be >= ${min}`);
  },

  max(max: number, message?: string): ValidationRule {
    return rule(`value == null || value > ${max}`, message ?? `Value must be <= ${max}`);
  },

  positive(message = 'Value must be greater than 0'): ValidationRule {
    return rule('value == null || value <= 0', message);
  },

  range(min: number, max: number, message?: string): ValidationRule {
    return rule(
      `value == null || value < ${min} || value > ${max}`,
      message ?? `Value must be between ${min} and ${max}`,
    );
  },

  // =========================
  // STRING
  // =========================
  minLength(length: number, message?: string): ValidationRule {
    return rule(`!value || value.length < ${length}`, message ?? `Minimum length is ${length}`);
  },

  maxLength(length: number, message?: string): ValidationRule {
    return rule(`value && value.length > ${length}`, message ?? `Maximum length is ${length}`);
  },

  email(message = 'Invalid email format'): ValidationRule {
    return rule('!value || helpers.isEmail(value) === false', message);
  },

  pattern(regex: string, message = 'Invalid format'): ValidationRule {
    return rule(
      `!value || helpers.matchesPattern(value, ${JSON.stringify(regex)}) === false`,
      message,
    );
  },

  // =========================
  // DATE
  // =========================
  before(dateExpr: string, message?: string): ValidationRule {
    return rule(
      `!value || helpers.isBeforeDate(value, ${dateExpr}) === false`,
      message ?? `Date must be before ${dateExpr}`,
    );
  },

  after(dateExpr: string, message?: string): ValidationRule {
    return rule(
      `!value || helpers.isAfterDate(value, ${dateExpr}) === false`,
      message ?? `Date must be after ${dateExpr}`,
    );
  },
};
