declare module 'bpmn-moddle' {
  export class BpmnModdle {
    constructor(packages?: Record<string, unknown>);
    create(type: string, properties?: Record<string, unknown>): any;
    fromXML(
      xml: string,
      typeName?: string,
      options?: Record<string, unknown>,
    ): Promise<{ rootElement: any; warnings: unknown[] }>;
    toXML(element: any, options?: Record<string, unknown>): Promise<{ xml: string }>;
  }
}
