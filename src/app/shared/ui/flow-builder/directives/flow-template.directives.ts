import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({ selector: '[appFlowNodeTemplate]', standalone: false })
export class FlowNodeTemplateDirective {
  @Input('appFlowNodeTemplate') type!: string;
  constructor(public readonly templateRef: TemplateRef<any>) {}
}

@Directive({ selector: '[appFlowEdgeTemplate]', standalone: false })
export class FlowEdgeTemplateDirective {
  @Input('appFlowEdgeTemplate') type!: string;
  constructor(public readonly templateRef: TemplateRef<any>) {}
}

@Directive({ selector: '[appFlowInspectorTemplate]', standalone: false })
export class FlowInspectorTemplateDirective {
  @Input('appFlowInspectorTemplate') type!: string;
  constructor(public readonly templateRef: TemplateRef<any>) {}
}

@Directive({ selector: '[appFlowToolbarTemplate]', standalone: false })
export class FlowToolbarTemplateDirective {
  @Input('appFlowToolbarTemplate') slot!: string;
  constructor(public readonly templateRef: TemplateRef<any>) {}
}
