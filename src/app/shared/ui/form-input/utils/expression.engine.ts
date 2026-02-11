export class ExpressionEngine {

  private cache = new Map<string, Function>();

  private compile(expression: string) {
    return new Function(
      'model',
      'user',
      'extra',
      'mode',
      'value',
      `return (${expression});`
    );
  }

  evaluate(expression: string, ctx: any): any {

    if (!this.cache.has(expression)) {
      this.cache.set(expression, this.compile(expression));
    }

    return this.cache.get(expression)!(
      ctx.model,
      ctx.user,
      ctx.extra,
      ctx.mode,
      ctx.value
    );
  }

  renderTemplate(template: string, ctx: any): string {

    return template.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      try {
        const fn = this.compile(expr);
        return fn(
          ctx.model,
          ctx.user,
          ctx.extra,
          ctx.mode,
          ctx.value
        );
      } catch {
        return '';
      }
    });
  }
}
