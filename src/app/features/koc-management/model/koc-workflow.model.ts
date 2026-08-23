export interface KocWorkflowTemplateSummary {
  templateId: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface KocScreeningTemplateSummary {
  templateId: string;
  name: string;
  description?: string;
  ruleCount: number;
  active: boolean;
}
