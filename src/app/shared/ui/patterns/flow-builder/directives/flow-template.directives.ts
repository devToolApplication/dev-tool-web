import { Directive, Input, TemplateRef, inject } from '@angular/core';

@Directive({ selector: '[appFlowNodeTemplate]', standalone: false })
export class FlowNodeTemplateDirective {
  public readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  @Input('appFlowNodeTemplate') type!: string;
}

@Directive({ selector: '[appFlowEdgeTemplate]', standalone: false })
export class FlowEdgeTemplateDirective {
  public readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  @Input('appFlowEdgeTemplate') type!: string;
}

@Directive({ selector: '[appFlowInspectorTemplate]', standalone: false })
export class FlowInspectorTemplateDirective {
  public readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  @Input('appFlowInspectorTemplate') type!: string;
}

@Directive({ selector: '[appFlowToolbarTemplate]', standalone: false })
export class FlowToolbarTemplateDirective {
  public readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  @Input('appFlowToolbarTemplate') slot!: string;
}
