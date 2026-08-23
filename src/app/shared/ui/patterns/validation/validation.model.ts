export interface ValidationRule {
  type?: 'required' | 'min' | 'max' | 'regex' | 'expression' | 'custom';
  expression?: string;
  value?: unknown;
  validator?: string;
  message: string;
  severity?: 'error' | 'warning';
}
